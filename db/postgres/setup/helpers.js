var async = require('async');
var debug = require('debug')('seguir:postgres');
var q = require('../queries');

/**
 *  Setup code follows below
 *  We continue to use the term KEYSPACE for Schema in postgres land to keep the code feeling consistent
 *  may make sense to refactor this out at some point if postgres takes over.
 */
module.exports = function (client, options) {

  var KEYSPACE = options.KEYSPACE,
      tables = options.tables || [],
      indexes = options.indexes || [];

  /* istanbul ignore next */
  function dropKeyspace (next) {
    debug('Dropping keyspace: ' + KEYSPACE + '...');
    client.execute('DROP SCHEMA IF EXISTS ' + KEYSPACE + ' CASCADE', function (err) {
      return next(err);
    });
  }

  /* istanbul ignore next */
  function createKeyspace (next) {
    debug('Creating keyspace: ' + KEYSPACE + '...');
    client.execute('CREATE SCHEMA ' + KEYSPACE, next);
  }

  /* istanbul ignore next */
  function createTables (next) {
    debug('Creating tables in: ' + KEYSPACE + '...');
    async.mapSeries(tables, function (cql, cb) {
      debug(cql);
      client.execute(cql, function (err) {
        return cb(err);
      });
    }, next);
  }

  /* istanbul ignore next */
  function createSecondaryIndexes (next) {
    debug('Creating secondary indexes in: ' + KEYSPACE + '...');
    async.mapSeries(indexes, function (cql, cb) {
      debug(cql);
      client.execute(cql, function (err) {
        return cb(err);
      });
    }, next);
  }

  /* istanbul ignore next */
  function initialiseSchemaVersion (next) {
    debug('Initialising schema version for ' + KEYSPACE + '...');
    client.execute(q(KEYSPACE, 'insertSchemaVersion'), [0, client.getTimestamp(), 'Initial version'], function (err) {
      return next(err);
    });
  }

  return {
    dropKeyspace: dropKeyspace,
    createKeyspace: createKeyspace,
    createTables: createTables,
    createSecondaryIndexes: createSecondaryIndexes,
    initialiseSchemaVersion: initialiseSchemaVersion
  };

};
