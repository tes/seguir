/**
 * Acceptance test the Cassandra API directly.
 */
'use strict';
var keyspace = 'test_seguir_auth';
var expect = require('expect.js');
var client = require('../../api/db/client')();
var messaging = {enabled: false};
var api = require('../../index')(client, messaging, keyspace);
var setupSeguir = require('../../setup/setupSeguir');
var async = require('async');
var _ = require('lodash');

describe('Account and Application Management', function() {

  var auth = api.auth, manage = api.manage, accountId, userId, appId, appSecret;

  this.timeout(10000);

  before(function(done) {
    setupSeguir(client, keyspace, done);
  });

  describe('Accounts', function () {

    it('can create accounts', function(done) {
      auth.addAccount('test', false, true, function(err, account) {
        expect(err).to.be(null);
        expect(account.name).to.be('test');
        expect(account.isadmin).to.be(false);
        expect(account.enabled).to.be(true);
        accountId = account.account;
        done();
      });
    });

    it('can retrieve accounts', function(done) {
      auth.getAccounts(function(err, accounts) {
        expect(err).to.be(null);
        expect(accounts[0].account).to.be(accountId);
        done();
      });
    });

    it('can disable accounts', function(done) {
      auth.updateAccount(accountId, 'bob', true, false, function(err, account) {
        expect(err).to.be(null);
        auth.getAccount(accountId, function(err, account) {
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

    it('can create account users', function(done) {
      auth.addAccountUser(accountId, 'test', 'password', false, function(err, user) {
        expect(err).to.be(null);
        expect(user.username).to.be('test');
        expect(user.enabled).to.be(false);
        done();
      });
    });

    it('can list account users', function(done) {
      auth.getAccountUsers(accountId, function(err, users) {
        expect(err).to.be(null);
        expect(users[0].username).to.be('test');
        done();
      });
    });

    it('can update account users', function(done) {
      auth.updateAccountUser(accountId, 'test', 'newpassword', true, function(err, user) {
        expect(err).to.be(null);
        expect(user.enabled).to.be(true);
        done();
      });
    });

    it('can get account user by name only', function(done) {
      auth.getAccountUserByName('test', function(err, user) {
        expect(err).to.be(null);
        expect(user.username).to.be('test');
        done();
      });
    });

    it('cant login a user with an invalid password', function(done) {
      auth.loginUser('test', 'password', function(err, login) {
        expect(err).to.be(null);
        expect(login).to.be(false);
        done();
      });
    });

    it('cant login a user who is not enabled', function(done) {
      auth.addAccountUser(accountId, 'test2', 'password', false, function(err, user) {
        auth.loginUser('test2', 'password', function(err, login) {
          expect(err).to.be(null);
          expect(login).to.be(false);
          done();
        });
      });
    });

    it('can login a user who is enabled with a valid password', function(done) {
      auth.loginUser('test', 'newpassword', function(err, login) {
        expect(err).to.be(null);
        expect(login).to.be(true);
        done();
      });
    });

  });

  describe('Account Applications', function () {

    it('can create account applications', function(done) {
      auth.addApplication(accountId, 'Fancy Application', null, null, function(err, application) {
        expect(err).to.be(null);
        expect(application.name).to.be('Fancy Application');
        expect(application.appkeyspace).to.be('fancy_application');
        expect(application.appsecret).to.not.be(undefined);
        expect(application.appid).to.not.be(undefined);
        appId = application.appid;
        done();
      });
    });

    it('can list account applications', function(done) {
      auth.getApplications(accountId, function(err, applications) {
        expect(err).to.be(null);
        expect(applications[0].appid).to.be(appId);
        done();
      });
    });

    it('can update an application', function(done) {
      auth.updateApplication(appId, 'new name', false, function(err, application) {
        expect(err).to.be(null);
        expect(application.name).to.be('new name');
        done();
      });
    });

    it('can reset an application secret', function(done) {
      auth.updateApplicationSecret(appId, function(err, application) {
        expect(err).to.be(null);
        expect(application.appsecret).to.not.be(undefined);
        done();
      });
    });

  });

  describe('Server access checks', function () {

    it('can check if a provided app id is valid and fail if not enabled', function(done) {
      auth.checkApplication(appId, function(err, checkedApplication) {
        expect(err).to.be(null);
        expect(checkedApplication).to.be(null);
        done();
      });
    });

    it('can check if a provided app id is valid', function(done) {
      auth.addApplication(accountId, 'another application', null, null, function(err, application) {
        auth.checkApplication(application.appid, function(err, checkedApplication) {
          expect(err).to.be(null);
          expect(application.appid).to.be(checkedApplication.appid);
          done();
        });
      });
    });

    it('can check if a provided user id is valid', function(done) {
      auth.addApplication(accountId, 'yet another application', null, null, function(err, application) {
        appId = application.appid;
        appSecret = application.appsecret;
        manage.addUser(keyspace + '_' + application.appkeyspace, 'cliftonc', '1', {}, function(err, user) {
            userId = user.user;
            auth.checkUser(keyspace + '_' + application.appkeyspace, user.user, function(err, checkedUser) {
              expect(err).to.be(null);
              expect(checkedUser.user).to.be(user.user);
              done();
            });
          });
      });
    });

    it('can check if a provided user id is valid - if passed an altid instead of a uuid', function(done) {
      auth.addApplication(accountId, 'yet another application', null, null, function(err, application) {
        appId = application.appid;
        appSecret = application.appsecret;
        manage.addUser(keyspace + '_' + application.appkeyspace, 'cliftonc', '1', {}, function(err, user) {
            userId = user.user;
            auth.checkUser(keyspace + '_' + application.appkeyspace, '1', function(err, checkedUser) {
              expect(err).to.be(null);
              expect(checkedUser.user).to.be(user.user);
              done();
            });
          });
      });
    });

    it('can check if a provided user id is valid - if passed a username instead of a uuid', function(done) {
      auth.addApplication(accountId, 'yet another application', null, null, function(err, application) {
        appId = application.appid;
        appSecret = application.appsecret;
        manage.addUser(keyspace + '_' + application.appkeyspace, 'cliftonc', '1', {}, function(err, user) {
            userId = user.user;
            auth.checkUser(keyspace + '_' + application.appkeyspace, 'cliftonc', function(err, checkedUser) {
              expect(err).to.be(null);
              expect(checkedUser.user).to.be(user.user);
              done();
            });
          });
      });
    });

    it('can check if a request has been signed by a valid client', function(done) {
      var authUtils = require('../../api/auth/utils');
      var request = {
        headers: _.assign(authUtils.generateAuthorization(appId, appSecret), {'x-seguir-user-token': userId})
      }
      var response = {
        send: function(response) {
          // Not expected to be called
        }
      }
      auth.checkRequest(request, response, function(err) {
        expect(request.keyspace).to.be('test_seguir_auth_yet_another_application');
        expect(request.liu.user).to.be(userId);
        done();
      });
    });

    it('can work with anonymous users', function(done) {
      var authUtils = require('../../api/auth/utils');
      var request = {
        headers: authUtils.generateAuthorization(appId, appSecret)
      }
      var response = {
        send: function(response) {
          // Not expected to be called
        }
      }
      auth.checkRequest(request, response, function(err) {
        expect(request.keyspace).to.be('test_seguir_auth_yet_another_application');
        expect(request.liu.user).to.be('_anonymous_');
        done();
      });
    });

    it('can fail requests with an invalid secret', function(done) {
      var authUtils = require('../../api/auth/utils');
      var request = {
        headers: authUtils.generateAuthorization(appId, 'MY INVALID SECRET')
      }
      var response = {
        send: function(response) {
          expect(response.message).to.be('You must provide an valid Authorization header to access seguir the seguir API.');
          done();
        }
      }
      auth.checkRequest(request, response, function(err) {
        // Not called
      });
    });

  });

});
