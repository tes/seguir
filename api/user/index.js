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

  var client = api.client,
      q = client.queries;

  function addUser (keyspace, username, altid, userdata, options, next) {

    if (!next) { next = options; options = {}; }
    if (!next) { next = userdata; userdata = {}; }
    var initialise = options.initialise;

    userdata = _.mapValues(userdata, function (value) {
      return value.toString();
    }); // Always ensure our userdata is <text,text>

    // Check user doesn't exist as per issue #36
    getUserByAltId(keyspace, altid, function (err, existingUser) {

      if (err && err.statusCode !== 404) { return next(err); }
      if (existingUser) { return next({statusCode: 409, message: 'User with altid ' + altid + ' already exists, use updateUser to update.'}); }

      var userid = client.isValidId(options.userid) ? options.userid : client.generateId();
      var user = [userid, username, '' + altid, userdata];

      client.execute(q(keyspace, 'upsertUser'), user, {
        prepare: true,
        hints: [null, null, 'map']
      }, function (err, result) {
        if (err) { return next(err); }
        var tempUser = _.object(['user', 'username', 'altid'], user);
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
    var backfill = follow.backfill || '1d';
    api.auth.coerceUserToUuid(keyspace, follow.users, function (err, usersToFollow) {
      if (err) { return next(err); }
      async.map(usersToFollow, function (userToFollow, cb) {
        debug(user.user + ' >> FOLLOW >> ' + userToFollow);
        api.follow.addFollower(keyspace, userToFollow, user.user, api.client.getTimestamp(), follow.visibility, function (err, follow) {
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
    var user = [username, '' + altid, userdata, userid];
    client.execute(q(keyspace, 'updateUser'), user, {
      prepare: true,
      hints: [null, null, 'map']
    }, function (err, result) {
      if (err) { return next(err); }
      next(null, {user: userid, username: username, altid: altid, userdata: userdata});
    });
  }

  function getUser (keyspace, user, next) {
    api.common.get(keyspace, 'selectUser', [user], 'one', next);
  }

  function getUserByName (keyspace, username, next) {
    api.common.get(keyspace, 'selectUserByUsername', [username], 'one', next);
  }

  function getUserByAltId (keyspace, altid, next) {
    api.common.get(keyspace, 'selectUserByAltId', ['' + altid], 'one', next);
  }

  function mapUserIdToUser (keyspace, itemOrItems, fields, currentUser, next) {

    var getUsersForFields = function (item, cb) {

      // Always replace the longest embedded field to
      // ensure user_ and user_friend not replaced twice
      fields.sort(function (a, b) {return b.length - a.length; });

      async.each(fields, function (field, eachCb) {

        if (!item[field]) { return eachCb(null); }

        // First check if we have the object embedded
        var userObject = api.common.expandEmbeddedObject(item, field, 'altid', fields);
        if (userObject) {
          item[field] = userObject;
          return eachCb();
        }

        // Otherwise proceed as normal
        if (currentUser && item[field].toString() === currentUser.user && currentUser.user.toString()) {
          item[field] = currentUser;
          eachCb(null);
        } else {
          getUser(keyspace, item[field], function (err, user) {
            item[field] = user;
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
      async.map(itemOrItems, getUsersForFields, function (err, result) {
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
      followerCount: async.apply(api.follow.followerCount, keyspace, other_user)
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
        followerCount: result.followerCount && result.followerCount.count ? +result.followerCount.count.toString() : 0
      };

      next(null, relationship);

    });

  }

  return {
    addUser: addUser,
    updateUser: updateUser,
    getUser: getUser,
    getUserByName: getUserByName,
    getUserByAltId: getUserByAltId,
    mapUserIdToUser: mapUserIdToUser,
    getUserRelationship: getUserRelationship
  };

};
