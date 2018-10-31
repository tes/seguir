/**
 * Acceptance test the Cassandra API directly.
 */

/* eslint-env node, mocha */

const keyspace = 'test_seguir_migrations';
const apiInit = require('../../../api');
const _ = require('lodash');
const expect = require('expect.js');
const path = require('path');
const databases = process.env.DATABASE ? [process.env.DATABASE] : ['cassandra'];

databases.forEach((db) => {
  const config = _.clone(require(`../../fixtures/${db}.json`));
  config.keyspace = keyspace;

  describe(`Seguir Database Migrations - ${db}`, function () {
    this.timeout(10000);
    this.slow(5000);

    let api;
    let auth;

    before((done) => {
      this.timeout(20000);
      apiInit(config, (err, seguirApi) => {
        expect(err).to.be(null);
        api = seguirApi;
        // Fix migration path to fixtures
        api.client.migrations = path.resolve(__dirname, '..', '..', 'fixtures', 'migrations');
        auth = api.auth;
        api.client.setup.setupSeguir(api.client, keyspace, () => {
          auth.addAccount('migration account', false, false, (err, account) => {
            expect(err).to.be(null);
            auth.addApplication(account.account, 'migration a', (err) => {
              expect(err).to.be(null);
              done();
            });
          });
        });
      });
    });

    it('can retrieve current version, and previous versions for core database schema', (done) => {
      api.migrations.getSchemaVersions((err, versions) => {
        expect(err).to.be(null);
        // Cassandra stores integers as a type Integer that needs to be converted
        expect(versions[0].version.toString()).to.be('1');
        done();
      });
    });

    it('can figure out which migrations need to be applied based on schema version', (done) => {
      api.migrations.getMigrationsToApply((err, migrations) => {
        expect(err).to.be(null);
        expect(migrations[0].type).to.be('seguir');
        expect(migrations[0].version.toString()).to.be('1000');
        expect(migrations[1].type).to.be('tenant');
        expect(migrations[1].version.toString()).to.be('1002');
        expect(migrations[2].type).to.be('tenant');
        expect(migrations[2].version.toString()).to.be('1003');
        expect(migrations[3].type).to.be('tenant');
        expect(migrations[3].version.toString()).to.be('1004');
        done();
      });
    });

    it('can apply migrations, stopping at any failure and not continuing', (done) => {
      api.migrations.getMigrationsToApply((err, migrations) => {
        expect(err).to.be(null);
        api.migrations.applyMigrations(migrations, (err) => {
          expect(err.message).to.be('example error');
          done();
        });
      });
    });

    it('can see those migrations left that are after the failed migration', (done) => {
      api.migrations.getMigrationsToApply((err, migrations) => {
        expect(err).to.be(null);
        expect(migrations[0].type).to.be('tenant');
        expect(migrations[0].version.toString()).to.be('1003');
        expect(migrations[1].type).to.be('tenant');
        expect(migrations[1].version.toString()).to.be('1004');
        done();
      });
    });
  });
});
