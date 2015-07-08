/**
 * Common helpers for migrations
 */
var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('lodash');

module.exports = function (api) {

  var client = api.client,
      q = client.queries;

  function toApply (schemaVersions, migrations) {
    var minimumSchemaVersion = _.min(schemaVersions);
    var migrationVersions = _.filter(_.pluck(migrations, 'version'), function (version) { if (version >= minimumSchemaVersion) return true; });
    var toApplyVersions = _.difference(migrationVersions, schemaVersions);
    var migrationsToApply = _.filter(migrations, function (item) { return _.contains(toApplyVersions, item.version); });
    return migrationsToApply;
  }

  function getMigrationsToApply (next) {
    async.series([
      async.apply(getMigrationsToApplyToKeyspace, api.config.keyspace, 'seguir'),
      async.apply(getApplicationMigrationsToApply, api.config.keyspace)
    ], function (err, results) {
      if (err) return next(err);
      var migrations = _.union(results[0], results[1]);
      next(null, migrations);
    });
  }

  function getApplications (keyspace, next) {
    var applicationKeyspaces = [];
    api.auth.getAccounts(function (err, accounts) {
      if (err) return next(err);
      async.map(accounts, function (account, cb) {
        api.auth.getApplications(account.account, function (err, applications) {
          if (err) return cb(err);
          applications.forEach(function (app) {
            applicationKeyspaces.push(api.config.keyspace + '_' + app.appkeyspace);
          });
          cb(null);
        });
      }, function (err) {
        next(err, applicationKeyspaces);
      });
    });
  }

  function getApplicationMigrationsToApply (keyspace, next) {
    var keyspaceMigrations = [];
    getApplications(keyspace, function (err, applicationKeyspaces) {
      if (err) return next(err);
      async.map(applicationKeyspaces, function (appkeyspace, cb) {
        getMigrationsToApplyToKeyspace(appkeyspace, 'tenant', function (err, migrations) {
          if (err) return cb(err);
          keyspaceMigrations = _.union(keyspaceMigrations, migrations);
          cb();
        });
      }, function (err) {
        next(err, keyspaceMigrations);
      });
    });
  }

  function getMigrationsToApplyToKeyspace (keyspace, type, next) {
    async.series([
      async.apply(selectSchemaVersions, keyspace),
      async.apply(getMigrations, keyspace, type)
    ], function (err, results) {
      if (err) return next(err);
      console.dir(results);
      // Have to convert the schema version to an integer from cassandra Integer type
      var schemaVersions = _.map(_.pluck(results[0], 'version'), function (v) { return +v.toString(); });
      var migrations = results[1];
      next(null, toApply(schemaVersions, migrations));
    });
  }

  function getMigrations (keyspace, type, next) {

    var migrationsPath = path.resolve(api.client.migrations, type);
    var migrations = [];
    fs.readdir(migrationsPath, function (err, files) {
      if (err) return next(err);
      files.forEach(function (f) {

        var split_f = f.split('_');
        if (split_f.length === 2 && path.extname(f) === '.js') {

          var version = split_f[0],
              description = split_f[1].split('.')[0];

          migrations.push({
            file: path.resolve(migrationsPath, f),
            type: type,
            keyspace: keyspace,
            version: +version,
            description: description
          });

        }

      });

      next(null, migrations);
    });
  }

  function applyMigration (migration, next) {

    var migrationFn;
    try {
      migrationFn = require(migration.file);
    } catch(ex) {
      return next(ex);
    }
    console.log('Applying migration: ' + migration.type + ' / ' + migration.file);
    migrationFn.apply(migration.keyspace, api, function (err) {
      if (err) {
        console.error('Database migration: ' + migration.version + ' - ' + migration.description + ' FAILED: ' + err.message);
        migrationFn.rollback(migration.keyspace, api, function (rollbackErr) {
          if (rollbackErr) return next(rollbackErr);
          next(err);
        });
      } else {
        api.migrations.insertSchemaVersion(migration.keyspace, migration.version, migration.description, next);
      }
    });

  }

  function applyMigrations (migrations, next) {
    async.mapSeries(migrations, function (migration, cb) {
      applyMigration(migration, cb);
    }, next);
  }

  function getSchemaVersions (next) {
    selectSchemaVersions(api.config.keyspace, next);
  }

  function selectSchemaVersions (keyspace, next) {
    client.execute(q(keyspace, 'selectSchemaVersions'), [], {prepare: true}, function (err, result) {
      if (err) {
        // If we get an error here - we will assume it is because we haven't yet created the 0 migration
        // So we will return no migrations, so the zero migration applies
        return next(null, []);
      }
      next(null, result);
    });
  }

  function insertSchemaVersion (keyspace, version, description, next) {
    client.execute(q(keyspace, 'insertSchemaVersion'), [version, client.getTimestamp(), description], {prepare: true}, function (err, result) {
      if (err) { return next(err); }
      next(null, result);
    });
  }

  return {
    insertSchemaVersion: insertSchemaVersion,
    getSchemaVersions: getSchemaVersions,
    getMigrations: getMigrations,
    getMigrationsToApply: getMigrationsToApply,
    applyMigrations: applyMigrations
  };

};
