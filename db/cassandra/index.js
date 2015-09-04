var cassandra = require('cassandra-driver');
var Uuid = cassandra.types.Uuid;
var TimeUuid = cassandra.types.TimeUuid;
var path = require('path');
var debug = require('debug')('seguir:cassandra');
var debugDriver = require('debug')('cassandra:driver');
var redisCache = require('./cache');

function createClient (config, next) {

  redisCache(config, function (err, cache) {

    if (err) {
      /* Purposeful ignore of err - never sent */
    }

    var cassandraConfig = config && config.cassandra;
    var client = new cassandra.Client(cassandraConfig);
    client.on('log', function (level, className, message, furtherInfo) {
      debugDriver('log event: %s -- %s', level, message);
    });

    function get (query, data, options, next) {
      if (!next) { next = options; options = {}; }
      if (!next) { next = data; data = null; }
      if (!query) { return next(null); }

      var cacheKey = options.cacheKey;
      var queryOptions = {prepare: true, hints: options.hints};

      debug('get', query, data);
      cache.get(cacheKey, function (err, cachedResult) {
        if (err) { /* Purposeful ignore of err */ }
        if (cachedResult) {
          return next(null, cachedResult);
        }
        client.execute(query, data, queryOptions, function (err, result) {
          if (err) { return next(err); }
          var item = result && result.rows ? result.rows[0] : null;
          if (!item) { return next(); }
          cache.set(cacheKey, item, next);
        });
      });
    }

    function execute (query, data, options, next) {
      var self = this;
      if (!next) { next = options; options = {}; }
      if (!next) { next = data; data = null; }
      if (!query) { return next(null); }

      var cacheKey = options.cacheKey;
      var queryOptions = {prepare: true, hints: options.hints};

      debug('execute', query, data);
      client.execute(query, data, queryOptions, function (err, result) {
        if (err) {
          if (self.truncate && err.message.indexOf('No secondary indexes on the restricted columns') >= 0) {
            // This error occurs after failures in index creation, so in test / truncate mode
            // we need to trigger that the tests rebuild the DB on next go around
            // See https://github.com/cliftonc/seguir/issues/15
            var keyspace = query.split('FROM ')[1].split('.')[0];
            if (keyspace) {
              console.log('Truncating schema version to recover from index failure ...');
              return execute('TRUNCATE ' + keyspace + '.schema_version;', function () {
                next(err);
              });
            }
          }
          return next(err);
        }

        var resultObject = result && result.rows ? result.rows : null;

        // Clear the cache on executes if we have a cache key
        cache.del(cacheKey, function () {
          next(null, resultObject);
        });

      });
    }

    function generateId (uuid) {
      if (uuid) {
        if (isUuid(uuid)) {
          return uuid;
        } else {
          return Uuid.fromString(uuid);
        }
      } else {
        return Uuid.random();
      }
    }

    function generateTimeId (timestamp) {
      if (timestamp) {
        return TimeUuid.fromDate(timestamp);
      } else {
        return TimeUuid.now();
      }
    }

    function isUuid (value) {
      return value instanceof Uuid;
    }

    function isStringUuid (value) {
      return (typeof value === 'string' && value.length === 36 && (value.match(/-/g) || []).length === 4);
    }

    function isValidId (value) {
      return isUuid(value) || isStringUuid(value);
    }

    function formatId (value) {
      if (isUuid(value)) {
        return value;
      } else {
        return generateId(value);
      }
    }

    function getTimestamp (value) {
      return value ? new Date(value) : new Date();
    }

    client.connect(function () {
      next(null, {
        type: 'cassandra',
        config: cassandraConfig,
        _client: client,
        get: get,
        execute: execute,
        setCacheItem: cache.set,
        deleteCacheItem: cache.del,
        flushCache: cache.flush,
        cacheStats: cache.stats,
        resetStats: cache.resetStats,
        generateId: generateId,
        generateTimeId: generateTimeId,
        isValidId: isValidId,
        formatId: formatId,
        getTimestamp: getTimestamp,
        migrations: path.resolve(__dirname, 'migrations'),
        queries: require('./queries'),
        setup: require('./setup')
      });
    });

  });

}

module.exports = createClient;
