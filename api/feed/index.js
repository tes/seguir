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
module.exports = function (api) {

  var client = api.client,
    messaging = api.messaging,
    q = client.queries;

  function insertFollowersTimeline (jobData, next) {
    if (jobData.visibility === api.visibility.PERSONAL && jobData.type !== 'follow') { return next(); }
    client.execute(q(jobData.keyspace, 'selectFollowers'), [jobData.user], {prepare: true}, function (err, data) {
      /* istanbul ignore if */
      if (err || data.length === 0) { return next(err); }
      async.map(data, function (row, cb2) {
        var isPrivate = jobData.visibility === api.visibility.PRIVATE;
        var followerIsFollower = jobData.type === 'follow' && (row.user_follower.toString() === jobData.object.user_follower.toString());
        // Follow is added to followers feed directly, not via the follow relationship
        if (followerIsFollower) { return cb2(); }
        api.friend.isFriend(jobData.keyspace, row.user, row.user_follower, function (err, isFriend) {
          if (err) { return cb2(err); }
          if (!isPrivate || (isPrivate && isFriend)) {
            upsertTimeline(jobData.keyspace, 'feed_timeline', row.user_follower, jobData.id, jobData.type, jobData.timestamp, jobData.visibility, cb2);
          } else {
            cb2();
          }
        });
      }, next);
    });
  }

  function insertMentionedTimeline (jobData, next) {

    var getPost = function (cb) {
      api.post.getPost(jobData.keyspace, jobData.user, jobData.id, function (err, post) {
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
          api.user.getUserByName(jobData.keyspace, username, function (err, mentionedUser) {
            if (err || !mentionedUser) {
              return cb2();
            }
            api.friend.isFriend(jobData.keyspace, mentionedUser.user, jobData.user, function (err, isFriend) {
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
      client.execute(q(jobData.keyspace, 'selectFollowers'), [jobData.user], {prepare: true}, function (err, data) {
        if (err) { return cb(err); }
        var followers = _.map(_.pluck(data || [], 'user_follower'), function (item) {
          return item.toString();
        });
        var mentionedNotFollowers = _.filter(mentioned, function (mentionedUser) {
          return !(_.contains(followers, mentionedUser.user.toString()) || mentionedUser.user.toString() === jobData.user.toString());
        });
        cb(null, mentionedNotFollowers);
      });
    };

    var insertMentioned = function (users, cb) {
      if (!cb) { return users(); } // no mentioned users
      async.map(users, function (mentionedUser, cb2) {
        var isPrivate = jobData.visibility === api.visibility.PRIVATE;
        if (!isPrivate || (isPrivate && mentionedUser.isFriend)) {
          upsertTimeline(jobData.keyspace, 'feed_timeline', mentionedUser.user, jobData.id, jobData.type, client.generateTimeId(jobData.timestamp), jobData.visibility, cb2);
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

  function addFeedItem (keyspace, user, object, type, next) {

    var jobData = {
      keyspace: keyspace,
      user: user,
      object: object,
      id: object[type],
      type: type,
      timestamp: client.generateTimeId(object.timestamp),
      visibility: object.visibility
    };

    debug('Adding feed item', user, object, type);

    var _insertFollowersTimeline = function (cb) {
      if (messaging.enabled) {
        messaging.submit('seguir-publish-to-followers', jobData, cb);
      } else {
        insertFollowersTimeline(jobData, cb);
      }
    };

    var _insertMentionedTimeline = function (cb) {
      if (type !== 'post' || jobData.ispersonal) { return cb(); }
      if (messaging.enabled) {
        messaging.submit('seguir-publish-mentioned', jobData, cb);
      } else {
        insertMentionedTimeline(jobData, cb);
      }
    };

    var insertUserTimelines = function (cb) {
      async.map(FEEDS, function (timeline, cb2) {
        upsertTimeline(keyspace, timeline, jobData.user, jobData.id, jobData.type, jobData.timestamp, jobData.visibility, cb2);
      }, cb);
    };

    async.series([
      insertUserTimelines,
      _insertFollowersTimeline,
      _insertMentionedTimeline
    ], next);

  }

  function upsertTimeline (keyspace, timeline, user, item, type, time, visibility, next) {
    var data = [user, item, type, time, visibility];
    debug('Upsert into timeline: ', timeline, user, item, type, time, visibility || api.visibility.PUBLIC);
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

  /**
   * A collection of helpers based on type that will expand an item in the feed
   */
  var silentlyDropError = function (err, item, next) {
    if (err && (err.statusCode === 403 || err.statusCode === 404)) {
      next(); // Silently drop posts from the feed
    } else {
      if (err) { return next(err); }
      next(null, item);
    }
  };

  function expandPost (keyspace, liu, item, cb) {
    var postObject = api.common.expandEmbeddedObject(item, 'post', 'post');
    if (postObject) {
      api.post.getPostFromObject(keyspace, liu, postObject, function (err, post) {
        silentlyDropError(err, post, cb);
      });
    } else {
      api.post.getPost(keyspace, liu, item.item, function (err, post) {
        silentlyDropError(err, post, cb);
      });
    }
  }

  function expandLike (keyspace, liu, item, cb) {
    var likeObject = api.common.expandEmbeddedObject(item, 'like', 'like');
    if (likeObject) {
      api.like.getLikeFromObject(keyspace, likeObject, cb);
    } else {
      api.like.getLike(keyspace, item.item, cb);
    }
  }

  function expandFollow (keyspace, liu, item, cb) {
    var followObject = api.common.expandEmbeddedObject(item, 'follow', 'follow');
    if (followObject) {
      api.follow.getFollowFromObject(keyspace, liu, followObject, function (err, follow) {
        silentlyDropError(err, follow, cb);
      });
    } else {
      api.follow.getFollow(keyspace, liu, item.item, function (err, follow) {
        silentlyDropError(err, follow, cb);
      });
    }
  }

  function expandFriend (keyspace, liu, item, cb) {
    var friendObject = api.common.expandEmbeddedObject(item, 'friend', 'friend');
    if (friendObject) {
      api.friend.getFriendFromObject(keyspace, liu, friendObject, function (err, friend) {
        silentlyDropError(err, friend, cb);
      });
    } else {
      api.friend.getFriend(keyspace, liu, item.item, function (err, friend) {
        silentlyDropError(err, friend, cb);
      });
    }
  }

  var feedExpanders = {
    'post': expandPost,
    'like': expandLike,
    'follow': expandFollow,
    'friend': expandFriend
  };

  function _getFeed (keyspace, liu, timeline, user, from, limit, raw, next) {

    if (!next) {
      next = raw;
      raw = null;
    }

    var data = [user], timeClause = '', hasMoreResults = false, limitClause = '';

    if (from) {
      timeClause = q(keyspace, raw === 'raw-reverse' ? 'timelineSortReverse' : 'timelineSort');
      data.push(from);
    }

    // We always increase the limit by one so that
    // we can figure out if we need to display a 'Show more results link'.
    // This is removed in the results to keep it consistent with expected results.
    if (!limit) limit = DEFAULT_LIMIT;
    limit = limit + 1;
    limitClause = q(keyspace, 'timelineLimit', {limit: limit});

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

          var expander = feedExpanders[item.type];
          if (expander) {
            return expander(keyspace, liu, item, cb);
          } else {
            console.log('Unable to expand unknown feed item type: ' + item.type);
            cb();
          }

        }, function (err, results) {

          /* istanbul ignore if */
          if (err || !results) { return next(err); }

          var feed = [], maxTime;

          results.forEach(function (result, index) {

            if (result) {

              var currentResult = result;

              // Copy elements from feed
              currentResult._item = timeline[index].item;
              currentResult.type = timeline[index].type;
              currentResult.timeuuid = timeline[index].time;
              currentResult.date = timeline[index].date;
              currentResult.fromNow = moment(currentResult.date).fromNow();
              currentResult.visibility = timeline[index].visibility || api.visibility.PUBLIC;
              currentResult.isPrivate = currentResult.visibility === api.visibility.PRIVATE;
              currentResult.isPersonal = currentResult.visibility === api.visibility.PERSONAL;
              currentResult.isPublic = currentResult.visibility === api.visibility.PUBLIC;

              // Calculated fields to make rendering easier
              currentResult.fromSomeoneYouFollow = currentResult.user.user.toString() !== user.toString();
              currentResult.isLike = currentResult.type === 'like';
              currentResult.isPost = currentResult.type === 'post';
              currentResult.isFollow = currentResult.type === 'follow';
              currentResult.isFriend = currentResult.type === 'friend';

              var currentUserIsUser = liu && currentResult.user.user.toString() === liu.toString();
              var currentUserIsFollower = liu && currentResult.user_follower ? currentResult.user_follower.user.toString() === liu.toString() : false;
              currentResult.isUsersItem = currentUserIsUser || currentUserIsFollower;
              currentResult.isFollower = currentUserIsFollower;

              // To page 'more'
              maxTime = currentResult.timeuuid;

              feed.push(currentResult);

            }

          });

          next(null, feed, hasMoreResults ? maxTime : null);

        });

      } else {
        if (err) { return next(err); }
        next(null, []);
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
        if (item.type !== 'post' || item.visibility !== api.visibility.PUBLIC) return cb();
        upsertTimeline(keyspace, 'feed_timeline', user, item.item, item.type, item.time, item.visibility, cb);
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
