var async = require('async');
var verbose = process.env.SEGUIR_DEBUG ? true : false;
/**
 *  Setup code follows below
 */
module.exports = function(client, options) {

  var KEYSPACE = options.KEYSPACE,
      tables = options.tables || [],
      indexes = options.indexes || [],
      verbose = options.verbose;

  /* istanbul ignore next */
  function dropKeyspace(next) {
    if(verbose) console.log('Dropping keyspace: ' + KEYSPACE + '...');
    client.execute('DROP KEYSPACE ' + KEYSPACE, function(err) {
      if(err && err.code === 8960) { return next(); }
      return next(err);
    });
  }

  /* istanbul ignore next */
  function createKeyspace(next) {
    if(verbose) console.log('Creating keyspace: ' + KEYSPACE + '...');
    client.execute('CREATE KEYSPACE IF NOT EXISTS ' + KEYSPACE + ' WITH replication ' +
                  '= {\'class\' : \'SimpleStrategy\', \'replication_factor\' : 3};', next);
  }

  /* istanbul ignore next */
  function createTables(next) {

    if(verbose) console.log('Creating tables in: ' + KEYSPACE + '...');

    async.map(tables, function(cql, cb) {
      if(verbose) console.log(cql);
      client.execute(cql, function(err) {
        if(err && (err.code == 9216 || err.code == 8704)) { // Already exists
          return cb();
        }
        return cb(err);
      });
    }, next);

  }

  /* istanbul ignore next */
  function createSecondaryIndexes(next) {

    if(verbose) console.log('Creating secondary indexes in: ' + KEYSPACE + '...');
    async.map(indexes, function(cql, cb) {
      if(verbose) console.log(cql);
      client.execute(cql, function(err) {
        if(err && (err.code == 9216 || err.code == 8704)) { // Already exists
          return cb();
        }
        return cb(err);
      });
    }, next);

  }

  return {
    dropKeyspace: dropKeyspace,
    createKeyspace: createKeyspace,
    createTables: createTables,
    createSecondaryIndexes: createSecondaryIndexes
  }

}
