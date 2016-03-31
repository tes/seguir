/**
 * Cassandra doesn't do joins, so we use a cache for GETs.
 *
 * This configuration simply looks for a 'redis' config key, if it exists it will use it as a cache in front
 * of most of the elements that are retrieved in the news feed.
 */

var TWENTY_FOUR_HOURS = 24 * 3600;
var redis = require('../../redis');
var _ = require('lodash');
var cassandra = require('cassandra-driver');
var Uuid = cassandra.types.Uuid;
var Timeuuid = cassandra.types.Timeuuid;
var Long = cassandra.types.Long;
var debug = require('debug')('seguir:cassandra:cache');
var UUID_COLUMNS = ['account', 'tokenid', 'appid', 'post', 'user', 'follow', 'user_follower', 'friend', 'user_friend', 'friend_request', 'like', 'time'];
var TIMEUUID_COLUMNS = ['time'];
var LONG_COLUMNS = ['count'];

module.exports = function (config, next) {
  var _stats = {};
  var stats = function (key, action) {
    var keyType = key.split(':')[0];
    _stats[keyType] = _stats[keyType] || {};
    _stats[keyType][action] = _stats[keyType][action] || 0;
    _stats[keyType][action] = _stats[keyType][action] + 1;
  };
  var resetStats = function () {
    _stats = {};
  };
  var getStats = function () {
    return _stats;
  };
  // Clear each minute to avoid memory leaks
  setInterval(function () {
    resetStats();
  }, 60000);

  var noCache = function (key, value, cb) {
    if (!cb) { cb = value; value = null; }
    if (!cb) { cb = key; key = null; }
    cb(null, value);
  };

  // If no redis config, simply return a miss always
  var hasRedisConfig = config && config.redis;
  if (!hasRedisConfig) { return next(null, {get: noCache, set: noCache, del: noCache, flush: noCache}); }

  var redisClient = redis(config.redis);

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
  var to_cache = function (object) {
    if (!object) return;

    // Clone via stringify / parse
    // The cassandra object is a Row, that has additional enumerable functions attached
    // https://github.com/datastax/nodejs-driver/blob/master/lib/types/row.js
    // We do not want to persist these into the cache
    // May be a more performant way to do this later
    var clone = Object.assign({}, object);

    var CONVERTABLE_COLUMNS = _.union(UUID_COLUMNS, TIMEUUID_COLUMNS, LONG_COLUMNS);
    CONVERTABLE_COLUMNS.forEach(function (item) {
      if (clone[item]) { clone[item] = clone[item].toString(); }
    });

    // Convert any embedded object to JSON
    if (clone.userdata) { clone.userdata = JSON.stringify(clone.userdata); }

    // Trim any null properties as redis doesn't allow them in HMSET
    for (var p in clone) {
      if (!clone[p]) delete clone[p];
    }
    return clone;
  };

  var from_cache = function (clone) {
    if (!clone) return;

    // Convert all of the Cassandra IDs back
    UUID_COLUMNS.forEach(function (item) {
      if (clone[item]) { clone[item] = Uuid.fromString(clone[item]); }
    });

    TIMEUUID_COLUMNS.forEach(function (item) {
      if (clone[item]) { clone[item] = Timeuuid.fromString(clone[item]); }
    });

    LONG_COLUMNS.forEach(function (item) {
      if (clone[item]) { clone[item] = Long.fromString(clone[item]); }
    });

    // Convert any embedded object from JSON
    if (clone.userdata) { clone.userdata = JSON.parse(clone.userdata); }

    // Convert any timestamps back from strings
    if (clone.since) { clone.since = new Date(clone.since); }
    if (clone.posted) { clone.posted = new Date(clone.posted); }

    return clone;
  };

  var set = function (key, value, cb) {
    if (!key) { return cb(null, value); }
    if (value === undefined || value === null) { return cb(null); }
    debug('SET', key);
    stats(key, 'SET');
    redisClient.multi()
      .hmset(key, to_cache(value))
      .expire(key, config.redis.ttl || TWENTY_FOUR_HOURS)
      .exec(function (err) {
        if (err) { /* Purposeful ignore of err */ }
        cb(null, value);
      });
  };

  var del = function (key, cb) {
    if (!key) { return cb(null); }
    debug('DEL', key);
    stats(key, 'DEL');
    redisClient.del(key, function (err) {
      if (err) { /* Purposeful ignore of err */ }
      cb(null);
    });
  };

  var flush = function (cb) {
    debug('FLUSH');
    redisClient.flushdb(function (err) {
      if (err) { /* Purposeful ignore of err */ }
      cb(null);
    });
  };

  var get = function (key, cb) {
    if (!key) { return cb(null); }
    debug('GET', key);
    stats(key, 'GET');
    redisClient.hgetall(key, function (err, object) {
      if (err) { /* Purposeful ignore of err */ }
      var hitOrMiss = object ? 'HIT' : 'MISS';
      debug(hitOrMiss, key);
      stats(key, hitOrMiss);
      cb(null, object ? from_cache(object) : null);
    });
  };

  var cache = {
    get: get,
    set: set,
    del: del,
    flush: flush,
    stats: getStats,
    resetStats: resetStats
  };

  next(null, cache);
};
