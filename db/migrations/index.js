/**
 * Common helpers for migrations
 */
const fs = require('fs');
const path = require('path');
const async = require('async');
const _ = require('lodash');

module.exports = api => {
  const client = api.client;
  const q = client.queries;

  const toApply = (schemaVersions, migrations) => {
    const minimumSchemaVersion = schemaVersions.length ? _.min(schemaVersions) : -1;
    const migrationVersions = _.filter(_.map(migrations, 'version'), version => {
      if (version >= minimumSchemaVersion) return true;
    });
    const toApplyVersions = _.difference(migrationVersions, schemaVersions);
    return _.filter(migrations, item => _.includes(toApplyVersions, item.version));
  };

  const getMigrationsToApply = (next) => {
    async.series([
      async.apply(getMigrationsToApplyToKeyspace, api.config.keyspace, 'seguir'),
      async.apply(getApplicationMigrationsToApply, api.config.keyspace),
    ], (err, results) => {
      if (err) return next(err);
      const migrations = _.union(results[0], results[1]);
      next(null, migrations);
    });
  };

  const getApplications = (keyspace, next) => {
    const applicationKeyspaces = [];
    api.auth.getAccounts((err, accounts) => {
      if (err) return next(err);
      async.map(accounts, (account, cb) => {
        api.auth.getApplications(account.account, (err, applications) => {
          if (err) return cb(err);
          applications.forEach(app => {
            applicationKeyspaces.push(api.config.keyspace + '_' + app.appkeyspace);
          });
          cb(null);
        });
      }, err => {
        next(err, applicationKeyspaces);
      });
    });
  };

  const getApplicationMigrationsToApply = (keyspace, next) => {
    let keyspaceMigrations = [];
    getApplications(keyspace, (err, applicationKeyspaces) => {
      if (err) return next(err);
      async.map(applicationKeyspaces, (appkeyspace, cb) => {
        getMigrationsToApplyToKeyspace(appkeyspace, 'tenant', (err, migrations) => {
          if (err) return cb(err);
          keyspaceMigrations = _.union(keyspaceMigrations, migrations);
          cb();
        });
      }, err => {
        next(err, keyspaceMigrations);
      });
    });
  };

  const getMigrationsToApplyToKeyspace = (keyspace, type, next) => {
    async.series([
      async.apply(selectSchemaVersions, keyspace),
      async.apply(getMigrations, keyspace, type),
    ], (err, results) => {
      if (err) return next(err);
      // Have to convert the schema version to an integer from cassandra Integer type
      const schemaVersions = _.map(_.map(results[0], 'version'), v => +v.toString());
      const migrations = results[1];
      next(null, toApply(schemaVersions, migrations));
    });
  };

  const getMigrations = (keyspace, type, next) => {
    const migrationsPath = path.resolve(api.client.migrations, type);
    const migrations = [];
    fs.readdir(migrationsPath, (err, files) => {
      if (err) return next(err);
      files.forEach(f => {
        const split_f = f.split('_');
        if (split_f.length === 2 && path.extname(f) === '.js') {
          const version = split_f[0];
          const description = split_f[1].split('.')[0];

          migrations.push({
            file: path.resolve(migrationsPath, f),
            type,
            keyspace,
            version: +version,
            description,
          });
        }
      });
      next(null, migrations.sort((thisMigration, thatMigration) => thisMigration.version - thatMigration.version));
    });
  };

  const applyMigration = (migration, next) => {
    let migrationFn;
    try {
      migrationFn = require(migration.file);
    } catch (ex) {
      return next(ex);
    }
    console.log('Applying migration: ' + migration.type + ' / ' + migration.file);
    migrationFn.apply(migration.keyspace, api, err => {
      if (err) {
        console.error('Database migration: ' + migration.version + ' - ' + migration.description + ' FAILED: ' + err.message);
        migrationFn.rollback(migration.keyspace, api, rollbackErr => {
          if (rollbackErr) return next(rollbackErr);
          next(err);
        });
      } else {
        api.migrations.insertSchemaVersion(migration.keyspace, migration.version, migration.description, next);
      }
    });
  };

  const applyMigrations = (migrations, next) => {
    async.mapSeries(migrations, (migration, cb) => {
      applyMigration(migration, cb);
    }, next);
  };

  const getSchemaVersions = (next) => {
    selectSchemaVersions(api.config.keyspace, next);
  };

  const selectSchemaVersions = (keyspace, next) => {
    client.execute(q(keyspace, 'selectSchemaVersions'), [], {}, (err, result) => {
      if (err) {
        // If we get an error here - we will assume it is because we haven't yet created the 0 migration
        // So we will return no migrations, so the zero migration applies
        return next(null, []);
      }
      next(null, result);
    });
  };

  const insertSchemaVersion = (keyspace, version, description, next) => {
    client.execute(q(keyspace, 'insertSchemaVersion'), [version, client.getTimestamp(), description], {}, (err, result) => {
      if (err) { return next(err); }
      next(null, result);
    });
  };

  return {
    insertSchemaVersion,
    getSchemaVersions,
    getMigrations,
    getMigrationsToApply,
    applyMigrations,
    getMigrationsToApplyToKeyspace,
  };
};
