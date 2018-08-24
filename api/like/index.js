var async = require('async');
var debug = require('debug')('seguir:like');

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

  function alterLikeCount (keyspace, item, count, next) {
    var data = [count, item.toString()];
    debug('updateCounter', data);
    client.execute(q(keyspace, 'updateCounter', {TYPE: 'likes'}), data, {cacheKey: 'count:like:' + item}, next);
  }

  function likeCount (keyspace, item, next) {
    var data = [item.toString()];
    debug('selectCount', data);
    client.get(q(keyspace, 'selectCount', {TYPE: 'likes'}), data, {cacheKey: 'count:like:' + item}, next);
  }

  function createLike (keyspace, user, item, timestamp, next) {
    var like = client.generateId();
    var data = [like, user, item, timestamp];
    debug('upsertLike', data);
    client.execute(q(keyspace, 'upsertLike'), data, {}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      alterLikeCount(keyspace, item, 1, function (err) {
        if (err) { return next(err); }
        checkLike(keyspace, user, item, next);
      });
    });
    api.metrics.increment('like.add');
  }

  function deleteLike (keyspace, user, item, next) {
    checkLike(keyspace, user, item, function (err, like) {
      if (err || !like.userLiked) { return next(err); }
      var data = [user, item];
      debug('removeLike', data);
      client.execute(q(keyspace, 'removeLike'), data, {cacheKey: 'like:' + like.like}, function (err) {
        if (err) return next(err);
        alterLikeCount(keyspace, item, -1, function () {
          client.deleteCacheItem('like:' + user + ':' + item, function () {
            checkLike(keyspace, user, item, next);
          });
        });
      });
    });
    api.metrics.increment('like.remove');
  }

  function deleteLikesByUser (keyspace, user, next) {
    client.execute(q(keyspace, 'likesByUser'), [user], function (err, results) {
      if (err) return next(err);
      async.each(results, function (like, cb) {
        client.execute(q(keyspace, 'removeLike'), [user, like.item], {cacheKey: 'like:' + like.like}, function (err) {
          if (err) return cb(err);
          alterLikeCount(keyspace, like.item, -1, function () {
            client.deleteCacheItem('like:' + user + ':' + like.item, function () {
              cb();
            });
          });
        });
      }, next);
    });
  }

  function getLikeFromObject (keyspace, item, next) {
    var likeObject = api.common.expandEmbeddedObject(item, 'like', 'like');
    api.user.mapUserIdToUser(keyspace, likeObject, ['user'], next);
  }

  function getLike (keyspace, like, expandUser, next) {
    client.get(q(keyspace, 'selectLike'), [like], {cacheKey: 'like:' + like}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next({statusCode: 404, message: 'Like not found'}); }
      api.user.mapUserIdToUser(keyspace, result, ['user'], expandUser, next);
    });
  }

  function checkLike (keyspace, user, item, next) {
    likeCount(keyspace, item, function (err, count) {
      if (err) { return next(err); }
      if (!user) {
        return next(null, {
          userLiked: false,
          like: null,
          likedTotal: count ? +count.count : 0
        });
      }

      var data = [user, item];
      debug('checkLike', [user, item]);
      client.get(q(keyspace, 'checkLike'), data, {cacheKey: 'like:' + user + ':' + item}, function (err, like) {
        if (err) { return next(err); }

        next(null, {
          userLiked: !!like,
          like: like && like.like,
          likedTotal: count ? +count.count : 0
        });
      });
    });
    api.metrics.increment('like.check');
  }

  return {
    createLike: createLike,
    deleteLike: deleteLike,
    deleteLikesByUser: deleteLikesByUser,
    getLike: getLike,
    getLikeFromObject: getLikeFromObject,
    checkLike: checkLike
  };
};
