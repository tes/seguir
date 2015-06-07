var moment = require('moment');
var async = require('async');
var _ = require('lodash');
var debug = require('debug')('seguir:feed');

var MENTION = new RegExp('@[a-zA-Z0-9]+', 'g');
var FEEDS = ['feed_timeline', 'user_timeline'];
var DEFAULT_LIMIT = 50;

/**
 * This is a collection of methods that allow you to create, update and delete social items.
 *
 * These methods all exclude the 'loggedinuser' parameter as they are all carried out only by
 * the currently logged in user and / or system level calls (e.g. adding a user via integration
 * with an SSO flow).
 *
 * TODO: Exception may be creating a post on someone elses feed.
 *
 */
module.exports = function (client, messaging, keyspace, api) {

  var q = client.queries;

  function insertFollowersTimeline (item, next) {
    if (item.ispersonal) { return next(); }
    client.execute(q(item.keyspace, 'selectFollowers'), [item.user], {prepare: true}, function (err, data) {
      /* istanbul ignore if */
      if (err || data.length === 0) { return next(err); }
      async.map(data, function (row, cb2) {
        var followIsPrivate = item.isprivate, followIsPersonal = item.ispersonal;
        api.friend.isFriend(item.keyspace, row.user, row.user_follower, function (err, isFriend) {
          if (err) { return cb2(err); }
          if (!item.isprivate || (item.isprivate && isFriend)) {
            upsertTimeline(item.keyspace, 'feed_timeline', row.user_follower, item.item, item.type, client.generateTimeId(item.timestamp), followIsPrivate, followIsPersonal, cb2);
          } else {
            cb2();
          }
        });
      }, next);
    });
  }

  function insertMentionedTimeline (item, next) {

    var getPost = function (cb) {
      api.post.getPost(item.keyspace, item.user, item.item, function (err, post) {
        if (err || !post || post.content_type !== 'text/html') return cb();
        cb(null, post.content);
      });
    };

    var getMentionedUsers = function (content, cb) {
      if (!cb) { return content(); } // no mentioned users
      var users = content.match(MENTION);
      if (users && users.length > 0) {
        users = users.map(function (user) {
          return user.replace('@', '');
        });
        async.map(users, function (username, cb2) {
          api.user.getUserByName(item.keyspace, username, function (err, mentionedUser) {
            if (err || !mentionedUser) {
              return cb2();
            }
            api.friend.isFriend(item.keyspace, mentionedUser.user, item.user, function (err, isFriend) {
              if (err) return cb2(err);
              mentionedUser.isFriend = isFriend;
              cb2(null, mentionedUser);
            });
          });
        }, cb);
      } else {
        return cb();
      }
    };

    var getMentionedNotFollowers = function (mentioned, cb) {
      if (!cb) { return mentioned(); } // no mentioned users
      client.execute(q(item.keyspace, 'selectFollowers'), [item.user], {prepare: true}, function (err, data) {
        if (err) { return cb(err); }
        var followers = _.map(_.pluck(data || [], 'user_follower'), function (item) {
          return item.toString();
        });
        var mentionedNotFollowers = _.filter(mentioned, function (mentionedUser) {
          return !(_.contains(followers, mentionedUser.user.toString()) || mentionedUser.user.toString() === item.user.toString());
        });
        cb(null, mentionedNotFollowers);
      });
    };

    var insertMentioned = function (users, cb) {
      if (!cb) { return users(); } // no mentioned users
      async.map(users, function (mentionedUser, cb2) {
        if (!item.isprivate || (item.isprivate && mentionedUser.isFriend)) {
          upsertTimeline(item.keyspace, 'feed_timeline', mentionedUser.user, item.item, item.type, client.generateTimeId(item.timestamp), item.isprivate, item.ispersonal, cb2);
        } else {
          cb2();
        }
      }, cb);
    };

    async.waterfall([
      getPost,
      getMentionedUsers,
      getMentionedNotFollowers,
      insertMentioned
    ], next);

  }

  function addFeedItem (keyspace, user, item, type, isprivate, ispersonal, timestamp, next) {

    var jobData = {
      keyspace: keyspace,
      user: user,
      item: item,
      type: type,
      isprivate: isprivate,
      ispersonal: ispersonal,
      timestamp: timestamp
    };

    debug('Adding feed item', user, item, type, isprivate, ispersonal, timestamp);

    var _insertFollowersTimeline = function (cb) {
      if (messaging.enabled) {
        messaging.submit('seguir-publish-to-followers', jobData, cb);
      } else {
        insertFollowersTimeline(jobData, cb);
      }
    };

    var _insertMentionedTimeline = function (cb) {
      if (type !== 'post' || ispersonal) { return cb(); }
      if (messaging.enabled) {
        messaging.submit('seguir-publish-mentioned', jobData, cb);
      } else {
        insertMentionedTimeline(jobData, cb);
      }
    };

    var insertUserTimelines = function (cb) {
      async.map(FEEDS, function (timeline, cb2) {
        upsertTimeline(keyspace, timeline, user, item, type, client.generateTimeId(timestamp), isprivate, ispersonal, cb2);
      }, cb);
    };

    async.series([
      insertUserTimelines,
      _insertFollowersTimeline,
      _insertMentionedTimeline
    ], next);

  }

  function upsertTimeline (keyspace, timeline, user, item, type, time, isprivate, ispersonal, next) {
    var data = [user, item, type, time, isprivate, ispersonal];
    debug('Upsert into timeline: ', timeline, user, item, type, time);
    client.execute(q(keyspace, 'upsertUserTimeline', {TIMELINE: timeline}), data, {prepare: true}, next);
  }

  function removeFeedsForItem (keyspace, item, next) {
    async.map(FEEDS, function (timeline, cb) {
      _removeFeedsForItemFromTimeline(keyspace, timeline, item, cb);
    }, next);
  }

  function _removeFeedsForItemFromTimeline (keyspace, timeline, item, next) {
    var queryData = [item];
    client.execute(q(keyspace, 'selectAllItems', {TIMELINE: timeline}), queryData, {prepare: true}, function (err, data) {
      /* istanbul ignore if */
      if (err || data.length === 0) { return next(err); }
      async.map(data, function (row, cb) {
        _removeFeedItemFromTimeline(keyspace, timeline, row.user, row.time, cb);
      }, function (err, rows) {
        next(err);
      });
    });
  }

  function _removeFeedItemFromTimeline (keyspace, timeline, user, time, next) {
    var deleteData = [user, time];
    client.execute(q(keyspace, 'removeFromTimeline', {TIMELINE: timeline}), deleteData, {prepare: true}, function (err, result) {
      if (err) return next(err);
      next(null, {status: 'removed'});
    });
  }

  function getUserFeed (keyspace, liu, user, from, limit, next) {
    _getFeed(keyspace, liu, 'user_timeline', user, from, limit, next);
  }

  function getFeed (keyspace, liu, user, from, limit, next) {
    _getFeed(keyspace, liu, 'feed_timeline', user, from, limit, next);
  }

  function getRawFeed (keyspace, liu, user, from, limit, next) {
    _getFeed(keyspace, liu, 'feed_timeline', user, from, limit, 'raw', next);
  }

  function getReversedUserFeed (keyspace, liu, user, from, limit, next) {
    _getFeed(keyspace, liu, 'user_timeline', user, from, limit, 'raw-reverse', next);
  }

  function _getFeed (keyspace, liu, timeline, user, from, limit, raw, next) {

    if (!next) {
      next = raw;
      raw = null;
    }

    var data = [user], timeClause = '', hasMoreResults = false, limitClause = '';

    if (from) {
      var direction = raw === 'raw-reverse' ? '>' : '<';
      timeClause = ' AND time ' + direction + ' ' + from;
    }

    // We always increase the limit by one so that
    // we can figure out if we need to display a 'Show more results link'.
    // This is removed in the results to keep it consistent with expected results.
    if (!limit) limit = DEFAULT_LIMIT;
    limit = limit + 1;
    limitClause = ' LIMIT ' + limit;

    var query = q(keyspace, 'selectTimeline', {
      timeClause: timeClause,
      limitClause: limitClause,
      TIMELINE: timeline
    });

    debug(query);

    client.execute(query, data, {prepare: true}, function (err, data) {

      if (err) { return next(err); }

      if (data && data.length > 0) {

        // This is where we check if we have more results or
        // not.
        if (data.length === limit) {
          hasMoreResults = true;
          data.pop();
        }

        if (raw) { return next(null, data); }

        var timeline = data;

        async.map(timeline, function (item, cb) {

          if (item.type === 'post') {
            return api.post.getPost(keyspace, liu, item.item, function (err, post) {
              if (err && (err.statusCode === 403 || err.statusCode === 404)) {
                cb(); // Silently drop posts from the feed
              } else {
                if (err) { return cb(err); }
                cb(null, post);
              }
            });
          }
          if (item.type === 'like') { return api.like.getLike(keyspace, item.item, cb); }
          if (item.type === 'friend') {
            return api.friend.getFriend(keyspace, liu, item.item, function (err, friend) {
              if (err && (err.statusCode === 403 || err.statusCode === 404)) {
                cb(); // Silently drop these from the feed
              } else {
                if (err) { return cb(err); }
                cb(null, friend);
              }
            });
          }
          if (item.type === 'follow') {
            return api.follow.getFollow(keyspace, liu, item.item, function (err, follow) {
              if (err && (err.statusCode === 403 || err.statusCode === 404)) {
                cb(); // Silently drop private items from the feed
              } else {
                if (err) { return cb(err); }
                cb(null, follow);
              }
            });
          }

          return cb();

        }, function (err, results) {

          /* istanbul ignore if */
          if (err || !results) { return next(err); }

          var feed = [], maxTime;
          results.forEach(function (result, index) {

            if (result) {

              var currentResult = result;

              // Copy elements from feed
              currentResult.type = timeline[index].type;
              currentResult.timeuuid = timeline[index].time;
              currentResult.date = timeline[index].date;
              currentResult.fromNow = moment(currentResult.date).fromNow();
              currentResult.isprivate = timeline[index].isprivate;
              currentResult.ispersonal = timeline[index].ispersonal;

              // Calculated fields to make rendering easier
              currentResult.fromFollower = currentResult.user !== user.user;
              currentResult.isLike = currentResult.type === 'like';
              currentResult.isPost = currentResult.type === 'post';
              currentResult.isFollow = currentResult.type === 'follow';
              currentResult.isFriend = currentResult.type === 'friend';
              currentResult.isUsersItem = currentResult.user.toString() === liu.toString();

              // To page 'more'
              maxTime = currentResult.timeuuid;

              feed.push(currentResult);

            }

          });

          next(null, feed, hasMoreResults ? maxTime : null);

        });

      } else {
        if (err) { return next(err); }
        next();
      }

    });

  }

  function seedFeed (keyspace, user, userFollowing, backfill, next) {

    var backfillMatch = /(\d+)(.*)/.exec(backfill);
    var duration = backfillMatch[1] || '1';
    var period = backfillMatch[2] || 'd';
    var start = moment().subtract(+duration, period);
    var from = client.generateTimeId(start.toDate());

    getReversedUserFeed(keyspace, user, userFollowing, from, null, function (err, feed) {
      if (err) { return next(err); }
      async.map(feed, function (item, cb) {
        if (item.type !== 'post' || item.ispersonal || item.isprivate) return cb();
        upsertTimeline(keyspace, 'feed_timeline', user.user, item.item, item.type, item.time, item.isprivate, item.ispersonal, cb);
      }, next);
    });

  }

  return {
    addFeedItem: addFeedItem,
    removeFeedsForItem: removeFeedsForItem,
    insertFollowersTimeline: insertFollowersTimeline,
    insertMentionedTimeline: insertMentionedTimeline,
    getFeed: getFeed,
    getUserFeed: getUserFeed,
    getRawFeed: getRawFeed,
    seedFeed: seedFeed
  };

};
