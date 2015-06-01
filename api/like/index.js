var cassandra = require('cassandra-driver');
var Uuid = cassandra.types.Uuid;

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

  function addLike (keyspace, user, item, timestamp, next) {
    var like = Uuid.random();
    var data = [like, user, api.common.clean(item), timestamp];
    client.execute(q(keyspace, 'upsertLike'), data, {prepare: true}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.feed.addFeedItem(keyspace, user, like, 'like', false, false, function (err, result) {
        if (err) { return next(err); }
        var tempLike = {like: like, user: user, item: item, timestamp: timestamp};
        api.user.mapUserIdToUser(keyspace, tempLike, ['user'], user, next);
      });
    });
  }

  function addLikeByName (keyspace, username, item, timestamp, next) {
    api.user.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      addLike(keyspace, user.user, item, timestamp, next);
    });
  }

  function removeLike (keyspace, user, item, next) {
    checkLike(keyspace, user, item, function (err, like) {
      if (err || !like) { return next(err); }
      var deleteData = [user, item];
      client.execute(q(keyspace, 'removeLike'), deleteData, {prepare: true}, function (err, result) {
        if (err) return next(err);
        api.feed.removeFeedsForItem(keyspace, like.like, function (err) {
          if (err) return next(err);
          next(null, {status: 'removed'});
        });
      });
    });
  }

  function getLike (keyspace, like, next) {
    api.common.get(keyspace, 'selectLike', [like], 'one', function (err, result) {
      if (err) { return next(err); }
      api.user.mapUserIdToUser(keyspace, result, ['user'], undefined, next);
    });
  }

  function checkLike (keyspace, user, item, next) {
    api.common.get(keyspace, 'checkLike', [user, item], 'one', function (err, like) {
      if (err) { return next(err); }
      api.user.mapUserIdToUser(keyspace, like, ['user'], user, next);
    });
  }

  return {
    addLike: addLike,
    addLikeByName: addLikeByName,
    removeLike: removeLike,
    getLike: getLike,
    checkLike: checkLike
  };

};
