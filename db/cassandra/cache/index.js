/**
 * Cassandra doesn't do joins, so we use a cache for GETs.
 *
 * This configuration simply looks for a 'redis' config key, if it exists it will use it as a cache in front
 * of most of the elements that are retrieved in the news feed.
 */

var TEN_MINUTES = 60 * 10;
var redis = require('../../redis');
var _ = require('lodash');
var cassandra = require('cassandra-driver');
var Uuid = cassandra.types.Uuid;
var debug = require('debug')('seguir:cassandra:cache');
var UUID_COLUMNS = ['post', 'user', 'follow', 'user_follower', 'friend', 'user_friend', 'friend_request', 'like'];

module.exports = function (config, next) {

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

    // Convert all of the Cassandra IDs
    var clone = _.clone(object);
    UUID_COLUMNS.forEach(function (item) {
      if (clone[item]) { clone[item] = clone[item].toString(); }
    });

    // Convert any embedded object to JSON
    if (clone.userdata) { clone.userdata = JSON.stringify(clone.userdata); }

    // Convert any timestamps to ISO strings
    if (clone.since) { clone.since = clone.since.toISOString(); }
    if (clone.posted) { clone.posted = clone.posted.toISOString(); }

    return clone;

  };

  var from_cache = function (clone) {

    if (!clone) return;

    // Convert all of the Cassandra IDs back
    UUID_COLUMNS.forEach(function (item) {
      if (clone[item]) { clone[item] = Uuid.fromString(clone[item]); }
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
    if (!value) { return cb(null); }
    debug('SET', key);
    redisClient.multi()
      .hmset(key, to_cache(value))
      .expire(key, config.redis.ttl || TEN_MINUTES)
      .exec(function (err) {
        if (err) { /* Purposeful ignore of err */ }
        cb(null, value);
      });
  };

  var del = function (key, cb) {
    if (!key) { return cb(null); }
    debug('DEL', key);
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
    redisClient.hgetall(key, function (err, object) {
      if (err) { /* Purposeful ignore of err */ }
      debug(object ? 'HIT' : 'MISS', key);
      cb(null, object ? from_cache(object) : null);
    });
  };

  var cache = {
    get: get,
    set: set,
    del: del,
    flush: flush
  };

  next(null, cache);

};

