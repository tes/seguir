/**
 * Acceptance test the Cassandra API directly.
 */

/*eslint-env node, mocha */

var keyspace = 'test_seguir_migrations';
var Api = require('../../api');
var _ = require('lodash');
var expect = require('expect.js');
var databases = process.env.DATABASE ? [process.env.DATABASE] : ['postgres', 'cassandra'];

databases.forEach(function (db) {

  var config = _.clone(require('../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe('Seguir Database Migrations - ' + db, function () {

    this.timeout(10000);
    this.slow(5000);

    var api, auth;

    before(function (done) {
      this.timeout(20000);
      Api(config, function (err, seguirApi) {
        expect(err).to.be(null);
        api = seguirApi;
        auth = api.auth;
        api.client.setup.setupSeguir(api.client, keyspace, function () {
          auth.addAccount('migration account', false, false, function (err, account) {
            expect(err).to.be(null);
            auth.addApplication(account.account, 'migration application', null, null, function (err, application) {
              expect(err).to.be(null);
              done();
            });
          });
        });
      });
    });

    it('can retrieve current version, and previous versions for core database schema', function (done) {
      api.migrations.getSchemaVersions(keyspace, function (err, versions) {
        expect(err).to.be(null);
        // Cassandra stores integers as a type Integer that needs to be converted
        expect(versions[0].version.toString()).to.be('1');
        done();
      });
    });

    it('can retrieve current version, and previous versions for application database schema', function (done) {
      api.migrations.getSchemaVersions(keyspace + '_migration_application', function (err, versions) {
        expect(err).to.be(null);
        expect(versions[0].version.toString()).to.be('1');
        done();
      });
    });

  });

});
