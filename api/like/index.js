var _ = require('lodash');

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

  function addLike (keyspace, user, item, timestamp, next) {
    var like = client.generateId();
    var cleanItem = api.common.clean(item);
    var data = [like, user, cleanItem, timestamp];
    var object = _.object(['like', 'user', 'item', 'timestamp'], data);
    object.ispersonal = false;
    object.isprivate = false;
    client.execute(q(keyspace, 'upsertLike'), data, {prepare: true}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      alterLikeCount(keyspace, cleanItem, 1, function () {
        api.feed.addFeedItem(keyspace, user, object, 'like', function (err, result) {
          if (err) { return next(err); }
          var tempLike = {like: like, user: user, item: item, since: timestamp};
          api.user.mapUserIdToUser(keyspace, tempLike, ['user'], user, next);
        });
      });
    });
  }

  function alterLikeCount (keyspace, item, count, next) {
    next = next || function () {};
    var data = [count, item];
    client.execute(q(keyspace, 'updateCounter', {TYPE: 'likes'}), data, {prepare: true}, next);
  }

  function likeCount (keyspace, item, next) {
    next = next || function () {};
    var cleanItem = api.common.clean(item);
    var data = [cleanItem];
    client.get(q(keyspace, 'selectCount', {TYPE: 'likes', ITEM: 'item'}), data, {prepare: true}, next);
  }

  function addLikeByName (keyspace, username, item, timestamp, next) {
    api.user.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      addLike(keyspace, user.user, item, timestamp, next);
    });
  }

  function removeLike (keyspace, user, item, next) {
    var cleanItem = api.common.clean(item);
    checkLike(keyspace, user, cleanItem, function (err, like) {
      if (err || !like) { return next(err); }
      var deleteData = [user, cleanItem];
      client.execute(q(keyspace, 'removeLike'), deleteData, {prepare: true}, function (err, result) {
        if (err) return next(err);
        alterLikeCount(keyspace, cleanItem, -1, function () {
          api.feed.removeFeedsForItem(keyspace, like.like, function (err) {
            if (err) return next(err);
            next(null, {status: 'removed'});
          });
        });
      });
    });
  }

  function getLikeFromObject (keyspace, likeObject, next) {
    api.user.mapUserIdToUser(keyspace, likeObject, ['user'], undefined, next);
  }

  function getLike (keyspace, like, next) {
    api.common.get(keyspace, 'selectLike', [like], 'one', function (err, result) {
      if (err) { return next(err); }
      api.user.mapUserIdToUser(keyspace, result, ['user'], undefined, next);
    });
  }

  function checkLike (keyspace, user, item, next) {
    var cleanItem = api.common.clean(item);
    api.common.get(keyspace, 'checkLike', [user, cleanItem], 'one', function (err, like) {
      if (err) {
        like = {
          userLikes: false,
          user: user
        };
      } else {
        like.userLikes = true;
      }
      likeCount(keyspace, cleanItem, function (err, count) {
        if (err || !count) { count = { count: 0 }; }
        like.count = +count.count.toString();
        api.user.mapUserIdToUser(keyspace, like, ['user'], user, next);
      });
    });
  }

  return {
    addLike: addLike,
    addLikeByName: addLikeByName,
    removeLike: removeLike,
    getLike: getLike,
    getLikeFromObject: getLikeFromObject,
    checkLike: checkLike,
    likeCount: likeCount
  };

};
