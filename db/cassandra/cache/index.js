/**
 * Cassandra doesn't do joins, so we use a cache for GETs.
 *
 * This configuration simply looks for a 'redis' config key, if it exists it will use it as a cache.
 *
 * GET - cache(key, next);
 * SET - cache(key, value, next);
 */

var FIVE_MINUTES = 60 * 5;
var redis = require('../../redis');
var _ = require('lodash');
var cassandra = require('cassandra-driver');
var Uuid = cassandra.types.Uuid;
var debug = require('debug')('seguir:cassandra:cache');

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

  var to_persist = function (object) {

    if (!object) return;

    // Convert all of the Cassandra IDs
    var clone = _.clone(object);
    ['post', 'user', 'follow', 'friend', 'like'].forEach(function (item) {
      if (clone[item]) { clone[item] = clone[item].toString(); }
    });

    // Convert any embedded object to JSON
    if (clone.userdata) { clone.userdata = JSON.stringify(clone.userdata); }

    // Convert any timestamps to ISO strings
    if (clone.since) { clone.since = clone.since.toISOString(); }
    if (clone.posted) { clone.posted = clone.posted.toISOString(); }

    return clone;

  };

  var from_persist = function (clone) {

    // Convert all of the Cassandra IDs back
    ['post', 'user', 'follow', 'friend', 'like'].forEach(function (item) {
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
    debug('SET', key);
    redisClient.multi()
      .hmset(key, to_persist(value))
      .expire(key, FIVE_MINUTES)
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
      cb(null, object ? from_persist(object) : null);
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

