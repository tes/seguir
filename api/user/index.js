const _ = require('lodash');
const async = require('async');
const debug = require('debug')('seguir:user');

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
module.exports = (api) => {
  const client = api.client;
  const q = client.queries;

  let _userCacheStats = {};
  const userCacheStats = (key, action) => {
    const keyType = key.split(':')[0];
    _userCacheStats[keyType] = _userCacheStats[keyType] || {};
    _userCacheStats[keyType][action] = _userCacheStats[keyType][action] || 0;
    _userCacheStats[keyType][action] = _userCacheStats[keyType][action] + 1;
  };
  const resetStats = () => {
    _userCacheStats = {};
  };
  // Clear each minute to avoid memory leaks
  setInterval(() => {
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
  const addUser = (keyspace, username, altid, options, next) => {
    if (!next) {
      next = options;
      options = {};
    }

    const initialise = options.initialise || {};
    let userdata = options.userdata || {};
    const userid = client.isValidId(options.userid) ? options.userid : client.generateId();

    userdata = _.mapValues(userdata, (value) => {
      return value.toString();
    }); // Always ensure our userdata is <text,text>

    // Check user doesn't exist as per issue #36
    getUserByAltId(keyspace, altid, (err, existingUser) => {
      if (err && err.statusCode !== 404) { return next(err); }
      if (existingUser) {
        return next({
          statusCode: 409,
          message: 'User with altid ' + altid + ' already exists, use updateUser to update.'
        });
      }

      const user = [userid, username, '' + altid, userdata];

      client.execute(q(keyspace, 'upsertUser'), user, {
        hints: [null, null, 'map']
      }, (err, result) => {
        if (err) { return next(err); }
        const tempUser = _.zipObject(['user', 'username', 'altid'], user);
        tempUser.userdata = userdata;
        if (initialise) {
          initialiseUserWith(keyspace, tempUser, initialise, next);
        } else {
          next(null, tempUser);
        }
      });
    });
  };

  const initialiseUserWith = (keyspace, user, initialise, next) => {
    async.map(_.keys(initialise), (type, cb) => {
      if (type === 'follow') {
        initialiseUserWithFollowers(keyspace, user, initialise[type], cb);
      }
    }, (err) => {
      if (err) { return next(err); }
      next(null, user);
    });
  };

  const initialiseUserWithFollowers = (keyspace, user, follow, next) => {
    const backfill = follow.backfill || 10;
    api.auth.coerceUserToUuid(keyspace, follow.users, (err, usersToFollow) => {
      if (err) { return next(err); }
      async.map(usersToFollow, (userToFollow, cb) => {
        debug(user.user + ' >> FOLLOW >> ' + userToFollow);
        api.follow.addFollower(keyspace, userToFollow, user.user, api.client.getTimestamp(), follow.visibility || api.visibility.PUBLIC, (err, follow) => {
          if (err) { return cb(err); }
          api.feed.seedFeed(keyspace, user.user, userToFollow, backfill, follow, cb);
        });
      }, (err) => {
        if (err) { return next(err); }
        next();
      });
    });
  };

  const updateUser = (keyspace, userid, username, altid, userdata, next) => {
    userdata = _.mapValues(userdata, (value) => {
      return value.toString();
    }); // Always ensure our userdata is <text,text>

    /*
     * Retrieve the existing record as we need to clear the old caches assuming altid
     * or username can change
     */
    getUser(keyspace, userid, (err, user) => {
      if (err) { return next(err); }
      const cachedItems = ['username:' + user.username, 'useraltid:' + user.altid];
      async.map(cachedItems, client.deleteCacheItem, () => {
        const user = [username, '' + altid, userdata, userid];
        client.execute(q(keyspace, 'updateUser'), user, {
          cacheKey: 'user:' + userid,
          hints: [null, null, 'map']
        }, (err, result) => {
          if (err) { return next(err); }
          next(null, {user: userid, username: username, altid: altid, userdata: userdata});
        });
      });
    });
  };

  const getUser = (keyspace, user, next) => {
    client.get(q(keyspace, 'selectUser'), [user], {cacheKey: 'user:' + user}, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find user by id: ' + user)); }
      next(null, result);
    });
  };

  const getUserByName = (keyspace, username, next) => {
    client.get(q(keyspace, 'selectUserByUsername'), [username], {cacheKey: 'username:' + username}, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find user by name: ' + username)); }
      next(null, result);
    });
  };

  const getUserByAltId = (keyspace, altid, next) => {
    client.get(q(keyspace, 'selectUserByAltId'), ['' + altid], {cacheKey: 'useraltid:' + altid}, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find user by altid: ' + altid)); }
      next(null, result);
    });
  };

  const mapUserIdToUser = (keyspace, itemOrItems, fields, expandUser, userCache, next) => {
    // expandUser and userCache optional
    if (!next) { next = userCache; userCache = {}; }
    if (!next) { next = expandUser; expandUser = true; }

    if (!expandUser) {
      return next(null, itemOrItems);
    }

    const getUsersForFields = (item, cb) => {
      if (!item) { return cb(); }

      // Always replace the longest embedded field to
      // ensure user_ and user_friend not replaced twice
      fields.sort((a, b) => { return b.length - a.length; });

      async.mapSeries(fields, (field, eachCb) => {
        if (!item[field]) { return eachCb(null); }

        // If the item is already expanded lets just move on
        if (item[field] && item[field].user) { return eachCb(null); }

        // First check if we have the object embedded
        const userObject = api.common.expandEmbeddedObject(item, field, 'altid', fields);
        if (userObject) {
          debug('cache expand', field);
          userCacheStats('user', 'EMBED');
          item[field] = userObject;
          return eachCb();
        }

        const userKey = item[field].toString();
        // Check if the user is already in the cache for this request
        userCacheStats('user', 'GET');
        if (userCache[userKey]) {
          userCacheStats('user', 'HIT');
          debug('cache hit', field, userKey);
          item[field] = userCache[userKey];
          setImmediate(() => { eachCb(null); });
        } else {
          debug('cache miss', field, userKey);
          userCacheStats('user', 'MISS');
          getUser(keyspace, userKey, (err, user) => {
            item[field] = user;
            userCache[userKey] = user;
            userCacheStats('user', 'SET');
            eachCb(err);
          });
        }
      }, (err) => {
        if (err) {
          return cb(err);
        }
        cb(null, item);
      });
    };

    if (Array.isArray(itemOrItems)) {
      // Sort to ensure we always replace the longest first
      async.mapSeries(itemOrItems, getUsersForFields, (err, result) => {
        if (err) {
          return next(err);
        }
        next(null, result);
      });
    } else {
      getUsersForFields(itemOrItems, next);
    }
  };

  const getUserRelationship = (keyspace, user, other_user, next) => {
    async.parallel({
      friend: async.apply(api.friend.isFriend, keyspace, user, other_user),
      friendRequest: async.apply(api.friend.isFriendRequestPending, keyspace, user, other_user),
      follow: async.apply(api.follow.isFollower, keyspace, other_user, user),
      followBack: async.apply(api.follow.isFollower, keyspace, user, other_user),
      inCommon: async.apply(api.friend.friendsInCommon, keyspace, user, other_user),
      followerCount: async.apply(api.follow.followerCount, keyspace, other_user),
      followingCount: async.apply(api.follow.followingCount, keyspace, other_user)
    }, (err, result) => {
      if (err) { return next(err); }

      const relationship = {
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
  };

  const removeUser = (keyspace, userid, next) => {
    getUser(keyspace, userid, (err, user) => {
      if (err) { return next(err); }
      async.parallel({
        feed: async.apply(api.feed.removeFeedsForItem, keyspace, user.user),
        followers: async.apply(api.follow.removeAllFollowersByUser, keyspace, user.user),
        following: async.apply(api.follow.removeAllFollowingByUser, keyspace, user.user),
        friend: async.apply(api.friend.removeAllFriendsByUser, keyspace, user.user),
        members: async.apply(api.group.removeMembersByUser, keyspace, user.user),
        posts: async.apply(api.post.removePostsByUser, keyspace, user.user),
        comments: async.apply(api.comment.deleteCommentsByUser, keyspace, user.user),
        likes: async.apply(api.like.deleteLikesByUser, keyspace, user.user)
      }, (err) => {
        console.log('err', err);
        if (err) { return next(err); }

        const cachedItems = ['username:' + user.username, 'useraltid:' + user.altid];
        async.map(cachedItems, client.deleteCacheItem, (err) => {
          if (err) return next(err);

          client.execute(q(keyspace, 'removeUser'), [user.user], (err) => {
            if (err) return next(err);
            next(null, { status: 'removed' });
          });
        });
      });
    });
  };

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
