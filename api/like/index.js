const async = require('async');
const debug = require('debug')('seguir:like');

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

  const alterLikeCount = (keyspace, item, count, next) => {
    const data = [count, item.toString()];
    debug('updateCounter', data);
    client.execute(q(keyspace, 'updateCounter', {TYPE: 'likes'}), data, {cacheKey: 'count:like:' + item}, next);
  };

  const likeCount = (keyspace, item, next) => {
    const data = [item.toString()];
    debug('selectCount', data);
    client.get(q(keyspace, 'selectCount', {TYPE: 'likes'}), data, {cacheKey: 'count:like:' + item}, next);
  };

  const createLike = (keyspace, user, item, timestamp, next) => {
    const like = client.generateId();
    const data = [like, user, item, timestamp];
    debug('upsertLike', data);
    client.execute(q(keyspace, 'upsertLike'), data, {}, (err) => {
      /* istanbul ignore if */
      if (err) { return next(err); }
      alterLikeCount(keyspace, item, 1, (err) => {
        if (err) { return next(err); }
        checkLike(keyspace, user, item, next);
      });
    });
    api.metrics.increment('like.add');
  };

  const deleteLike = (keyspace, user, item, next) => {
    checkLike(keyspace, user, item, (err, like) => {
      if (err || !like.userLiked) { return next(err); }
      const data = [user, item];
      debug('removeLike', data);
      client.execute(q(keyspace, 'removeLike'), data, {cacheKey: 'like:' + like.like}, (err) => {
        if (err) return next(err);
        alterLikeCount(keyspace, item, -1, () => {
          client.deleteCacheItem('like:' + user + ':' + item, () => {
            checkLike(keyspace, user, item, next);
          });
        });
      });
    });
    api.metrics.increment('like.remove');
  };

  const deleteLikesByUser = (keyspace, user, next) => {
    client.execute(q(keyspace, 'likesByUser'), [user], (err, results) => {
      if (err) return next(err);
      async.each(results, (like, cb) => {
        client.execute(q(keyspace, 'removeLike'), [user, like.item], {cacheKey: 'like:' + like.like}, (err) => {
          if (err) return cb(err);
          alterLikeCount(keyspace, like.item, -1, () => {
            client.deleteCacheItem('like:' + user + ':' + like.item, () => {
              cb();
            });
          });
        });
      }, next);
    });
  };

  const getLikeFromObject = (keyspace, item, next) => {
    const likeObject = api.common.expandEmbeddedObject(item, 'like', 'like');
    api.user.mapUserIdToUser(keyspace, likeObject, ['user'], next);
  };

  const getLike = (keyspace, like, expandUser, next) => {
    client.get(q(keyspace, 'selectLike'), [like], {cacheKey: 'like:' + like}, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next({statusCode: 404, message: 'Like not found'}); }
      api.user.mapUserIdToUser(keyspace, result, ['user'], expandUser, next);
    });
  };

  const checkLike = (keyspace, user, item, next) => {
    likeCount(keyspace, item, (err, count) => {
      if (err) { return next(err); }
      if (!user) {
        return next(null, {
          userLiked: false,
          like: null,
          likedTotal: count ? +count.count : 0
        });
      }

      const data = [user, item];
      debug('checkLike', [user, item]);
      client.get(q(keyspace, 'checkLike'), data, {cacheKey: 'like:' + user + ':' + item}, (err, like) => {
        if (err) { return next(err); }

        next(null, {
          userLiked: !!like,
          like: like && like.like,
          likedTotal: count ? +count.count : 0
        });
      });
    });
    api.metrics.increment('like.check');
  };

  return {
    createLike: createLike,
    deleteLike: deleteLike,
    deleteLikesByUser: deleteLikesByUser,
    getLike: getLike,
    getLikeFromObject: getLikeFromObject,
    checkLike: checkLike
  };
};
