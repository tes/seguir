/* eslint-disable no-confusing-arrow */
const cassandra = require('cassandra-driver');
const Uuid = cassandra.types.Uuid;
const TimeUuid = cassandra.types.TimeUuid;
const path = require('path');
const debug = require('debug')('seguir:cassandra');
const debugDriver = require('debug')('cassandra:driver');
const redisCache = require('./cache');
const async = require('async');
const _ = require('lodash');

const createClient = (config, logger, next) => {
  redisCache(config, logger, (err, cache) => {
    if (err) {
      /* Purposeful ignore of err - never sent */
    }

    const cassandraConfig = config && config.cassandra;

    if (cassandraConfig && cassandraConfig.authUsername && cassandraConfig.authPassword) {
      cassandraConfig.authProvider = new cassandra.auth.PlainTextAuthProvider(cassandraConfig.authUsername, cassandraConfig.authPassword);
    }

    const client = new cassandra.Client(cassandraConfig);
    client.on('log', (level, className, message) => {
      debugDriver('log event: %s -- %s', level, message);
    });

    const get = (query, data, options, next) => {
      if (!next) {
        next = options;
        options = {};
      }
      if (!next) {
        next = data;
        data = null;
      }
      if (!query) { return next(null); }

      const cacheKey = options.cacheKey;
      const queryOptions = { prepare: true, hints: options.hints };

      debug('get', query, data);
      cache.get(cacheKey, (err, cachedResult) => {
        if (err) { /* Purposeful ignore of err */ }
        if (cachedResult) {
          return next(null, cachedResult);
        }
        client.execute(query, data, queryOptions, (err, result) => {
          if (err) { return next(err); }
          const item = result && result.rows ? result.rows[0] : null;
          if (!item) { return next(); }
          cache.set(cacheKey, item, next);
        });
      });
    };

    const stream = (query, data, next) => {
      debug('stream', query, data);
      return next(null, client.stream(query, data, { prepare: true, autoPage: true, fetchSize: 1000 }));
    };

    const execute = (query, data, options, next) => {
      const self = this;
      if (!next) {
        next = options;
        options = {};
      }
      if (!next) {
        next = data;
        data = null;
      }
      if (!query) { return next(null); }

      const cacheKey = options.cacheKey;
      const queryOptions = {
        prepare: true,
        hints: options.hints,
        fetchSize: options.pageSize,
        pageState: options.pageState,
      };

      debug('execute', query, data);
      client.execute(query, data, queryOptions, (err, result) => {
        if (err) {
          if (self.truncate && err.message.indexOf('No secondary indexes on the restricted columns') >= 0) {
            // This error occurs after failures in index creation, so in test / truncate mode
            // we need to trigger that the tests rebuild the DB on next go around
            // See https://github.com/cliftonc/seguir/issues/15
            const keyspace = query.split('FROM ')[1].split('.')[0];
            if (keyspace) {
              console.log('Truncating schema version to recover from index failure ...');
              return execute(`TRUNCATE ${keyspace}.schema_version;`, () => {
                next(err);
              });
            }
          }
          return next(err);
        }

        const resultObject = result && result.rows ? result.rows : null;

        // Clear the cache on executes if we have a cache key
        cache.del(cacheKey, () => {
          next(null, resultObject, result && result.pageState);
        });
      });
    };

    // useful only for updates/inserts/delete - thus not returning anything
    // http://docs.datastax.com/en/cql/3.1/cql/cql_reference/batch_r.html
    const batch = () => {
      const queries = [];
      return {
        addQuery(query, data, cacheKey) {
          queries.push({ query: { query, params: data }, cacheKey });
          return this;
        },
        execute(next) {
          _.each(queries, (query) => {
            debug('batch', query.query, query.params);
          });

          client.batch(_.map(queries, 'query'), { prepare: true }, (err) => {
            if (err) { return next(err); }
            // Clear the cache on batch if we have a cache key
            async.each(queries, (query, cb) => { cache.del(query.cacheKey, cb); }, next);
          });
        },
      };
    };

    const isUuid = value => value instanceof Uuid;

    const generateId = uuid => {
      if (uuid) {
        if (isUuid(uuid)) {
          return uuid;
        }
        return Uuid.fromString(uuid);
      }
      return Uuid.random();
    };

    const generateTimeId = timestamp => timestamp ? TimeUuid.fromDate(timestamp) : TimeUuid.now();

    const isStringUuid = value => typeof value === 'string' && value.length === 36 && (value.match(/-/g) || []).length === 4;

    const isValidId = value => isUuid(value) || isStringUuid(value);

    const formatId = value => isUuid(value) ? value : generateId(value);

    const getTimestamp = value => value ? new Date(value) : new Date();

    client.connect((err) => {
      if (err) { return next(err); }
      next(null, {
        type: 'cassandra',
        config: cassandraConfig,
        _client: client,
        get,
        execute,
        setCacheItem: cache.set,
        deleteCacheItem: cache.del,
        flushCache: cache.flush,
        cacheStats: cache.stats,
        resetStats: cache.resetStats,
        generateId,
        generateTimeId,
        isValidId,
        formatId,
        getTimestamp,
        migrations: path.resolve(__dirname, 'migrations'),
        queries: require('./queries'), // eslint-disable-line global-require
        setup: require('./setup'), // eslint-disable-line global-require
        get batch() {
          return batch();
        },
        stream,
      });
    });
  });
};

module.exports = createClient;
