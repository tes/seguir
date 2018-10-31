const cassandra = require('cassandra-driver');
const async = require('async');
const q = require('../queries');
const verbose = process.env.SEGUIR_DEBUG;
const _ = require('lodash');

/**
 *  Setup code follows below
 */
module.exports = (client, options) => {
  const KEYSPACE = options.KEYSPACE;
  const tables = options.tables || [];
  const indexes = options.indexes || [];
  const indexList = options.tableIndexes || [];

  /* istanbul ignore next */
  const dropKeyspace = (next) => {
    client._client.connect(() => {
      if (client._client.metadata.keyspaces[KEYSPACE]) {
        if (verbose) console.log(`Dropping keyspace: ${KEYSPACE}...`);
        client.execute(`DROP KEYSPACE ${KEYSPACE}`, err => {
          if (err && err.code === 8960) { return next(); }
          return next(err);
        });
      } else {
        return next();
      }
    });
  };

  /* istanbul ignore next */
  const createKeyspace = (next) => {
    if (verbose) console.log(`Creating keyspace: ${KEYSPACE}...`);
    client.execute(`CREATE KEYSPACE IF NOT EXISTS ${KEYSPACE} WITH replication = {\'class\' : \'SimpleStrategy\', \'replication_factor\' : 3};`, next);
  };

  const flushCache = (next) => {
    client.flushCache(next);
  };

  const truncate = (next) => {
    console.log('    !! Truncating vs recreating tables ...');
    async.map(tables, (cql, cb) => {
      const tableName = cql.split(`${KEYSPACE}.`)[1].split(' ')[0];
      if (tableName !== 'schema_version') {
        const truncateCql = `TRUNCATE ${KEYSPACE}.${tableName}`;
        client.execute(truncateCql, cb);
      } else {
        cb();
      }
    }, () => {
      flushCache(next);
    });
  };

  /* istanbul ignore next */
  const createTables = (next) => {
    if (verbose) console.log(`Creating tables in: ${KEYSPACE}...`);

    async.map(tables, (cql, cb) => {
      if (verbose) console.log(cql);
      client.execute(cql, (err) => {
        if (err && (err.code === 9216)) { // Already exists
          return cb();
        }
        return cb(err);
      });
    }, next);
  };

  /* istanbul ignore next */
  const createSecondaryIndexes = (next) => {
    if (verbose) console.log(`Creating secondary indexes in: ${KEYSPACE}...`);
    async.map(indexes, (cql, cb) => {
      client.execute(cql, (err) => {
        if (err && (err.code === 9216 || err.code === 8704)) { // Already exists
          return cb();
        }
        return cb(err);
      });
    }, next);
  };

   /* istanbul ignore next */
  const initialiseSchemaVersion = (version, next) => {
    client.execute(q(KEYSPACE, 'insertSchemaVersion'), [cassandra.types.Integer.fromInt(version), new Date(), 'Initial version'], () =>
      // Ignore error - as it may be that the schema_version table does not yet exist
      next()
    );
  };

  const waitForIndexes = (next) => {
    let checkCount = 0;
    const checkLimit = 10;
    const checkIndexes = () => {
      checkCount++;
      if (checkCount > checkLimit) {
        return next(new Error(`Unable to validate indexes in cassandra after ${checkLimit} attempts!`));
      }
      client.execute(q(KEYSPACE, 'retrieveIndexes'), [KEYSPACE], (err, results) => {
        if (err) {
          return next(err);
        }
        const indexItems = _.compact(_.map(results, i => `${i.columnfamily_name}.${i.column_name}`));
        const difference = _.difference(indexItems, indexList);
        if (difference.length === 0) {
          return next();
        }
        setTimeout(checkIndexes, 200);
      });
    };

    checkIndexes();
  };

  return {
    dropKeyspace,
    createKeyspace,
    createTables,
    createSecondaryIndexes,
    initialiseSchemaVersion,
    truncate,
    flushCache,
    waitForIndexes,
  };
};
