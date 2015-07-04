/**
 * Helpers for initialising acceptance tests
 */
var Api = require('../../api');
var startServer = require('../../server');
var Seguir = require('../../client');
var credentials = {host: 'http://localhost:3001'};

function setupApi (keyspace, config, next) {
  Api(config, function (err, api) {
    if (err) { return next(err); }
    console.log('Setting up keyspace in ' + api.client.type + '...');
    api.client.setup.setupTenant(api.client, keyspace, function (err) {
      if (err) { return next(err); }
      next(null, api);
    });
  });
}

function setupServer (config, keyspace, next) {
  Api(config, function (err, api) {
    if (err) { return next(err); }
    console.log('Setting up seguir in ' + api.client.type + '...');
    api.client.setup.setupSeguir(api.client, keyspace, function (err) {
      if (err) { return next(err); }
      api.auth.addAccount('test account', false, false, function (err, account) {
        if (err) { return next(err); }
        api.auth.addApplication(account.account, 'test application', null, null, function (err, application) {
          if (err) { return next(err); }
          startServer(config, function (err, server) {
            if (err) { return next(err); }
            server.listen(3001, function () {
              credentials.appid = application.appid;
              credentials.appsecret = application.appsecret;
              var client = new Seguir(credentials);
              process.stdout.write('.\n');
              next(null, api, server, client);
            });
          });
        });
      });
    });
  });
}

module.exports = {
  setupApi: setupApi,
  setupServer: setupServer
};
