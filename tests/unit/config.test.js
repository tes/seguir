/*eslint-env node, mocha */

var Config = require('../../server/config');
var expect = require('expect.js');

describe('Config', function () {

  describe('server configuration', function () {

    after(function () {
      process.env.SEGUIR_CONFIG = null;
    });

    it('defaults to the config in the seguir project', function (done) {
      var config = Config();
      expect(config.cassandra.contactPoints[0]).to.be('127.0.0.1');
      done();
    });

    it('can over ride default location with the environment variable', function (done) {
      process.env.SEGUIR_CONFIG = 'tests/fixtures/config.json';
      var config = Config();
      expect(config.cassandra.contactPoints[0]).to.be('0.0.0.0');
      done();
    });

    it('will use the default if you specify an invalid file', function (done) {
      process.env.SEGUIR_CONFIG = 'tests/fixtures/seguir-invalid.json';
      var config = Config();
      expect(config.cassandra.contactPoints[0]).to.be('127.0.0.1');
      done();
    });

  });

});
