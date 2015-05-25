var cassandra = require('cassandra-driver');
var async = require('async');
var _ = require('lodash');
var mention = new RegExp('@[a-zA-Z0-9]+', 'g');
var sanitizeHtml = require('sanitize-html');
var FEEDS = ['feed_timeline', 'user_timeline'];
var Uuid = cassandra.types.Uuid;
var TimeUuid = cassandra.types.TimeUuid;

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
module.exports = function (client, messaging) {

  var q = require('./db/queries');
  var query = require('./query')(client);

  function clean (input) {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }

  function addUser (keyspace, username, altid, userdata, next) {
    userdata = _.mapValues(userdata, function (value) { return value.toString(); }); // Always ensure our userdata is <text,text>
    var userid = Uuid.random();
    var user = [userid, username, '' + altid, userdata];
    client.execute(q(keyspace, 'upsertUser'), user, {prepare: true, hints: [null, null, 'map']}, function (err, result) {
      if (err) { return next(err); }
      next(null, {user: userid, username: username, altid: altid, userdata: userdata});
    });
  }

  function addPost (keyspace, user, content, timestamp, isprivate, ispersonal, next) {
    var post = Uuid.random();
    var data = [post, user, clean(content), timestamp, isprivate, ispersonal];
    client.execute(q(keyspace, 'upsertPost'), data, {prepare: true}, function (err, result) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      _addFeedItem(keyspace, user, post, 'post', isprivate, ispersonal, function (err, result) {
        if (err) { return next(err); }
        next(null, {post: post, user: user, content: clean(content), timestamp: timestamp, isprivate: isprivate, ispersonal: ispersonal});
      });
    });
  }

  function addPostByName (keyspace, username, content, timestamp, isprivate, ispersonal, next) {
    query.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      addPost(keyspace, user.user, content, timestamp, isprivate, ispersonal, next);
    });
  }

  function removePost (keyspace, user, post, next) {
    query.getPost(keyspace, user, post, function (err, postItem) {
      if (err) { return next(err); }
      var deleteData = [post];
      client.execute(q(keyspace, 'removePost'), deleteData, {prepare: true}, function (err, result) {
        if (err) return next(err);
        _removeFeedsForItem(keyspace, post, function (err) {
          if (err) return next(err);
          next(null, {status: 'removed'});
        });
      });
    });
  }

  function addLike (keyspace, user, item, timestamp, next) {
    var like = Uuid.random();
    var data = [like, user, clean(item), timestamp];
    client.execute(q(keyspace, 'upsertLike'), data, {prepare: true}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      _addFeedItem(keyspace, user, like, 'like', false, false, function (err, result) {
        if (err) { return next(err); }
        next(null, {like: like, user: user, item: item, timestamp: timestamp});
      });
    });
  }

  function addLikeByName (keyspace, username, item, timestamp, next) {
    query.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      addLike(keyspace, user.user, item, timestamp, next);
    });
  }

  function removeLike (keyspace, user, item, next) {
    query.checkLike(keyspace, user, item, function (err, like) {
      if (err || !like) { return next(err); }
      var deleteData = [user, item];
      client.execute(q(keyspace, 'removeLike'), deleteData, {prepare: true}, function (err, result) {
        if (err) return next(err);
        _removeFeedsForItem(keyspace, like.like, function (err) {
          if (err) return next(err);
          next(null, {status: 'removed'});
        });
      });
    });
  }

  function addFriend (keyspace, user, user_friend, timestamp, next) {
    var friend = Uuid.random();
    addFriendOneWay(keyspace, friend, user, user_friend, timestamp, function (err) {
      if (err) { return next(err); }
      var reciprocalFriend = Uuid.random();
      addFriendOneWay(keyspace, reciprocalFriend, user_friend, user, timestamp, function (err) {
        if (err) { return next(err); }
        next(null, {friend: friend, reciprocal: reciprocalFriend, user: user, user_friend: user_friend, timestamp: timestamp});
      });
    });
  }

  function addFriendOneWay (keyspace, friend, user, user_friend, timestamp, next) {
    var data = [friend, user, user_friend, timestamp];
    client.execute(q(keyspace, 'upsertFriend'), data, {prepare: true}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      _addFeedItem(keyspace, user, friend, 'friend', true, false, next);
    });
  }

  function addFriendRequest (keyspace, user, user_friend, message, timestamp, next) {
    var friend_request = Uuid.random();
    var data = [friend_request, user, user_friend, clean(message), timestamp];
    client.execute(q(keyspace, 'upsertFriendRequest'), data, {prepare: true}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      next(null, {friend_request: friend_request, user: user, user_friend: user_friend, message: clean(message), timestamp: timestamp});
    });
  }

  function acceptFriendRequest (keyspace, user, friend_request_id, next) {
    query.getFriendRequest(keyspace, user, friend_request_id, function (err, friend_request) {
      if (err) { return next(err); }
      var data = [friend_request_id];
      client.execute(q(keyspace, 'acceptFriendRequest'), data, {prepare: true}, function (err) {
        /* istanbul ignore if */
        if (err) { return next(err); }
        addFriend(keyspace, friend_request.user, friend_request.user_friend, Date.now(), next);
      });
    });
  }

  function removeFriend (keyspace, user, user_friend, next) {
    query.isFriend(keyspace, user, user_friend, function (err, isFriend, isFriendSince, friend) {
      if (err || !isFriend) { return next(err); }
      var deleteData = [user, user_friend];
      var deleteDataReciprocal = [user_friend, user];
      client.execute(q(keyspace, 'removeFriend'), deleteData, {prepare: true}, function (err, result) {
        if (err) return next(err);
        client.execute(q(keyspace, 'removeFriend'), deleteDataReciprocal, {prepare: true}, function (err, result) {
          if (err) return next(err);
          _removeFeedsForItem(keyspace, friend.friend, function (err) {
            if (err) return next(err);
            next(null, {status: 'removed'});
          });
        });
      });
    });
  }

  function addFriendByName (keyspace, username, username_friend, timestamp, next) {
    query.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      query.getUserByName(keyspace, username_friend, function (err, friend) {
        if (err || !friend) { return next(err); }
        addFriend(keyspace, user.user, friend.user, timestamp, next);
      });
    });
  }

  function addFollower (keyspace, user, user_follower, timestamp, isprivate, ispersonal, next) {
    var follow = Uuid.random();
    var data = [follow, user, user_follower, timestamp, isprivate, ispersonal];
    client.execute(q(keyspace, 'upsertFollower'), data, {prepare: true}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      _addFeedItem(keyspace, user, follow, 'follow', isprivate, ispersonal, function (err, result) {
        if (err) { return next(err); }
        next(null, {follow: follow, user: user, user_follower: user_follower, isprivate: isprivate, ispersonal: ispersonal, timestamp: timestamp});
      });
    });
  }

  function addFollowerByName (keyspace, username, username_follower, timestamp, isprivate, ispersonal, next) {
    query.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      query.getUserByName(keyspace, username_follower, function (err, follower) {
        if (err || !follower) { return next(err); }
        addFollower(keyspace, user.user, follower.user, timestamp, isprivate, ispersonal, next);
      });
    });
  }

  function removeFollower (keyspace, user, user_follower, next) {
    query.isFollower(keyspace, user, user_follower, function (err, isFollower, isFollowerSince, follow) {
      if (err || !isFollower) { return next(err); }
      var deleteData = [user, user_follower];
      client.execute(q(keyspace, 'removeFollower'), deleteData, {prepare: true}, function (err, result) {
        if (err) return next(err);
        _removeFeedsForItem(keyspace, follow.follow, function (err) {
          if (err) return next(err);
          next(null, {status: 'removed'});
        });
      });
    });
  }

  function insertFollowersTimeline (item, next) {
    if (item.ispersonal) { return next(); }
    client.execute(q(item.keyspace, 'selectFollowers'), [item.user], {prepare: true}, function (err, data) {
      /* istanbul ignore if */
      if (err || data.rows.length === 0) { return next(err); }
      async.map(data.rows, function (row, cb2) {
        var followIsPrivate = item.isprivate, followIsPersonal = item.ispersonal;
        query.isFriend(item.keyspace, row.user, row.user_follower, function (err, isFriend) {
          if (err) { return cb2(err); }
          if (!item.isprivate || (item.isprivate && isFriend)) {
            var data = [row.user_follower, item.item, item.type, TimeUuid.now(), followIsPrivate, followIsPersonal];
            client.execute(q(item.keyspace, 'upsertUserTimeline', {TIMELINE: 'feed_timeline'}), data, {prepare: true}, cb2);
          } else {
            cb2();
          }
        });
      }, next);
    });
  }

  function insertMentionedTimeline (item, next) {

    var getPost = function (cb) {
      query.getPost(item.keyspace, item.user, item.item, function (err, post) {
        if (err || !post) return cb();
        cb(null, post.content);
      });
    };

    var getMentionedUsers = function (content, cb) {
      if (!cb) { return content(); } // no mentioned users
      var users = content.match(mention);
      if (users && users.length > 0) {
        users = users.map(function (user) { return user.replace('@', ''); });
        async.map(users, function (username, cb2) {
          query.getUserByName(item.keyspace, username, function (err, mentionedUser) {
            if (err || !mentionedUser) {
              return cb2();
            }
            query.isFriend(item.keyspace, mentionedUser.user, item.user, function (err, isFriend) {
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
        var followers = _.map(_.pluck(data.rows || [], 'user_follower'), function (item) { return item.toString(); });
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
          var data = [mentionedUser.user, item.item, item.type, TimeUuid.now(), item.isprivate, item.ispersonal];
          client.execute(q(item.keyspace, 'upsertUserTimeline', {TIMELINE: 'feed_timeline'}), data, {prepare: true}, cb2);
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

  function _addFeedItem (keyspace, user, item, type, isprivate, ispersonal, next) {

    var jobData = {
      keyspace: keyspace,
      user: user,
      item: item,
      type: type,
      isprivate: isprivate,
      ispersonal: ispersonal
    };

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
        var data = [user, item, type, TimeUuid.now(), isprivate, ispersonal];
        client.execute(q(keyspace, 'upsertUserTimeline', {TIMELINE: timeline}), data, {prepare: true}, cb2);
      }, cb);
    };

    async.series([
      insertUserTimelines,
      _insertFollowersTimeline,
      _insertMentionedTimeline
    ], next);

  }

  function _removeFeedsForItem (keyspace, item, next) {
    async.map(FEEDS, function (timeline, cb) {
      _removeFeedsForItemFromTimeline(keyspace, timeline, item, cb);
    }, next);
  }

  function _removeFeedsForItemFromTimeline (keyspace, timeline, item, next) {
    var queryData = [item];
    client.execute(q(keyspace, 'selectAllItems', {TIMELINE: timeline}), queryData, {prepare: true}, function (err, data) {
      /* istanbul ignore if */
      if (err || data.rows.length === 0) { return next(err); }
      async.map(data.rows, function (row, cb) {
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

  return {
    addUser: addUser,
    addPost: addPost,
    addPostByName: addPostByName,
    removePost: removePost,
    addLike: addLike,
    addLikeByName: addLikeByName,
    removeLike: removeLike,
    addFriend: addFriend,
    addFriendByName: addFriendByName,
    addFriendRequest: addFriendRequest,
    removeFriend: removeFriend,
    acceptFriendRequest: acceptFriendRequest,
    addFollower: addFollower,
    addFollowerByName: addFollowerByName,
    removeFollower: removeFollower,
    insertFollowersTimeline: insertFollowersTimeline,
    insertMentionedTimeline: insertMentionedTimeline
  };

};
