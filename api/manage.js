var cassandra = require('cassandra-driver');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');

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
module.exports = function(client) {

  var q = require('./db/queries');
  var query = require('./query')(client);

  function addUser(keyspace, username, userdata, next) {
    userdata = _.mapValues(userdata , function(value) { return value.toString(); }); // Always ensure our userdata is <text,text>
    var userid = cassandra.types.uuid();
    var user = [userid, username, userdata];
    client.execute(q(keyspace, 'upsertUser'), user, {prepare:true, hints:[null, null, 'map']}, function(err, result) {
      if(err) { return next(err); }
      next(null, {user: userid, username: username, userdata: userdata});
    });
  }

  function addPost(keyspace, user, content, timestamp, isprivate, next) {

    var post = cassandra.types.uuid();
    var data = [post, user, content, timestamp, isprivate];
    client.execute(q(keyspace, 'upsertPost'), data, {prepare:true}, function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(keyspace, user, post, 'post', isprivate, function(err, result) {
        next(err, {post: post, user: user, content: content, timestamp: timestamp, isprivate: isprivate});
      });
    });

  }

  function addPostByName(keyspace, username, content, timestamp, isprivate, next) {
    query.getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      addPost(keyspace, user.user, content, timestamp, isprivate, next);
    });
  }

  function addLike(keyspace, user, item, timestamp, next) {
    var like = cassandra.types.uuid();
    var data = [like, user, item, timestamp];
    client.execute(q(keyspace, 'upsertLike'), data, {prepare:true}, function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(keyspace, user, like, 'like', false, function(err, result) {
        next(err, {like: like, user: user, item: item, timestamp: timestamp});
      });
    });
  }

  function addLikeByName(keyspace, username, item, timestamp, next) {
    query.getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      addLike(keyspace, user.user, item, timestamp, next);
    });
  }

  function addFriend(keyspace, user, user_friend, timestamp, next) {
    var friend = cassandra.types.uuid();
    addFriendOneWay(keyspace, friend, user, user_friend, timestamp, function(err) {
      var reciprocalFriend = cassandra.types.uuid();
      addFriendOneWay(keyspace, reciprocalFriend, user_friend, user, timestamp, function(err) {
        next(err, {friend: friend, reciprocal: reciprocalFriend, user: user, user_friend: user_friend, timestamp: timestamp});
      });
    });
  }

  function addFriendOneWay(keyspace, friend, user, user_friend, timestamp, next) {
    var data = [friend, user, user_friend, timestamp];
    client.execute(q(keyspace, 'upsertFriend'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(keyspace, user, friend, 'friend', true, next);
    });
  }

  function addFriendRequest(keyspace, user, user_friend, message, timestamp, next) {
    var friend_request = cassandra.types.uuid();
    var data = [friend_request, user, user_friend, message, timestamp];
    client.execute(q(keyspace, 'upsertFriendRequest'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      next(null, {friend_request: friend_request, user: user, user_friend: user_friend, message: message, timestamp: timestamp});
    });
  }

  function acceptFriendRequest(keyspace, liu, friend_request_id, next) {
    query.getFriendRequest(keyspace, liu, friend_request_id, function(err, friend_request) {
      if(err) { return next(err); }
      var data = [friend_request_id];
      client.execute(q(keyspace, 'acceptFriendRequest'), data, {prepare:true},  function(err) {
        /* istanbul ignore if */
        if(err) { return next(err); }
        addFriend(keyspace, friend_request.user, friend_request.user_friend, Date.now(), next);
      });
    });
  }

  function removeFriend(keyspace, friend, next) {
    var data = [friend];
    client.execute(q(keyspace, 'removeFriend'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      next(err, {status:'removed'});
    });
  }

  function addFriendByName(keyspace, username, username_friend, timestamp, next) {
    query.getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      query.getUserByName(keyspace, username_friend, function(err, friend) {
        if(err || !friend) { return next(err); }
        addFriend(keyspace, user.user, friend.user, timestamp, next);
      });
    });
  }

  function addFollower(keyspace, user, user_follower, timestamp, next) {
    var follow = cassandra.types.uuid();
    var data = [follow, user, user_follower, timestamp];
    client.execute(q(keyspace, 'upsertFollower'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(keyspace, user, follow, 'follow', false, function(err, result) {
        next(err, {follow: follow, user: user, user_follower: user_follower, timestamp: timestamp});
      });
    });
  }

  function addFollowerByName(username, username_follower, timestamp, next) {
    query.getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      query.getUserByName(keyspace, username_follower, function(err, follower) {
        if(err || !follower) { return next(err); }
        addFollower(keyspace, user.user, follower.user, timestamp, next);
      });
    });
  }

  function _addFeedItem(keyspace, user, item, type, isprivate, next) {

    var insertUserTimeline = function(cb) {
      var data = [user, item, type, cassandra.types.timeuuid(), isprivate];
      client.execute(q(keyspace, 'upsertUserTimeline'), data, {prepare:true}, cb);
    }

    var insertFollowersTimeline = function(cb) {
      client.execute(q(keyspace, 'selectFollowers'), [user], {prepare:true} ,function(err, data) {
        /* istanbul ignore if */
        if(err || data.rows.length == 0) { return cb(err); }
        async.map(data.rows, function(row, cb2) {
          query.isFriend(keyspace, row.user, row.user_follower, function(err, isFriend) {
            if(!isprivate || (isprivate && isFriend)) {
              var data = [row.user_follower, item, type, cassandra.types.timeuuid(), isprivate];
              client.execute(q(keyspace, 'upsertUserTimeline'), data, {prepare:true}, cb2);
            } else {
              cb2();
            }
          });
        }, cb);
      });
    }

    async.series([
      insertUserTimeline,
      insertFollowersTimeline
    ], next);

  }

  return {
    addUser: addUser,
    addPost: addPost,
    addPostByName: addPostByName,
    addLike: addLike,
    addLikeByName: addLikeByName,
    addFriend: addFriend,
    addFriendByName: addFriendByName,
    addFriendRequest: addFriendRequest,
    acceptFriendRequest: acceptFriendRequest,
    addFollower: addFollower,
    addFollowerByName: addFollowerByName
  }

}
