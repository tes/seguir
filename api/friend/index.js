var cassandra = require('cassandra-driver');
var Uuid = cassandra.types.Uuid;
var _ = require('lodash');
var async = require('async');

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

  var q = require('../db/queries');

  function addFriend (keyspace, user, user_friend, timestamp, next) {
    var friend = Uuid.random();
    addFriendOneWay(keyspace, friend, user, user_friend, timestamp, function (err) {
      if (err) { return next(err); }
      var reciprocalFriend = Uuid.random();
      addFriendOneWay(keyspace, reciprocalFriend, user_friend, user, timestamp, function (err) {
        if (err) { return next(err); }
        var tempFriend = {
          friend: friend,
          reciprocal: reciprocalFriend,
          user: user,
          user_friend: user_friend,
          timestamp: timestamp
        };
        api.user.mapUserIdToUser(keyspace, tempFriend, ['user', 'user_friend'], user, next);
      });
    });
  }

  function addFriendOneWay (keyspace, friend, user, user_friend, timestamp, next) {
    var data = [friend, user, user_friend, timestamp];
    client.execute(q(keyspace, 'upsertFriend'), data, {prepare: true}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.feed.addFeedItem(keyspace, user, friend, 'friend', true, false, timestamp, next);
    });
  }

  function addFriendRequest (keyspace, user, user_friend, message, timestamp, next) {
    var friend_request = Uuid.random();
    var cleanMessage = api.common.clean(message);
    var data = [friend_request, user, user_friend, cleanMessage, timestamp];
    client.execute(q(keyspace, 'upsertFriendRequest'), data, {prepare: true}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      next(null, {friend_request: friend_request, user: user, user_friend: user_friend, message: cleanMessage, timestamp: timestamp});
    });
  }

  function acceptFriendRequest (keyspace, user, friend_request_id, next) {
    getFriendRequest(keyspace, user, friend_request_id, function (err, friend_request) {
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
    isFriend(keyspace, user, user_friend, function (err, isFriend, isFriendSince, friend) {
      if (err || !isFriend) { return next(err); }
      var deleteData = [user, user_friend];
      var deleteDataReciprocal = [user_friend, user];
      client.execute(q(keyspace, 'removeFriend'), deleteData, {prepare: true}, function (err, result) {
        if (err) return next(err);
        client.execute(q(keyspace, 'removeFriend'), deleteDataReciprocal, {prepare: true}, function (err, result) {
          if (err) return next(err);
          api.feed.removeFeedsForItem(keyspace, friend.friend, function (err) {
            if (err) return next(err);
            next(null, {status: 'removed'});
          });
        });
      });
    });
  }

  function addFriendByName (keyspace, username, username_friend, timestamp, next) {
    api.user.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      api.user.getUserByName(keyspace, username_friend, function (err, friend) {
        if (err || !friend) { return next(err); }
        addFriend(keyspace, user.user, friend.user, timestamp, next);
      });
    });
  }

  function getFriend (keyspace, liu, friend, next) {
    api.common.get(keyspace, 'selectFriend', [friend], 'one', function (err, friendship) {
       /* istanbul ignore if */
      if (err) { return next(err); }
      isFriend(keyspace, friendship.user_friend, liu, function (err, ok) {
        if (err) { return next(err); }
        if (!ok) { return next({statusCode: 403, message: 'You are not allowed to see this item.'}); }
        api.user.getUser(keyspace, friendship.user_friend, function (err, user) {
          if (err) { return next(err); }
          friendship.username_friend = user.username;
          api.user.mapUserIdToUser(keyspace, friendship, ['user', 'user_friend'], user, next);
        });
      });
    });
  }

  function canSeePrivate (keyspace, liu, user, next) {
    if (liu === user) { return next(null, true); }
    isFriend(keyspace, liu, user, next);
  }

  function getFriends (keyspace, liu, user, next) {
    isFriend(keyspace, user, liu, function (err, ok) {
      if (err) { return next(err); }
      if (!ok) { return next({statusCode: 403, message: 'You are not allowed to see this item.'}); }
      api.common.get(keyspace, 'selectFriends', [user], 'many', function (err, friends) {
        if (err) { return next(err); }
        api.user.mapUserIdToUser(keyspace, friends, ['user_friend'], user, next);
      });
    });
  }

  function friendsInCommon (keyspace, liu, user, next) {
    if (liu === user) return next();
    async.parallel([
      function (cb) {
        client.execute(q(keyspace, 'selectFriends'), [liu], {prepare: true}, function (err, result) {
          if (err) return cb(err);
          cb(null, _.pluck(result.rows, 'user_friend'));
        });
      },
      function (cb) {
        client.execute(q(keyspace, 'selectFriends'), [user], {prepare: true}, function (err, result) {
          if (err) return cb(err);
          cb(null, _.pluck(result.rows, 'user_friend'));
        });
      }
    ], function (err, results) {
      if (err) { return next(err); }
      var inCommon = _.uniq(_.filter(_.intersection(results[0], results[1]), function (item) { return (item === liu || item === user) ? null : item; }));
      async.map(inCommon, function (id, cb) {
        user.getUser(keyspace, id, cb);
      }, next);
    });
  }

  function getFriendRequest (keyspace, liu, friend_request, next) {
    api.common.get(keyspace, 'selectFriendRequest', [friend_request], 'one', function (err, friendRequest) {
      if (err) { return next(err); }
      next(null, friendRequest);
    });
  }

  function getIncomingFriendRequests (keyspace, liu, next) {
    api.common.get(keyspace, 'selectIncomingFriendRequests', [liu], 'many', function (err, friendRequests) {
      if (err) { return next(err); }
      // Now, go and get user details for all the non own posts
      api.user.mapUserIdToUser(keyspace, friendRequests, ['user', 'user_friend'], liu, next);
    });
  }

  function getOutgoingFriendRequests (keyspace, liu, next) {
    api.common.get(keyspace, 'selectOutgoingFriendRequests', [liu], 'many', function (err, friendRequests) {
      if (err) { return next(err); }
      // Now, go and get user details for all the non own posts
      api.user.mapUserIdToUser(keyspace, friendRequests, ['user', 'user_friend'], liu, next);
    });
  }

  function getFriendRequests (keyspace, liu, next) {
    getIncomingFriendRequests(keyspace, liu, function (err, incoming) {
      if (err) { return next(err); }
      getOutgoingFriendRequests(keyspace, liu, function (err, outgoing) {
        if (err) { return next(err); }
        next(null, {incoming: incoming, outgoing: outgoing});
      });
    });
  }

  function getFriendsByName (keyspace, liu, username, next) {
    api.user.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      getFriends(keyspace, liu, user.user, function (err, friends) {
        if (err || !friends) { return next(err); }
        next(null, friends);
      });
    });
  }

  function isFriend (keyspace, user, user_friend, next) {
    if (user.toString() === user_friend.toString()) { return next(null, true, null, null); }
    api.common.get(keyspace, 'isFriend', [user, user_friend], 'one', function (err, friend) {
      if (err) { return next(null, false, null, null); }
      var isFriend = !!(friend && !!friend.friend);
      var isFriendSince = isFriend ? friend.since : null;
      return next(null, isFriend, isFriendSince, friend ? friend : null);
    });
  }

  function isFriendRequestPending (keyspace, user, user_friend, next) {
    if (user.toString() === user_friend.toString()) { return next(null, false, null); }
    api.common.get(keyspace, 'selectOutgoingFriendRequests', [user], 'many', function (err, friendRequests) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      var friendRequest = _.filter(friendRequests, function (row) {
        if (row.user_friend.toString() === user_friend.toString()) {
          return row;
        }
      });
      var isFriendRequestPending = friendRequest.length > 0;
      var isFriendRequestSince = isFriendRequestPending ? friendRequest[0].since : null;

      return next(null, isFriendRequestPending, isFriendRequestSince);
    });
  }

  return {
    addFriend: addFriend,
    addFriendByName: addFriendByName,
    addFriendRequest: addFriendRequest,
    removeFriend: removeFriend,
    isFriend: isFriend,
    acceptFriendRequest: acceptFriendRequest,
    canSeePrivate: canSeePrivate,
    getFriend: getFriend,
    getFriends: getFriends,
    getFriendsByName: getFriendsByName,
    getFriendRequest: getFriendRequest,
    getFriendRequests: getFriendRequests,
    getIncomingFriendRequests: getIncomingFriendRequests,
    getOutgoingFriendRequests: getOutgoingFriendRequests,
    isFriendRequestPending: isFriendRequestPending,
    friendsInCommon: friendsInCommon
  };

};
