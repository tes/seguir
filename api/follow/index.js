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
module.exports = function (api) {

  var client = api.client,
    q = client.queries;

  function addFollower (keyspace, user, user_follower, timestamp, visibility, backfill, next) {

    if (!next) {
      next = backfill;
      backfill = null;
    }
    if (user.toString() === user_follower.toString()) {
      return next({statusCode: 500, message: 'You are not allowed to follow yourself.'});
    }

    var mapFollowResponse = function (follower) {
      api.user.mapUserIdToUser(keyspace, follower, ['user', 'user_follower'], user, function (err, follow) {
        if (err) return next(err);
        return next(null, follow);
      });
    };

    var backfillFeed = function (follow) {
      api.feed.seedFeed(keyspace, user_follower, user, backfill, follow, function (err) {
        if (err) return next(err);
        mapFollowResponse(follow);
      });
    };

    var addBidirectionalFeedItem = function (follow, cb) {
      api.feed.addFeedItem(keyspace, user, follow, 'follow', function (err, result) {
        if (err) { return next(err); }
        api.feed.addFeedItem(keyspace, user_follower, follow, 'follow', function (err, result) {
          if (err) { return next(err); }
          cb(null, result);
        });
      });
    };

    isFollower(keyspace, user, user_follower, function (err, isFollower, followerSince, follow) {

      if (err) { return next(err); }
      if (isFollower) {
        return mapFollowResponse(follow);
      }

      var newFollowId = client.generateId();
      var data = [newFollowId, user, user_follower, timestamp, visibility];
      var newFollow = _.object(['follow', 'user', 'user_follower', 'since', 'visibility'], data);

      client.execute(q(keyspace, 'upsertFollower'), data, {prepare: true}, function (err) {
        /* istanbul ignore if */
        if (err) { return next(err); }
        alterFollowerCount(keyspace, user, 1, function () {
          addBidirectionalFeedItem(newFollow, function (err, result) {
            if (err) { return next(err); }
            backfill ? backfillFeed(newFollow) : mapFollowResponse(newFollow);
          });
        });
      });

    });

  }

  function alterFollowerCount (keyspace, user, count, next) {
    next = next || function () {
      };
    var data = [count, user.toString()];
    client.execute(q(keyspace, 'updateCounter', {TYPE: 'followers'}), data, {prepare: true}, next);
  }

  function followerCount (keyspace, user, next) {
    next = next || function () { };
    var data = [user.toString()];
    client.get(q(keyspace, 'selectCount', {TYPE: 'followers', ITEM: 'user'}), data, {prepare: true}, next);
  }

  function removeFollower (keyspace, user, user_follower, next) {
    isFollower(keyspace, user, user_follower, function (err, isFollower, isFollowerSince, follow) {
      if (err) { return next(err); }
      if (!isFollower) { return next({statusCode: 404, message: 'Cant unfollow a user you dont follow'}); }
      var deleteData = [user, user_follower];
      client.execute(q(keyspace, 'removeFollower'), deleteData, {prepare: true, cacheKey: 'follow:' + follow.follow}, function (err, result) {
        if (err) return next(err);
        alterFollowerCount(keyspace, user, -1, function () {
          api.feed.removeFeedsForItem(keyspace, follow.follow, function (err) {
            if (err) return next(err);
            next(null, {status: 'removed'});
          });
        });
      });
    });
  }

  function isFollower (keyspace, user, user_follower, next) {
    if (!user || !user_follower) { return next(null, false, null, null); }
    if (user.toString() === user_follower.toString()) {
      return next(null, false, null, {});
    }
    client.get(q(keyspace, 'isFollower'), [user, user_follower], {prepare: true}, function (err, follow) {
      if (err) { return next(null, false, null, {}); }
      var isFollower = !!(follow && follow.follow);
      var isFollowerSince = isFollower ? follow.since : null;
      return next(null, isFollower, isFollowerSince, follow ? follow : null);
    });
  }

  function getFollowFromObject (keyspace, liu, followObject, next) {
    api.friend.userCanSeeItem(keyspace, liu, followObject, ['user', 'user_follower'], function (err) {
      if (err) { return next(err); }
      api.user.mapUserIdToUser(keyspace, followObject, ['user', 'user_follower'], liu, next);
    });
  }

  function getFollow (keyspace, liu, follow, next) {
    client.get(q(keyspace, 'selectFollow'), [follow], {prepare: true, cacheKey: 'follow:' + follow}, function (err, follower) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      if (!follower) { return next({statusCode: 404, message: 'Follow not found'}); }
      api.friend.userCanSeeItem(keyspace, liu, follower, ['user', 'user_follower'], function (err) {
        if (err) { return next(err); }
        api.user.mapUserIdToUser(keyspace, follower, ['user', 'user_follower'], liu, next);
      });
    });
  }

  // TODO: erk.  This method needs more async love (or promises)
  function getFollowers (keyspace, liu, user, next) {

    var isUser = liu && user && liu.toString() === user.toString();
    api.friend.isFriend(keyspace, liu, user, function (err, isFriend) {
      if (err) { return next(err); }
      api.common.get(keyspace, 'selectFollowers', [user], 'many', function (err, followers) {
        if (err) { return next(err); }
        var filteredFollowers = _.filter(followers, function (item) {
          if (item.visibility === api.visibility.PERSONAL && !isUser) { return false; }
          if (item.visibility === api.visibility.PRIVATE && !isFriend) { return false; }
          return true;
        });

        var sortedFollowers = _.sortByOrder(filteredFollowers, ['since'], ['desc']);

        // For each follower, check if the liu is following them if we are logged in
        if (liu) {
          async.map(sortedFollowers, function (follow, cb) {
            followerCount(keyspace, follow.user_follower, function (err, followerCount) {
              if (err) { return cb(err); }

              follow.followerCount = followerCount && followerCount.count ? +followerCount.count.toString() : 0;
              if (follow.user_follower.toString() === liu.toString()) {
                follow.liuIsFollowing = true;
                follow.liuIsUser = true;
                return cb(null, follow);
              }

              isFollower(keyspace, follow.user_follower, liu, function (err, isFollower) {
                if (err) { return cb(err); }
                follow.liuIsFollowing = isFollower;
                follow.liuIsUser = false;
                cb(null, follow);
              });

            });

          }, function (err, followersWithState) {
            if (err) { return next(err); }
            api.user.mapUserIdToUser(keyspace, sortedFollowers, ['user_follower'], user, next);
          });
        } else {
          async.map(sortedFollowers, function (follow, cb) {
            followerCount(keyspace, follow.user_follower, function (err, followerCount) {
              if (err) { return cb(err); }
              follow.followerCount = followerCount && followerCount.count ? +followerCount.count.toString() : 0;
              cb(null, follow);
            });
          }, function (err, followersWithState) {
            if (err) { return next(err); }
            api.user.mapUserIdToUser(keyspace, sortedFollowers, ['user_follower'], user, next);
          });
        }

      });
    });
  }

  return {
    addFollower: addFollower,
    removeFollower: removeFollower,
    getFollowers: getFollowers,
    getFollow: getFollow,
    getFollowFromObject: getFollowFromObject,
    isFollower: isFollower,
    followerCount: followerCount
  };

};
