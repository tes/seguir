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

  function addUser (keyspace, username, altid, userdata, next) {
    userdata = _.mapValues(userdata, function (value) {
      return value.toString();
    }); // Always ensure our userdata is <text,text>
    var userid = Uuid.random();
    var user = [userid, username, '' + altid, userdata];
    client.execute(q(keyspace, 'upsertUser'), user, {
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
    api.common.get(keyspace, 'selectUserByAltId', [altid], 'one', next);
  }

  function mapUserIdToUser (keyspace, itemOrItems, fields, currentUser, next) {

    var getUsersForFields = function (item, cb) {
      async.each(fields, function (field, eachCb) {
        if (!item[field]) { return eachCb(null); }
        if (item[field].toString() === currentUser.user && currentUser.user.toString()) {
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
      inCommon: async.apply(api.friend.friendsInCommon, keyspace, user, other_user)
    }, function (err, result) {

      if (err) { return next(err); }

      var relationship = {
        isFriend: result.friend[0],
        isFriendSince: result.friend[1],
        isFriendRequestPending: result.friendRequest[0],
        isFriendRequestSince: result.friendRequest[1],
        youFollow: result.follow[0],
        youFollowSince: result.follow[1],
        youFollowPrivate: result.follow[2] ? result.follow[2].isprivate : null,
        youFollowPersonal: result.follow[2] ? result.follow[2].ispersonal : null,
        theyFollow: result.followBack[0],
        theyFollowSince: result.followBack[1],
        theyFollowPrivate: result.followBack[2] ? result.followBack[2].isprivate : null,
        theyFollowPersonal: result.followBack[2] ? result.followBack[2].ispersonal : null,
        inCommon: result.inCommon
      };

      next(null, relationship);

    });

  }

  return {
    addUser: addUser,
    getUser: getUser,
    getUserByName: getUserByName,
    getUserByAltId: getUserByAltId,
    mapUserIdToUser: mapUserIdToUser,
    getUserRelationship: getUserRelationship
  };

};
