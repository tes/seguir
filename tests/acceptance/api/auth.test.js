/**
 * Acceptance test of the authentication API
 */

/*eslint-env node, mocha */

var expect = require('expect.js');
var Api = require('../../../api');
var authUtils = require('../../../api/auth/utils');
var _ = require('lodash');
var databases = process.env.DATABASE ? [process.env.DATABASE] : ['postgres', 'cassandra', 'cassandra-redis'];
var keyspace = 'test_seguir_auth';

databases.forEach(function (db) {

  var config = _.clone(require('../../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe('API [Account and Application] - ' + db, function () {

    var api, auth, accountId, userId, appId, tokenId;

    this.timeout(10000);
    this.slow(5000);

    before(function (done) {
      Api(config, function (err, seguirApi) {
        expect(err).to.be(null);
        api = seguirApi;
        auth = api.auth;
        api.client.setup.setupSeguir(api.client, config.keyspace, done);
      });
    });

    describe('Accounts', function () {

      it('can create accounts', function (done) {
        auth.addAccount('test', false, true, function (err, account) {
          expect(err).to.be(null);
          expect(account.name).to.be('test');
          expect(account.isadmin).to.be(false);
          expect(account.enabled).to.be(true);
          accountId = account.account;
          done();
        });
      });

      it('can retrieve accounts', function (done) {
        auth.getAccounts(function (err, accounts) {
          expect(err).to.be(null);
          expect(accounts[0].account).to.eql(accountId);
          done();
        });
      });

      it('can disable accounts', function (done) {
        auth.updateAccount(accountId, 'bob', true, false, function (err, account) {
          expect(err).to.be(null);
          auth.getAccount(accountId, function (err, account) {
            expect(err).to.be(null);
            expect(account.name).to.be('bob');
            expect(account.isadmin).to.be(true);
            expect(account.enabled).to.be(false);
            done();
          });
        });
      });

    });

    describe('Account Users', function () {

      it('can create account users', function (done) {
        auth.addAccountUser(accountId, 'test', 'password', false, function (err, user) {
          expect(err).to.be(null);
          expect(user.username).to.be('test');
          expect(user.enabled).to.be(false);
          done();
        });
      });

      it('can list account users', function (done) {
        auth.getAccountUsers(accountId, function (err, users) {
          expect(err).to.be(null);
          expect(users[0].username).to.be('test');
          done();
        });
      });

      it('can update account users', function (done) {
        auth.updateAccountUser(accountId, 'test', 'newpassword', true, function (err, user) {
          expect(err).to.be(null);
          expect(user.enabled).to.be(true);
          done();
        });
      });

      it('can get account user by name only', function (done) {
        auth.getAccountUserByName('test', function (err, user) {
          expect(err).to.be(null);
          expect(user.username).to.be('test');
          done();
        });
      });

      it('cant login a user with an invalid password', function (done) {
        auth.loginUser('test', 'password', function (err, login) {
          expect(err).to.be(null);
          expect(login).to.be(false);
          done();
        });
      });

      it('cant login a user who is not enabled', function (done) {
        auth.addAccountUser(accountId, 'test2', 'password', false, function (err, user) {
          expect(err).to.be(null);
          auth.loginUser('test2', 'password', function (err, login) {
            expect(err).to.be(null);
            expect(login).to.be(false);
            done();
          });
        });
      });

      it('can login a user who is enabled with a valid password', function (done) {
        auth.loginUser('test', 'newpassword', function (err, login) {
          expect(err).to.be(null);
          expect(login).to.be(true);
          done();
        });
      });

    });

    describe('Account Applications', function () {

      it('can create account applications', function (done) {
        auth.addApplication(accountId, 'Fancy Application', null, function (err, application) {
          expect(err).to.be(null);
          expect(application.name).to.be('Fancy Application');
          expect(application.appkeyspace).to.be('fancy_application');
          expect(application.appid).to.not.be(undefined);
          appId = application.appid;
          done();
        });
      });

      it('can list account applications', function (done) {
        auth.getApplications(accountId, function (err, applications) {
          expect(err).to.be(null);
          expect(applications[0].appid).to.eql(appId);
          done();
        });
      });

      it('can update an application', function (done) {
        auth.updateApplication(appId, 'new name', false, function (err, application) {
          expect(err).to.be(null);
          expect(application.name).to.be('new name');
          done();
        });
      });

      it('can add an additional application token', function (done) {
        auth.addApplicationToken(appId, 'test-seguir', 'test-token', function (err, token) {
          expect(err).to.be(null);
          tokenId = token.tokenid;
          expect(token.appid).to.equal(appId);
          expect(token.enabled).to.equal(true);
          done();
        });
      });

      it('can update application tokens', function (done) {
        auth.updateApplicationToken(tokenId, false, 'changed name', function (err, token) {
          expect(err).to.be(null);
          expect(token.enabled).to.equal(false);
          expect(token.description).to.equal('changed name');
          done();
        });
      });

      it('can retrieve application tokens', function (done) {
        auth.getApplicationTokens(appId, function (err, tokens) {
          expect(err).to.be(null);
          expect(tokens[0].enabled).to.equal(false);
          expect(tokens[0].description).to.equal('changed name');
          done();
        });
      });

    });

    describe('Server access checks', function () {

      var application, token;

      before(function (done) {
        auth.addApplication(accountId, 'another application', function (err, anotherApplication) {
          expect(err).to.be(null);
          application = anotherApplication;
          auth.addApplicationToken(application.appid, application.appkeyspace, 'token', function (err, anotherToken) {
            expect(err).to.be(null);
            token = anotherToken;
            done();
          });
        });
      });

      it('can check if a provided app token id is valid', function (done) {
        auth.checkApplicationToken(token.tokenid, function (err, checkedToken) {
          expect(err).to.be(null);
          expect(token.tokenid).to.eql(checkedToken.tokenid);
          done();
        });
      });

      it('can check if a provided user id is valid', function (done) {
        api.user.addUser(config.keyspace + '_' + application.appkeyspace, 'cliftonc1', '1', {}, function (err, user) {
          expect(err).to.be(null);
          userId = user.user;
          auth.checkUser(config.keyspace + '_' + application.appkeyspace, user.user, function (err, checkedUser) {
            expect(err).to.be(null);
            expect(checkedUser.user).to.eql(user.user);
            done();
          });
        });
      });

      it('can check if a provided user id is valid - if passed an altid instead of a uuid', function (done) {
        api.user.addUser(config.keyspace + '_' + application.appkeyspace, 'cliftonc2', '2', {}, function (err, user) {
          expect(err).to.be(null);
          auth.checkUser(config.keyspace + '_' + application.appkeyspace, '2', function (err, checkedUser) {
            expect(err).to.be(null);
            expect(checkedUser.user).to.eql(user.user);
            done();
          });
        });
      });

      it('can check if a provided user id is valid - if passed a username instead of a uuid', function (done) {
        api.user.addUser(config.keyspace + '_' + application.appkeyspace, 'cliftonc3', '3', {}, function (err, user) {
          expect(err).to.be(null);
          auth.checkUser(config.keyspace + '_' + application.appkeyspace, 'cliftonc3', function (err, checkedUser) {
            expect(err).to.be(null);
            expect(checkedUser.user).to.eql(user.user);
            done();
          });
        });
      });

      it('can coerce a display name to a uuid', function (done) {
        api.user.addUser(config.keyspace + '_' + application.appkeyspace, 'cliftonc4', '4', {}, function (err, user) {
          expect(err).to.be(null);
          auth.coerceUserToUuid(config.keyspace + '_' + application.appkeyspace, 'cliftonc4', function (err, id) {
            expect(err).to.be(null);
            expect(id).to.eql(user.user);
            done();
          });
        });
      });

      it('can coerce an altid name to a uuid', function (done) {
        api.user.addUser(config.keyspace + '_' + application.appkeyspace, 'cliftonc5', '5', {}, function (err, user) {
          expect(err).to.be(null);
          auth.coerceUserToUuid(config.keyspace + '_' + application.appkeyspace, '5', function (err, id) {
            expect(err).to.be(null);
            expect(id).to.eql(user.user);
            done();
          });
        });
      });

      it('can coerce a uuid to a uuid', function (done) {
        api.user.addUser(config.keyspace + '_' + application.appkeyspace, 'cliftonc6', '6', {}, function (err, user) {
          expect(err).to.be(null);
          auth.coerceUserToUuid(config.keyspace + '_' + application.appkeyspace, user.user, function (err, id) {
            expect(err).to.be(null);
            expect(id).to.eql(user.user);
            done();
          });
        });
      });

      it('can coerce a string uuid to a uuid', function (done) {
        api.user.addUser(config.keyspace + '_' + application.appkeyspace, 'cliftonc7', '7', {}, function (err, user) {
          expect(err).to.be(null);
          auth.coerceUserToUuid(config.keyspace + '_' + application.appkeyspace, user.user.toString(), function (err, id) {
            expect(err).to.be(null);
            expect(id).to.eql(user.user);
            done();
          });
        });
      });

      it('can coerce an array of altids to uuids', function (done) {
        api.user.addUser(config.keyspace + '_' + application.appkeyspace, 'cliftonc8', '8', {}, function (err, user) {
          expect(err).to.be(null);
          auth.coerceUserToUuid(config.keyspace + '_' + application.appkeyspace, ['8'], function (err, ids) {
            expect(err).to.be(null);
            expect(ids[0]).to.eql(user.user);
            done();
          });
        });
      });

      it('can check if a request has been signed by a valid client', function (done) {
        var request = {
          headers: _.assign(authUtils.generateAuthorization(token.tokenid, token.tokensecret), {'x-seguir-user-token': userId})
        };
        var response = {
          send: function (response) {
            // Not expected to be called
          }
        };
        auth.checkRequest(request, response, function (err) {
          expect(err).to.be(null);
          expect(request.keyspace).to.be('test_seguir_auth_another_application');
          expect(request.liu.user).to.eql(userId);
          done();
        });
      });

      it('can work with anonymous users', function (done) {
        var request = {
          headers: authUtils.generateAuthorization(token.tokenid, token.tokensecret)
        };
        var response = {
          send: function (response) {
            // Not expected to be called
          }
        };
        auth.checkRequest(request, response, function (err) {
          expect(err).to.be(null);
          expect(request.keyspace).to.be('test_seguir_auth_another_application');
          expect(request.liu.user).to.be(null);
          done();
        });
      });

      it('can fail requests with an invalid secret', function (done) {
        var request = {
          headers: authUtils.generateAuthorization(token.tokenid, 'MY INVALID SECRET')
        };
        var response = {
          send: function (response) {
          }
        };
        auth.checkRequest(request, response, function (err) {
          // Not called
          expect(err.message).to.be('You must provide an valid Authorization header to access seguir the seguir API.');
          done();
        });
      });

    });

  });

});
