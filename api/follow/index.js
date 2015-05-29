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

  function addFollower (keyspace, user, user_follower, timestamp, isprivate, ispersonal, next) {
    var follow = Uuid.random();
    var data = [follow, user, user_follower, timestamp, isprivate, ispersonal];
    client.execute(q(keyspace, 'upsertFollower'), data, {prepare: true}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.feed.addFeedItem(keyspace, user, follow, 'follow', isprivate, ispersonal, function (err, result) {
        if (err) { return next(err); }
        var follower = {
          follow: follow,
          user: user,
          user_follower: user_follower,
          isprivate: isprivate,
          ispersonal: ispersonal,
          timestamp: timestamp
        };
        api.user.mapUserIdToUser(keyspace, follower, ['user', 'user_follower'], user, next);
      });
    });
  }

  function addFollowerByName (keyspace, username, username_follower, timestamp, isprivate, ispersonal, next) {
    api.user.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      api.user.getUserByName(keyspace, username_follower, function (err, follower) {
        if (err || !follower) { return next(err); }
        addFollower(keyspace, user.user, follower.user, timestamp, isprivate, ispersonal, next);
      });
    });
  }

  function removeFollower (keyspace, user, user_follower, next) {
    isFollower(keyspace, user, user_follower, function (err, isFollower, isFollowerSince, follow) {
      if (err || !isFollower) { return next(err); }
      var deleteData = [user, user_follower];
      client.execute(q(keyspace, 'removeFollower'), deleteData, {prepare: true}, function (err, result) {
        if (err) return next(err);
        api.feed.removeFeedsForItem(keyspace, follow.follow, function (err) {
          if (err) return next(err);
          next(null, {status: 'removed'});
        });
      });
    });
  }

  function isFollower (keyspace, user, user_follower, next) {
    if (user.toString() === user_follower.toString()) {
      return next(null, true, null, {
        isprivate: false,
        ispersonal: false
      });
    }
    api.common.get(keyspace, 'isFollower', [user, user_follower], 'one', function (err, follow) {
      if (err) { return next(null, false, null, {isprivate: false, ispersonal: false}); }
      var isFollower = !!(follow && follow.follow);
      var isFollowerSince = isFollower ? follow.since : null;
      return next(null, isFollower, isFollowerSince, follow ? follow : null);
    });
  }

  function getFollow (keyspace, liu, follow, next) {

    api.common.get(keyspace, 'selectFollow', [follow], 'one', function (err, follower) {

      /* istanbul ignore if */
      if (err) { return next(err); }

      var userIsInFollow = liu.toString() === follower.user.toString() || liu.toString() === follower.user_follower.toString();

      var returnUser = function () {
        api.user.getUser(keyspace, follower.user_follower, function (err, user) {
          if (err) { return next(err); }
          follower.username_follower = user.username;
          api.user.mapUserIdToUser(keyspace, follower, ['user', 'user_follower'], user, next);
        });
      };

      // If the relationship is personal, the user must be one of the two parties.
      if (follower.ispersonal && !userIsInFollow) {
        return next({statusCode: 403, message: 'You are not allowed to see this item.'});
      }

      // If the relationship is private, the user must be friends with one of the two parties.
      if (follower.isprivate) {
        async.parallel({
          user: async.apply(api.friend.isFriend, keyspace, liu, follower.user),
          follower: async.apply(api.friend.isFriend, keyspace, liu, follower.user_follower)
        }, function (err, result) {
          if (err) { return next(err); }
          if (!result.user[0] && !result.follower[0]) {
            return next({statusCode: 403, message: 'You are not allowed to see this item.'});
          }
          returnUser();
        });
      } else {
        returnUser();
      }

    });
  }

  function getFollowers (keyspace, liu, user, next) {
    var isUser = liu.toString() === user.toString();
    api.friend.isFriend(keyspace, liu, user, function (err, isFriend) {
      if (err) { return next(err); }
      api.common.get(keyspace, 'selectFollowers', [user], 'many', function (err, followers) {
        if (err) { return next(err); }
        var filteredFollowers = _.filter(followers, function (item) {
          if (item.ispersonal && !isUser) { return false; }
          if (item.isprivate && !isFriend) { return false; }
          return true;
        });
        next(null, filteredFollowers);
      });
    });
  }

  function getFollowersByName (keyspace, liu, username, next) {
    api.user.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      getFollowers(keyspace, liu, user.user, function (err, followers) {
        if (err) { return next(err); }
        api.user.mapUserIdToUser(keyspace, followers, ['user_follower'], user, next);
      });
    });
  }

  return {
    addFollower: addFollower,
    addFollowerByName: addFollowerByName,
    removeFollower: removeFollower,
    getFollowers: getFollowers,
    getFollow: getFollow,
    isFollower: isFollower,
    getFollowersByName: getFollowersByName
  };

};
