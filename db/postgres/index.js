var pg = require('pg');
var uuid = require('uuid');
var path = require('path');
var debug = require('debug')('seguir:postgres');
var async = require('async');
var QueryStream = require('pg-query-stream');

function createClient (config, next) {
  var pgConfig = config.postgres;

  function getConnectionString () {
    return 'postgres://' + pgConfig.user + ':' + (pgConfig.password || '') + '@' + (pgConfig.host || 'localhost') + '/' + pgConfig.database;
  }

  function get (query, data, options, next) {
    if (!next) {
      next = options;
      options = null;
    }
    if (!next) {
      next = data;
      data = null;
    }
    if (!query) { return next(null); }
    pg.connect(getConnectionString(), function (err, client, done) {
      if (err) { return next(err); }
      debug('get', query, data);
      client.query(query, data, function (err, result) {
        if (err) { return next(err); }
        done();
        next(null, result && result.rows ? result.rows[0] : null);
      });
    });
  }

  function stream (query, data, next) {
    pg.connect(getConnectionString(), function (err, client, done) {
      if (err) { return next(err); }
      debug('stream', query, data);
      var pgQuery = new QueryStream(query, data);
      var stream = client.query(pgQuery);
      stream.on('end', done);
      next(null, stream);
    });
  }

  function execute (query, data, options, next) {
    if (!next) {
      next = options;
      options = {};
    }
    if (!next) {
      next = data;
      data = null;
    }
    if (!query) { return next(null); }

    var pageSize = options.pageSize;
    var pageState = options.pageState;
    var shouldPaginate = Boolean(pageSize);

    if (shouldPaginate) {
      if (!query.match(/ORDER BY/)) {
        return next(new Error('Query (' + query + ') does not have an ORDER BY clause. This will lead to strange ordering behaviour.'));
      }
      query = query + generateLimitStatement(pageState, pageSize);
    }

    pg.connect(getConnectionString(), function (err, client, done) {
      if (err) { return next(err); }
      debug('execute', query, data);
      client.query(query, data, function (err, result) {
        if (err) { return next(err); }
        done();
        var rows = result && result.rows ? result.rows : null;
        var nextPageState = shouldPaginate ? getPageState(rows, pageState, pageSize) : null;
        if (shouldPaginate && rows.length > pageSize) { rows.pop(); } // remove the extra paging result
        next(null, rows, nextPageState);
      });
    });
  }

  function getPageState (rows, pageState, pageSize) {
    // no pagination - no pagestate
    // if we didn't get the maximum number of rows
    if (!rows || rows.length <= pageSize) { return null; }

    return (pageState || 0) + pageSize;
  }

  function generateLimitStatement (offset, pageSize) {
    // get one extra one such that we know whether there is another page
    var limitStatement = ' LIMIT ' + (pageSize + 1);
    var offsetStatement = ' OFFSET ';
    if (offset) {
      offsetStatement = offsetStatement + offset;
    } else {
      offsetStatement = offsetStatement + '0';
    }

    return limitStatement + offsetStatement;
  }

  function batch () {
    var queries = [];
    return {
      addQuery: function (query, data) {
        queries.push({query: query, data: data});
        return this;
      },
      execute: function (next) {
        async.map(queries, function (query, cb) {
          execute(query.query, query.data, {}, cb);
        }, function (err, results) {
          if (err) { return next(err); }
          next(null, results);
        });
      }
    };
  }

  function generateId (suppliedUuid) {
    if (suppliedUuid) return suppliedUuid;
    return uuid.v4();
  }

  function generateTimeId (timestamp) {
    if (timestamp) return timestamp;
    return new Date();
  }

  function getTimestamp (value) {
    return value ? new Date(value) : new Date();
  }

  function isValidId (value) {
    return (typeof value === 'string' && value.length === 36 && (value.match(/-/g) || []).length === 4);
  }

  function formatId (value) {
    return value;
  }

  function noOpCache (key, value, cb) {
    if (!cb) {
      cb = value;
      value = null;
    }
    if (!cb) {
      cb = key;
      key = null;
    }
    cb();
  }

  next(null, {
    type: 'postgres',
    config: pgConfig,
    get: get,
    execute: execute,
    deleteCacheItem: noOpCache,
    setCacheItem: noOpCache,
    flushCache: noOpCache,
    cacheStats: {},
    generateId: generateId,
    generateTimeId: generateTimeId,
    isValidId: isValidId,
    formatId: formatId,
    getTimestamp: getTimestamp,
    migrations: path.resolve(__dirname, 'migrations'),
    queries: require('./queries'),
    setup: require('./setup'),
    get batch () {
      return batch();
    },
    stream: stream
  });
}

module.exports = createClient;
