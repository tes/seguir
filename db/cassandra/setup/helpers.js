var cassandra = require('cassandra-driver');
var async = require('async');
var q = require('../queries');
var verbose = process.env.SEGUIR_DEBUG;

/**
 *  Setup code follows below
 */
module.exports = function (client, options) {
  var KEYSPACE = options.KEYSPACE;
  var tables = options.tables || [];
  var indexes = options.indexes || [];

  /* istanbul ignore next */
  function dropKeyspace (next) {
    client._client.connect(function () {
      if (client._client.metadata.keyspaces[KEYSPACE]) {
        if (verbose) console.log('Dropping keyspace: ' + KEYSPACE + '...');
        client.execute('DROP KEYSPACE ' + KEYSPACE, function (err) {
          if (err && err.code === 8960) { return next(); }
          return next(err);
        });
      } else {
        return next();
      }
    });
  }

  /* istanbul ignore next */
  function createKeyspace (next) {
    if (verbose) console.log('Creating keyspace: ' + KEYSPACE + '...');
    client.execute('CREATE KEYSPACE IF NOT EXISTS ' + KEYSPACE + ' WITH replication ' +
                  '= {\'class\' : \'SimpleStrategy\', \'replication_factor\' : 3};', next);
  }

  function truncate (next) {
    console.log('    !! Truncating vs recreating tables ...');
    async.map(tables, function (cql, cb) {
      var tableName = cql.split(KEYSPACE + '.')[1].split(' ')[0];
      if (tableName !== 'schema_version') {
        var truncateCql = 'TRUNCATE ' + KEYSPACE + '.' + tableName;
        client.execute(truncateCql, cb);
      } else {
        cb();
      }
    }, function () {
      flushCache(next);
    });
  }

  /* istanbul ignore next */
  function createTables (next) {
    if (verbose) console.log('Creating tables in: ' + KEYSPACE + '...');

    async.map(tables, function (cql, cb) {
      if (verbose) console.log(cql);
      client.execute(cql, function (err) {
        if (err && (err.code === 9216)) { // Already exists
          return cb();
        }
        return cb(err);
      });
    }, next);
  }

  /* istanbul ignore next */
  function createSecondaryIndexes (next) {
    if (verbose) console.log('Creating secondary indexes in: ' + KEYSPACE + '...');
    async.map(indexes, function (cql, cb) {
      client.execute(cql, function (err) {
        if (err && (err.code === 9216 || err.code === 8704)) { // Already exists
          return cb();
        }
        return cb(err);
      });
    }, next);
  }

   /* istanbul ignore next */
  function initialiseSchemaVersion (version, next) {
    client.execute(q(KEYSPACE, 'insertSchemaVersion'), [cassandra.types.Integer.fromInt(version), new Date(), 'Initial version'], function () {
      // Ignore error - as it may be that the schema_version table does not yet exist
      return next();
    });
  }

  function flushCache (next) {
    client.flushCache(next);
  }

  return {
    dropKeyspace: dropKeyspace,
    createKeyspace: createKeyspace,
    createTables: createTables,
    createSecondaryIndexes: createSecondaryIndexes,
    initialiseSchemaVersion: initialiseSchemaVersion,
    truncate: truncate,
    flushCache: flushCache
  };
};
