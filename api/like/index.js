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
    var data = [like, user, cleanItem, timestamp, api.visibility.PUBLIC];
    var object = _.object(['like', 'user', 'item', 'timestamp', 'visibility'], data);
    object.ispersonal = false;
    object.isprivate = false;
    client.execute(q(keyspace, 'upsertLike'), data, {prepare: true}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      alterLikeCount(keyspace, cleanItem, 1, function () {
        api.feed.addFeedItem(keyspace, user, object, 'like', function (err, result) {
          if (err) { return next(err); }
          var tempLike = {like: like, user: user, item: item, since: timestamp, visibility: api.visibility.PUBLIC};
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
      client.execute(q(keyspace, 'removeLike'), deleteData, {prepare: true, cacheKey: 'like:' + like}, function (err, result) {
        if (err) return next(err);
        alterLikeCount(keyspace, cleanItem, -1, function () {
          api.feed.removeFeedsForItem(keyspace, like.like, function (err) {
            if (err) return next(err);
            client.deleteCacheItem('like:' + user + ':' + cleanItem, function () {
              next(null, {status: 'removed'});
            });
          });
        });
      });
    });
  }

  function getLikeFromObject (keyspace, item, next) {
    var likeObject = api.common.expandEmbeddedObject(item, 'like', 'like');
    api.user.mapUserIdToUser(keyspace, likeObject, ['user'], undefined, true, function (err, objectWithUsers) {
      if (err) { return next(err); }
      likeObject.user = objectWithUsers.user;
      next(null, likeObject);
    });
  }

  function getLike (keyspace, like, expandUser, next) {
    if (!next) { next = expandUser; expandUser = true; }
    client.get(q(keyspace, 'selectLike'), [like], {cacheKey: 'like:' + like}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next({statusCode: 404, message: 'Like not found'}); }
      api.user.mapUserIdToUser(keyspace, result, ['user'], undefined, expandUser, next);
    });
  }

  function checkLike (keyspace, user, item, next) {
    var cleanItem = api.common.clean(item);
    client.get(q(keyspace, 'checkLike'), [user, cleanItem], {cacheKey: 'like:' + user + ':' + cleanItem}, function (err, like) {
      if (err || !like) {
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
