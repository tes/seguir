/**
 * Cassandra doesn't do joins, so we use a cache for GETs.
 *
 * This configuration simply looks for a 'redis' config key, if it exists it will use it as a cache in front
 * of most of the elements that are retrieved in the news feed.
 */
const TWENTY_FOUR_HOURS = 24 * 3600;
const redis = require('../../redis');
const _ = require('lodash');
const cassandra = require('cassandra-driver');
const Uuid = cassandra.types.Uuid;
const Timeuuid = cassandra.types.Timeuuid;
const Long = cassandra.types.Long;
const debug = require('debug')('seguir:cassandra:cache');
const UUID_COLUMNS = ['account', 'tokenid', 'appid', 'post', 'user', 'follow', 'user_follower', 'friend', 'user_friend', 'friend_request', 'like', 'time'];
const TIMEUUID_COLUMNS = ['time'];
const LONG_COLUMNS = ['count'];

module.exports = (config, next) => {
  let _stats = {};
  const stats = (key, action) => {
    const keyType = key.split(':')[0];
    _stats[keyType] = _stats[keyType] || {};
    _stats[keyType][action] = _stats[keyType][action] || 0;
    _stats[keyType][action] = _stats[keyType][action] + 1;
  };
  const resetStats = () => {
    _stats = {};
  };
  const getStats = () => _stats;

  // Clear each minute to avoid memory leaks
  setInterval(() => {
    resetStats();
  }, 60000);

  const noCache = (key, value, cb) => {
    if (!cb) { cb = value; value = null; }
    if (!cb) { cb = key; key = null; }
    cb(null, value);
  };

  // If no redis config, simply return a miss always
  const hasRedisConfig = config && config.redis;
  if (!hasRedisConfig) { return next(null, {get: noCache, set: noCache, del: noCache, flush: noCache}); }

  const redisClient = redis(config.redis);

  /**
   * Persisting objects in redis converts all of the values to strings.
   * So we need to serialise it in a way that we can then recover it back to its former glory.
   *
   * - Cassandra UUID > String
   * - Embedded json > String
   * - Dates - ISO strings (to retain the milliseconds)
   *
   * Then we do the reverse on the way back
   */
  const to_cache = (object) => {
    if (!object) return;

    // Clone via stringify / parse
    // The cassandra object is a Row, that has additional enumerable functions attached
    // https://github.com/datastax/nodejs-driver/blob/master/lib/types/row.js
    // We do not want to persist these into the cache
    // May be a more performant way to do this later
    const clone = Object.assign({}, object);

    const CONVERTABLE_COLUMNS = _.union(UUID_COLUMNS, TIMEUUID_COLUMNS, LONG_COLUMNS);
    CONVERTABLE_COLUMNS.forEach((item) => {
      if (clone[item]) { clone[item] = clone[item].toString(); }
    });

    // Convert any embedded object to JSON
    if (clone.userdata) { clone.userdata = JSON.stringify(clone.userdata); }

    // Trim any null properties as redis doesn't allow them in HMSET
    for (let p in clone) {
      if (!clone[p]) delete clone[p];
    }
    return clone;
  };

  const from_cache = (clone) => {
    if (!clone) return;

    // Convert all of the Cassandra IDs back
    UUID_COLUMNS.forEach((item) => {
      if (clone[item]) { clone[item] = Uuid.fromString(clone[item]); }
    });

    TIMEUUID_COLUMNS.forEach((item) => {
      if (clone[item]) { clone[item] = Timeuuid.fromString(clone[item]); }
    });

    LONG_COLUMNS.forEach((item) => {
      if (clone[item]) { clone[item] = Long.fromString(clone[item]); }
    });

    // Convert any embedded object from JSON
    if (clone.userdata) { clone.userdata = JSON.parse(clone.userdata); }

    // Convert any timestamps back from strings
    if (clone.since) { clone.since = new Date(clone.since); }
    if (clone.posted) { clone.posted = new Date(clone.posted); }

    return clone;
  };

  const set = (key, value, cb) => {
    if (!key) { return cb(null, value); }
    if (value === undefined || value === null) { return cb(null); }
    debug('SET', key);
    stats(key, 'SET');
    redisClient.multi()
      .hmset(key, to_cache(value))
      .expire(key, config.redis.ttl || TWENTY_FOUR_HOURS)
      .exec((err) => {
        if (err) { /* Purposeful ignore of err */ }
        cb(null, value);
      });
  };

  const del = (key, cb) => {
    if (!key) { return cb(null); }
    debug('DEL', key);
    stats(key, 'DEL');
    redisClient.del(key, (err) => {
      if (err) { /* Purposeful ignore of err */ }
      cb(null);
    });
  };

  const flush = (cb) => {
    debug('FLUSH');
    redisClient.flushdb((err) => {
      if (err) { /* Purposeful ignore of err */ }
      cb(null);
    });
  };

  const get = (key, cb) => {
    if (!key) { return cb(null); }
    debug('GET', key);
    stats(key, 'GET');
    redisClient.hgetall(key, (err, object) => {
      if (err) { /* Purposeful ignore of err */ }
      const hitOrMiss = object ? 'HIT' : 'MISS';
      debug(hitOrMiss, key);
      stats(key, hitOrMiss);
      cb(null, object ? from_cache(object) : null);
    });
  };

  const cache = {
    get,
    set,
    del,
    flush,
    stats: getStats,
    resetStats: resetStats
  };

  next(null, cache);
};
