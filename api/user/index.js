var _ = require('lodash');
var async = require('async');
var debug = require('debug')('seguir:user');

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
  var client = api.client;
  var q = client.queries;

  var _userCacheStats = {};
  var userCacheStats = function (key, action) {
    var keyType = key.split(':')[0];
    _userCacheStats[keyType] = _userCacheStats[keyType] || {};
    _userCacheStats[keyType][action] = _userCacheStats[keyType][action] || 0;
    _userCacheStats[keyType][action] = _userCacheStats[keyType][action] + 1;
  };
  var resetStats = function () {
    _userCacheStats = {};
  };
  // Clear each minute to avoid memory leaks
  setInterval(function () {
    resetStats();
  }, 60000);

  /**
   * Add a user to cassandra
   * @param keyspace
   * @param username
   * @param altid
   * @param options Set of optional parameters for this method
   * @param options.initialize - Set up follows relationships for this user on creation { 'follow': <seguirId> }
   * @param options.userdata - Set of optional, arbitrary data that will be added to the user record
   * @param options.userid - If provided will be used as the id for this user (rather than generating one)
   * @param next
   */
  function addUser (keyspace, username, altid, options, next) {
    if (!next) {
      next = options;
      options = {};
    }

    var initialise = options.initialise || {};
    var userdata = options.userdata || {};
    var userid = client.isValidId(options.userid) ? options.userid : client.generateId();

    userdata = _.mapValues(userdata, function (value) {
      return value.toString();
    }); // Always ensure our userdata is <text,text>

    // Check user doesn't exist as per issue #36
    getUserByAltId(keyspace, altid, function (err, existingUser) {
      if (err && err.statusCode !== 404) { return next(err); }
      if (existingUser) {
        return next({
          statusCode: 409,
          message: 'User with altid ' + altid + ' already exists, use updateUser to update.'
        });
      }

      var user = [userid, username, '' + altid, userdata];

      client.execute(q(keyspace, 'upsertUser'), user, {
        hints: [null, null, 'map']
      }, function (err, result) {
        if (err) { return next(err); }
        var tempUser = _.zipObject(['user', 'username', 'altid'], user);
        tempUser.userdata = userdata;
        if (initialise) {
          initialiseUserWith(keyspace, tempUser, initialise, next);
        } else {
          next(null, tempUser);
        }
      });
    });
  }

  function initialiseUserWith (keyspace, user, initialise, next) {
    async.map(_.keys(initialise), function (type, cb) {
      if (type === 'follow') {
        initialiseUserWithFollowers(keyspace, user, initialise[type], cb);
      }
    }, function (err) {
      if (err) { return next(err); }
      next(null, user);
    });
  }

  function initialiseUserWithFollowers (keyspace, user, follow, next) {
    var backfill = follow.backfill || 10;
    api.auth.coerceUserToUuid(keyspace, follow.users, function (err, usersToFollow) {
      if (err) { return next(err); }
      async.map(usersToFollow, function (userToFollow, cb) {
        debug(user.user + ' >> FOLLOW >> ' + userToFollow);
        api.follow.addFollower(keyspace, userToFollow, user.user, api.client.getTimestamp(), follow.visibility || api.visibility.PUBLIC, function (err, follow) {
          if (err) { return cb(err); }
          api.feed.seedFeed(keyspace, user.user, userToFollow, backfill, follow, cb);
        });
      }, function (err) {
        if (err) { return next(err); }
        next();
      });
    });
  }

  function updateUser (keyspace, userid, username, altid, userdata, next) {
    userdata = _.mapValues(userdata, function (value) {
      return value.toString();
    }); // Always ensure our userdata is <text,text>

    /*
     * Retrieve the existing record as we need to clear the old caches assuming altid
     * or username can change
     */
    getUser(keyspace, userid, function (err, user) {
      if (err) { return next(err); }
      var cachedItems = ['username:' + user.username, 'useraltid:' + user.altid];
      async.map(cachedItems, client.deleteCacheItem, function () {
        var user = [username, '' + altid, userdata, userid];
        client.execute(q(keyspace, 'updateUser'), user, {
          cacheKey: 'user:' + userid,
          hints: [null, null, 'map']
        }, function (err, result) {
          if (err) { return next(err); }
          next(null, {user: userid, username: username, altid: altid, userdata: userdata});
        });
      });
    });
  }

  function getUser (keyspace, user, next) {
    client.get(q(keyspace, 'selectUser'), [user], {cacheKey: 'user:' + user}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find user by id: ' + user)); }
      next(null, result);
    });
  }

  function getUserByName (keyspace, username, next) {
    client.get(q(keyspace, 'selectUserByUsername'), [username], {cacheKey: 'username:' + username}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find user by name: ' + username)); }
      next(null, result);
    });
  }

  function getUserByAltId (keyspace, altid, next) {
    client.get(q(keyspace, 'selectUserByAltId'), ['' + altid], {cacheKey: 'useraltid:' + altid}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find user by altid: ' + altid)); }
      next(null, result);
    });
  }

  function mapUserIdToUser (keyspace, itemOrItems, fields, currentUser, expandUser, userCache, next) {
    // expandUser and userCache optional
    if (!next) { next = userCache; userCache = {}; }
    if (!next) { next = expandUser; expandUser = true; }

    if (!expandUser) {
      return next(null, itemOrItems);
    }

    var getUsersForFields = function (item, cb) {
      if (!item) { return cb(); }

      // Always replace the longest embedded field to
      // ensure user_ and user_friend not replaced twice
      fields.sort(function (a, b) { return b.length - a.length; });

      async.mapSeries(fields, function (field, eachCb) {
        if (!item[field]) { return eachCb(null); }

        // If the item is already expanded lets just move on
        if (item[field] && item[field].user) { return eachCb(null); }

        // First check if we have the object embedded
        var userObject = api.common.expandEmbeddedObject(item, field, 'altid', fields);
        if (userObject) {
          debug('cache expand', field);
          userCacheStats('user', 'EMBED');
          item[field] = userObject;
          return eachCb();
        }

        var userKey = item[field].toString();
        // Check if the user is already in the cache for this request
        userCacheStats('user', 'GET');
        if (userCache[userKey]) {
          userCacheStats('user', 'HIT');
          debug('cache hit', field, userKey);
          item[field] = userCache[userKey];
          setImmediate(function () { eachCb(null); });
        } else {
          debug('cache miss', field, userKey);
          userCacheStats('user', 'MISS');
          getUser(keyspace, userKey, function (err, user) {
            item[field] = user;
            userCache[userKey] = user;
            userCacheStats('user', 'SET');
            eachCb(err);
          });
        }
      }, function (err) {
        if (err) {
          return cb(err);
        }
        cb(null, item);
      });
    };

    if (Array.isArray(itemOrItems)) {
      // Sort to ensure we always replace the longest first
      async.mapSeries(itemOrItems, getUsersForFields, function (err, result) {
        if (err) {
          return next(err);
        }
        next(null, result);
      });
    } else {
      getUsersForFields(itemOrItems, next);
    }
  }

  function getUserRelationship (keyspace, user, other_user, next) {
    async.parallel({
      friend: async.apply(api.friend.isFriend, keyspace, user, other_user),
      friendRequest: async.apply(api.friend.isFriendRequestPending, keyspace, user, other_user),
      follow: async.apply(api.follow.isFollower, keyspace, other_user, user),
      followBack: async.apply(api.follow.isFollower, keyspace, user, other_user),
      inCommon: async.apply(api.friend.friendsInCommon, keyspace, user, other_user),
      followerCount: async.apply(api.follow.followerCount, keyspace, other_user),
      followingCount: async.apply(api.follow.followingCount, keyspace, other_user)
    }, function (err, result) {
      if (err) { return next(err); }

      var relationship = {
        isFriend: result.friend[0],
        isFriendSince: result.friend[1],
        isFriendRequestPending: result.friendRequest[0],
        isFriendRequestSince: result.friendRequest[1],
        youFollow: result.follow[0],
        youFollowSince: result.follow[1],
        youFollowVisibility: result.follow[2] ? result.follow[2].visibility : null,
        youFollowPrivate: result.follow[2] ? result.follow[2].visibility === api.visibility.PRIVATE : null,
        youFollowPersonal: result.follow[2] ? result.follow[2].visibility === api.visibility.PERSONAL : null,
        theyFollow: result.followBack[0],
        theyFollowSince: result.followBack[1],
        theyFollowVisibility: result.followBack[2] ? result.followBack[2].visibility : null,
        theyFollowPrivate: result.followBack[2] ? result.followBack[2].visibility === api.visibility.PRIVATE : null,
        theyFollowPersonal: result.followBack[2] ? result.followBack[2].visibility === api.visibility.PERSONAL : null,
        inCommon: result.inCommon,
        followerCount: result.followerCount && result.followerCount.count ? +result.followerCount.count.toString() : 0,
        followingCount: result.followingCount && result.followingCount.count ? +result.followingCount.count.toString() : 0
      };

      next(null, relationship);
    });
    api.metrics.increment('user.relationship');
  }

  function removeUser (keyspace, userid, next) {
    getUser(keyspace, userid, function (err, user) {
      if (err) { return next(err); }
      async.parallel({
        feed: async.apply(api.feed.removeFeedsForItem, keyspace, user.user),
        followers: async.apply(api.follow.removeAllFollowersByUser, keyspace, user.user),
        following: async.apply(api.follow.removeAllFollowingByUser, keyspace, user.user),
        friend: async.apply(api.friend.removeAllFriendsByUser, keyspace, user.user)
      }, function (err) {
        console.log('err', err);
        if (err) { return next(err); }

        var cachedItems = ['username:' + user.username, 'useraltid:' + user.altid];
        async.map(cachedItems, client.deleteCacheItem, function (err) {
          if (err) return next(err);

          client.execute(q(keyspace, 'removeUser'), [user.user], function (err) {
            if (err) return next(err);
            next(null, { status: 'removed' });
          });
        });
      });
    });
  }

  return {
    addUser: addUser,
    updateUser: updateUser,
    getUser: getUser,
    getUserByName: getUserByName,
    getUserByAltId: getUserByAltId,
    mapUserIdToUser: mapUserIdToUser,
    getUserRelationship: getUserRelationship,
    removeUser: removeUser,
    userCacheStats: _userCacheStats
  };
};
