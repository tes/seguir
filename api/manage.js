var cassandra = require('cassandra-driver');
var async = require('async');
var moment = require('moment');

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
module.exports = function(client, keyspace) {

  var q = require('../db/queries')(keyspace);
  var query = require('./query')(client, keyspace);

  function addUser(username, next) {
    var userid = cassandra.types.uuid();
    var user = [userid, username];
    client.execute(q('upsertUser'), user, function(err, result) {
      next(err, {user: userid, username: username});
    });
  }

  function addPost(user, content, timestamp, isprivate, next) {

    var post = cassandra.types.uuid();
    var data = [post, user, content, timestamp, isprivate];
    client.execute(q('upsertPost'), data, {prepare:true}, function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(user, post, 'post', isprivate, function(err, result) {
        next(err, {post: post, user: user, content: content, timestamp: timestamp, isprivate: isprivate});
      });
    });

  }

  function addPostByName(username, content, timestamp, isprivate, next) {
    query.getUserByName(username, function(err, user) {
      if(err || !user) { return next(err); }
      addPost(user.user, content, timestamp, isprivate, next);
    });
  }

  function addLike(user, item, timestamp, next) {

    var like = cassandra.types.uuid();
    var data = [like, user, item, timestamp];

    client.execute(q('upsertLike'), data, {prepare:true}, function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(user, like, 'like', false, function(err, result) {
        next(err, {like: like, user: user, item: item, timestamp: timestamp});
      });
    });

  }

  function addLikeByName(username, item, timestamp, next) {
    query.getUserByName(username, function(err, user) {
      if(err || !user) { return next(err); }
      addLike(user.user, item, timestamp, next);
    });
  }

  function addFriend(user, user_friend, timestamp, next) {
    var friend = cassandra.types.uuid();
    addFriendOneWay(friend, user, user_friend, timestamp, function(err) {
      var reciprocalFriend = cassandra.types.uuid();
      addFriendOneWay(reciprocalFriend, user_friend, user, timestamp, function(err) {
        next(err, {friend: friend, reciprocal: reciprocalFriend, user: user, user_friend: user_friend, timestamp: timestamp});
      });
    });
  }

  function addFriendOneWay(friend, user, user_friend, timestamp, next) {
    var data = [friend, user, user_friend, timestamp];
    client.execute(q('upsertFriend'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(user, friend, 'friend', true, next);
    });
  }

  function removeFriend(friend, next) {
    var data = [friend];
    client.execute(q('removeFriend'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      next(err, {status:'removed'});
    });
  }

  function addFriendByName(username, username_friend, timestamp, next) {
    query.getUserByName(username, function(err, user) {
      if(err || !user) { return next(err); }
      query.getUserByName(username_friend, function(err, friend) {
        if(err || !friend) { return next(err); }
        addFriend(user.user, friend.user, timestamp, next);
      });
    });
  }

  function addFollower(user, user_follower, timestamp, next) {
    var follow = cassandra.types.uuid();
    var data = [follow, user, user_follower, timestamp];
    client.execute(q('upsertFollower'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(user, follow, 'follow', false, function(err, result) {
        next(err, {follow: follow, user: user, user_follower: user_follower, timestamp: timestamp});
      });
    });
  }

  function addFollowerByName(username, username_follower, timestamp, next) {
    query.getUserByName(username, function(err, user) {
      if(err || !user) { return next(err); }
      query.getUserByName(username_follower, function(err, follower) {
        if(err || !follower) { return next(err); }
        addFollower(user.user, follower.user, timestamp, next);
      });
    });
  }

  function _addFeedItem(user, item, type, isprivate, next) {

    var insertUserTimeline = function(cb) {
      var data = [user, item, type, cassandra.types.timeuuid(), isprivate];
      client.execute(q('upsertUserTimeline'), data, {prepare:true}, cb);
    }

    var insertFollowersTimeline = function(cb) {
      client.execute(q('selectFollowers'), [user], {prepare:true} ,function(err, data) {
        /* istanbul ignore if */
        if(err || data.rows.length == 0) { return cb(err); }
        async.map(data.rows, function(row, cb2) {
          query.isFriend(row.user, row.user_follower, function(err, isFriend) {
            if(!isprivate || (isprivate && isFriend)) {
              var data = [row.user_follower, item, type, cassandra.types.timeuuid(), isprivate];
              client.execute(q('upsertUserTimeline'), data, {prepare:true}, cb2);
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
    addFollower: addFollower,
    addFollowerByName: addFollowerByName
  }

}
