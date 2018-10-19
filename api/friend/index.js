const _ = require('lodash');
const async = require('async');

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

  const addFriend = (keyspace, user, user_friend, timestamp, next) => {
    const friend = client.generateId();
    addFriendOneWay(keyspace, friend, user, user_friend, timestamp, (err) => {
      if (err) { return next(err); }
      const reciprocalFriend = client.generateId();
      addFriendOneWay(keyspace, reciprocalFriend, user_friend, user, timestamp, (err) => {
        if (err) { return next(err); }
        const tempFriend = {
          friend: friend,
          reciprocal: reciprocalFriend,
          user: user,
          user_friend: user_friend,
          since: timestamp
        };
        api.user.mapUserIdToUser(keyspace, tempFriend, ['user', 'user_friend'], next);
      });
    });
    api.metrics.increment('friend.add');
  };

  const addFriendOneWay = (keyspace, friend, user, user_friend, timestamp, next) => {
    const data = [friend, user, user_friend, timestamp, api.visibility.PRIVATE];
    const object = _.zipObject(['friend', 'user', 'user_friend', 'timestamp', 'visibility'], data);
    object.visibility = api.visibility.PERSONAL;
    client.execute(q(keyspace, 'upsertFriend'), data, {}, (err) => {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.feed.addFeedItem(keyspace, user, object, 'friend', next);
    });
  };

  const addFriendRequest = (keyspace, user, user_friend, message, timestamp, next) => {
    const friend_request = client.generateId();
    const cleanMessage = api.common.clean(message);
    const data = [friend_request, user, user_friend, cleanMessage, timestamp, api.visibility.PRIVATE];
    client.execute(q(keyspace, 'upsertFriendRequest'), data, {}, (err) => {
      /* istanbul ignore if */
      if (err) { return next(err); }
      next(null, {friend_request: friend_request, user: user, user_friend: user_friend, message: cleanMessage, since: timestamp, visibility: api.visibility.PRIVATE});
    });
    api.metrics.increment('friend_request.add');
  };

  const acceptFriendRequest = (keyspace, user, friend_request_id, next) => {
    getFriendRequest(keyspace, user, friend_request_id, (err, friend_request) => {
      if (err) { return next(err); }
      const data = [friend_request_id];
      client.execute(q(keyspace, 'acceptFriendRequest'), data, {}, (err) => {
        /* istanbul ignore if */
        if (err) { return next(err); }
        addFriend(keyspace, friend_request.user, friend_request.user_friend, api.client.getTimestamp(), next);
      });
    });
    api.metrics.increment('friend_request.accept');
  };

  const removeFriend = (keyspace, user, user_friend, next) => {
    isFriend(keyspace, user, user_friend, (err, isFriend, isFriendSince, friend) => {
      if (err || !isFriend) { return next(err); }
      const deleteData = [user, user_friend];
      const deleteDataReciprocal = [user_friend, user];
      client.execute(q(keyspace, 'removeFriend'), deleteData, {}, (err, result) => {
        if (err) return next(err);
        client.execute(q(keyspace, 'removeFriend'), deleteDataReciprocal, {}, (err, result) => {
          if (err) return next(err);
          api.feed.removeFeedsForItem(keyspace, friend.friend, (err) => {
            if (err) return next(err);
            next(null, {status: 'removed'});
          });
        });
      });
    });
    api.metrics.increment('friend.remove');
  };

  const userCanSeeItem = (keyspace, user, item, user_properties, next) => {
    // Check if the item provided is one that privacy controls apply to
    const privacyCheckRequired = item.friend || item.friend_request || item.visibility !== api.visibility.PUBLIC;
    if (!privacyCheckRequired) return next();

    // If the user is the anonymous user exit quickly
    if (privacyCheckRequired && !user) return next({statusCode: 403, message: 'You are not allowed to see this item.'});

    // First check if the user is one of the properties
    const userIsOnItem = _.reduce(user_properties, (match, prop) => {
      return match || user.toString() === item[prop].toString();
    }, false);
    if (userIsOnItem) return next();

    // Now, if it is private they can see it if they are a friends with any
    // of the users specified in the properties
    if (item.visibility === api.visibility.PRIVATE) {
      async.reduce(user_properties, false, (memo, prop, cb) => {
        isFriend(keyspace, user, item[prop], (err, ok) => {
          if (err) { return next(err); }
          cb(null, memo || ok);
        });
      }, (err, ok) => {
        if (err) { return next(err); }
        if (!ok) { return next({statusCode: 403, message: 'You are not allowed to see this item.'}); }
        next();
      });
    } else {
      // Otherwise they can't see it
      next({statusCode: 403, message: 'You are not allowed to see this item.'});
    }
  };

  const getFriendFromObject = (keyspace, liu, item, next) => {
    const friendObject = api.common.expandEmbeddedObject(item, 'friend', 'friend');
    api.friend.userCanSeeItem(keyspace, liu, friendObject, ['user', 'user_friend'], (err) => {
      if (err) { return next(err); }
      api.user.mapUserIdToUser(keyspace, item, ['user', 'user_friend'], (err, objectWithUsers) => {
        if (err) { return next(err); }
        friendObject.user = objectWithUsers.user;
        friendObject.user_friend = objectWithUsers.user_friend;
        next(null, friendObject);
      });
    });
  };

  const getFriend = (keyspace, liu, friend, expandUser, next) => {
    if (!next) { next = expandUser; expandUser = true; }
    api.common.get(keyspace, 'selectFriend', [friend], 'one', (err, friendship) => {
       /* istanbul ignore if */
      if (err) { return next(err); }
      userCanSeeItem(keyspace, liu, friendship, ['user', 'user_friend'], (err) => {
        if (err) { return next(err); }
        api.user.mapUserIdToUser(keyspace, friendship, ['user', 'user_friend'], expandUser, next);
      });
    });
  };

  const getFriends = (keyspace, liu, user, next) => {
    isFriend(keyspace, user, liu, function (err, ok) {
      if (err) { return next(err); }
      if (!ok) { return next({statusCode: 403, message: 'You are not allowed to see this item.'}); }
      api.common.get(keyspace, 'selectFriends', [user], 'many', (err, friends) => {
        if (err) { return next(err); }
        api.user.mapUserIdToUser(keyspace, friends, ['user_friend'], next);
      });
    });
  };

  const friendsInCommon = (keyspace, liu, user, next) => {
    if (!liu || !user) return next();
    if (liu === user) return next();
    async.parallel([
      (cb) => {
        client.execute(q(keyspace, 'selectFriends'), [liu], {}, (err, result) => {
          if (err) return cb(err);
          cb(null, _.map(result.rows, 'user_friend'));
        });
      },
      (cb) => {
        client.execute(q(keyspace, 'selectFriends'), [user], {}, (err, result) => {
          if (err) return cb(err);
          cb(null, _.map(result.rows, 'user_friend'));
        });
      }
    ], (err, results) => {
      if (err) { return next(err); }
      const inCommon = _.uniq(_.filter(_.intersection(results[0], results[1]), (item) => { return (item === liu || item === user) ? null : item; }));
      async.map(inCommon, (id, cb) => {
        user.getUser(keyspace, id, cb);
      }, next);
    });
  };

  const getFriendRequest = (keyspace, liu, friend_request, next) => {
    api.common.get(keyspace, 'selectFriendRequest', [friend_request], 'one', (err, friendRequest) => {
      if (err) { return next(err); }
      next(null, friendRequest);
    });
  };

  const getIncomingFriendRequests = (keyspace, liu, next) => {
    api.common.get(keyspace, 'selectIncomingFriendRequests', [liu], 'many', (err, friendRequests) => {
      if (err) { return next(err); }
      // Now, go and get user details for all the non own posts
      api.user.mapUserIdToUser(keyspace, friendRequests, ['user', 'user_friend'], next);
    });
  };

  const getOutgoingFriendRequests = (keyspace, liu, next) => {
    api.common.get(keyspace, 'selectOutgoingFriendRequests', [liu], 'many', (err, friendRequests) => {
      if (err) { return next(err); }
      // Now, go and get user details for all the non own posts
      api.user.mapUserIdToUser(keyspace, friendRequests, ['user', 'user_friend'], next);
    });
  };

  const getFriendRequests = (keyspace, liu, next) => {
    getIncomingFriendRequests(keyspace, liu, (err, incoming) => {
      if (err) { return next(err); }
      getOutgoingFriendRequests(keyspace, liu, (err, outgoing) => {
        if (err) { return next(err); }
        next(null, {incoming: incoming, outgoing: outgoing});
      });
    });
  };

  const isFriend = (keyspace, user, user_friend, next) => {
    if (!user) { return next(null, false, null, null); }
    if (user.toString() === user_friend.toString()) { return next(null, true, null, null); }
    api.common.get(keyspace, 'isFriend', [user, user_friend], 'one', (err, friend) => {
      if (err) { return next(null, false, null, null); }
      const isFriend = !!(friend && !!friend.friend);
      const isFriendSince = isFriend ? friend.since : null;
      return next(null, isFriend, isFriendSince, friend || null);
    });
  };

  const isFriendRequestPending = (keyspace, user, user_friend, next) => {
    if (!user) { return next(null, false, null); }
    if (user.toString() === user_friend.toString()) { return next(null, false, null); }
    api.common.get(keyspace, 'selectOutgoingFriendRequests', [user], 'many', (err, friendRequests) => {
      /* istanbul ignore if */
      if (err) { return next(err); }
      const friendRequest = _.filter(friendRequests, (row) => {
        if (row.user_friend.toString() === user_friend.toString()) {
          return row;
        }
      });
      const isFriendRequestPending = friendRequest.length > 0;
      const isFriendRequestSince = isFriendRequestPending ? friendRequest[0].since : null;

      return next(null, isFriendRequestPending, isFriendRequestSince);
    });
  };

  const removeAllFriendsByUser = (keyspace, user, next) => {
    getFriends(keyspace, user, user, (err, friends) => {
      if (err) { return next(err); }
      async.map(friends, (friend, cb) => {
        removeFriend(keyspace, user, friend.user_friend.user, cb);
      }, (err) => {
        if (err) { return next(err); }
        return next(null);
      });
    });
  };

  return {
    removeAllFriendsByUser: removeAllFriendsByUser,
    addFriend: addFriend,
    addFriendRequest: addFriendRequest,
    removeFriend: removeFriend,
    isFriend: isFriend,
    acceptFriendRequest: acceptFriendRequest,
    userCanSeeItem: userCanSeeItem,
    getFriend: getFriend,
    getFriendFromObject: getFriendFromObject,
    getFriends: getFriends,
    getFriendRequest: getFriendRequest,
    getFriendRequests: getFriendRequests,
    getIncomingFriendRequests: getIncomingFriendRequests,
    getOutgoingFriendRequests: getOutgoingFriendRequests,
    isFriendRequestPending: isFriendRequestPending,
    friendsInCommon: friendsInCommon
  };
};
