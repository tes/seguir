/**
 * Acceptance test of the authentication API
 */
/* eslint-env node, mocha */

const expect = require('expect.js');
const apiInit = require('../../../api');
const authUtils = require('../../../api/auth/utils');
const _ = require('lodash');
const databases = process.env.DATABASE ? [process.env.DATABASE] : ['cassandra-redis'];
const keyspace = 'test_seguir_auth';

databases.forEach((db) => {
  const config = _.clone(require(`../../fixtures/${db}.json`)); // eslint-disable-line global-require
  config.keyspace = keyspace;

  describe(`API [Account and Application] - ${db}`, function () {
    let api;
    let auth;
    let accountId;
    let userId;
    let appId;
    let tokenId;

    this.timeout(20000);
    this.slow(5000);

    before((done) => {
      apiInit(config, (err, seguirApi) => {
        expect(err).to.be(null);
        api = seguirApi;
        auth = api.auth;
        api.client.setup.setupSeguir(api.client, config.keyspace, done);
      });
    });

    describe('Accounts', () => {
      it('can create accounts', (done) => {
        auth.addAccount('test', false, true, (err, account) => {
          expect(err).to.be(null);
          expect(account.name).to.be('test');
          expect(account.isadmin).to.be(false);
          expect(account.enabled).to.be(true);
          accountId = account.account;
          done();
        });
      });

      it('can retrieve accounts', (done) => {
        auth.getAccounts((err, accounts) => {
          expect(err).to.be(null);
          expect(accounts[0].account).to.eql(accountId);
          done();
        });
      });

      it('can disable accounts', (done) => {
        auth.updateAccount(accountId, 'bob', true, false, (err) => {
          expect(err).to.be(null);
          auth.getAccount(accountId, (err, account) => {
            expect(err).to.be(null);
            expect(account.name).to.be('bob');
            expect(account.isadmin).to.be(true);
            expect(account.enabled).to.be(false);
            done();
          });
        });
      });
    });

    describe('Account Users', () => {
      it('can create account users', (done) => {
        auth.addAccountUser(accountId, 'test', 'password', false, (err, user) => {
          expect(err).to.be(null);
          expect(user.username).to.be('test');
          expect(user.enabled).to.be(false);
          done();
        });
      });

      it('can list account users', (done) => {
        auth.getAccountUsers(accountId, (err, users) => {
          expect(err).to.be(null);
          expect(users[0].username).to.be('test');
          done();
        });
      });

      it('can update account users', (done) => {
        auth.updateAccountUser(accountId, 'test', 'newpassword', true, (err, user) => {
          expect(err).to.be(null);
          expect(user.enabled).to.be(true);
          done();
        });
      });

      it('can get account user by name only', (done) => {
        auth.getAccountUserByName('test', (err, user) => {
          expect(err).to.be(null);
          expect(user.username).to.be('test');
          done();
        });
      });

      it('cant login a user with an invalid password', (done) => {
        auth.loginUser('test', 'password', (err, login) => {
          expect(err).to.be(null);
          expect(login).to.be(false);
          done();
        });
      });

      it('cant login a user who is not enabled', (done) => {
        auth.addAccountUser(accountId, 'test2', 'password', false, (err) => {
          expect(err).to.be(null);
          auth.loginUser('test2', 'password', (err, login) => {
            expect(err).to.be(null);
            expect(login).to.be(false);
            done();
          });
        });
      });

      it('can login a user who is enabled with a valid password', (done) => {
        auth.loginUser('test', 'newpassword', (err, login) => {
          expect(err).to.be(null);
          expect(login).to.be(true);
          done();
        });
      });
    });

    describe('Account Applications', () => {
      it('can create account applications', (done) => {
        auth.addApplication(accountId, 'Fancy Application', null, (err, application) => {
          expect(err).to.be(null);
          expect(application.name).to.be('Fancy Application');
          expect(application.appkeyspace).to.be('fancy_application');
          expect(application.appid).to.not.be(undefined);
          appId = application.appid;
          done();
        });
      });

      it('can list account applications', (done) => {
        auth.getApplications(accountId, (err, applications) => {
          expect(err).to.be(null);
          expect(applications[0].appid).to.eql(appId);
          done();
        });
      });

      it('can update an application', (done) => {
        auth.updateApplication(appId, 'new name', false, (err, application) => {
          expect(err).to.be(null);
          expect(application.name).to.be('new name');
          done();
        });
      });

      it('can add an additional application token', (done) => {
        auth.addApplicationToken(appId, 'test-seguir', 'test-token', (err, token) => {
          expect(err).to.be(null);
          tokenId = token.tokenid;
          expect(token.appid).to.equal(appId);
          expect(token.enabled).to.equal(true);
          done();
        });
      });

      it('can update application tokens', (done) => {
        auth.updateApplicationToken(tokenId, false, 'changed name', (err, token) => {
          expect(err).to.be(null);
          expect(token.enabled).to.equal(false);
          expect(token.description).to.equal('changed name');
          done();
        });
      });

      it('can retrieve application tokens', (done) => {
        auth.getApplicationTokens(appId, (err, tokens) => {
          expect(err).to.be(null);
          expect(tokens[0].enabled).to.equal(false);
          expect(tokens[0].description).to.equal('changed name');
          done();
        });
      });
    });

    describe('Server access checks', () => {
      let application;
      let token;

      before((done) => {
        auth.addApplication(accountId, 'another application', (err, anotherApplication) => {
          expect(err).to.be(null);
          application = anotherApplication;
          auth.addApplicationToken(application.appid, application.appkeyspace, 'token', (err, anotherToken) => {
            expect(err).to.be(null);
            token = anotherToken;
            done();
          });
        });
      });

      it('can check if a provided app token id is valid', (done) => {
        auth.checkApplicationToken(token.tokenid, (err, checkedToken) => {
          expect(err).to.be(null);
          expect(token.tokenid).to.eql(checkedToken.tokenid);
          done();
        });
      });

      it('can check if a provided user id is valid', (done) => {
        api.user.addUser(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc1', '1', {}, (err, user) => {
          expect(err).to.be(null);
          userId = user.user;
          auth.checkUser(`${config.keyspace}_${application.appkeyspace}`, user.user, (err, checkedUser) => {
            expect(err).to.be(null);
            expect(checkedUser.user).to.eql(user.user);
            done();
          });
        });
      });

      it('can check if a provided user id is valid - if passed an altid instead of a uuid', (done) => {
        api.user.addUser(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc2', '2', {}, (err, user) => {
          expect(err).to.be(null);
          auth.checkUser(`${config.keyspace}_${application.appkeyspace}`, '2', (err, checkedUser) => {
            expect(err).to.be(null);
            expect(checkedUser.user).to.eql(user.user);
            done();
          });
        });
      });

      it('can check if a provided user id is valid - if passed a username instead of a uuid', (done) => {
        api.user.addUser(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc3', '3', {}, (err, user) => {
          expect(err).to.be(null);
          auth.checkUser(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc3', (err, checkedUser) => {
            expect(err).to.be(null);
            expect(checkedUser.user).to.eql(user.user);
            done();
          });
        });
      });

      it('can coerce a display name to a uuid', (done) => {
        api.user.addUser(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc4', '4', {}, (err, user) => {
          expect(err).to.be(null);
          auth.coerceUserToUuid(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc4', (err, id) => {
            expect(err).to.be(null);
            expect(id).to.eql(user.user);
            done();
          });
        });
      });

      it('can coerce an altid name to a uuid', (done) => {
        api.user.addUser(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc5', '5', {}, (err, user) => {
          expect(err).to.be(null);
          auth.coerceUserToUuid(`${config.keyspace}_${application.appkeyspace}`, '5', (err, id) => {
            expect(err).to.be(null);
            expect(id).to.eql(user.user);
            done();
          });
        });
      });

      it('can coerce a uuid to a uuid', (done) => {
        api.user.addUser(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc6', '6', {}, (err, user) => {
          expect(err).to.be(null);
          auth.coerceUserToUuid(`${config.keyspace}_${application.appkeyspace}`, user.user, (err, id) => {
            expect(err).to.be(null);
            expect(id).to.eql(user.user);
            done();
          });
        });
      });

      it('can coerce a string uuid to a uuid', (done) => {
        api.user.addUser(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc7', '7', {}, (err, user) => {
          expect(err).to.be(null);
          auth.coerceUserToUuid(`${config.keyspace}_${application.appkeyspace}`, user.user.toString(), (err, id) => {
            expect(err).to.be(null);
            expect(id).to.eql(user.user);
            done();
          });
        });
      });

      it('can coerce an array of altids to uuids', (done) => {
        api.user.addUser(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc8', '8', {}, (err, user) => {
          expect(err).to.be(null);
          auth.coerceUserToUuid(`${config.keyspace}_${application.appkeyspace}`, ['8'], (err, ids) => {
            expect(err).to.be(null);
            expect(ids[0]).to.eql(user.user);
            done();
          });
        });
      });

      it('returns null when coercing an empty id', (done) => {
        auth.coerceUserToUuid(`${config.keyspace}_${application.appkeyspace}`, undefined, (err, id) => {
          expect(err).to.be(null);
          expect(id).to.eql(null);
          done();
        });
      });

      it('can coerce an array of altids to uuids, leaving gaps where empty ids were provided', (done) => {
        api.user.addUser(`${config.keyspace}_${application.appkeyspace}`, 'cliftonc9', '9', {}, (err, user) => {
          expect(err).to.be(null);
          auth.coerceUserToUuid(`${config.keyspace}_${application.appkeyspace}`, [undefined, '9'], (err, ids) => {
            expect(err).to.be(null);
            expect(ids[0]).to.eql(null);
            expect(ids[1]).to.eql(user.user);
            done();
          });
        });
      });

      it('can check if a request has been signed by a valid client', (done) => {
        const request = {
          headers: _.assign(authUtils.generateAuthorization(token.tokenid, token.tokensecret), { 'x-seguir-user-token': userId }),
        };
        const response = {
          send: () => {
            // Not expected to be called
          },
        };
        auth.checkRequest(request, response, (err) => {
          expect(err).to.be(null);
          expect(request.keyspace).to.be('test_seguir_auth_another_application');
          expect(request.liu.user).to.eql(userId);
          done();
        });
      });

      it('can work with anonymous users', (done) => {
        const request = {
          headers: authUtils.generateAuthorization(token.tokenid, token.tokensecret),
        };
        const response = {
          send: () => {
            // Not expected to be called
          },
        };
        auth.checkRequest(request, response, (err) => {
          expect(err).to.be(null);
          expect(request.keyspace).to.be('test_seguir_auth_another_application');
          expect(request.liu.user).to.be(null);
          done();
        });
      });

      it('can fail requests with an invalid secret', (done) => {
        const request = {
          headers: authUtils.generateAuthorization(token.tokenid, 'MY INVALID SECRET'),
        };
        const response = {
          send: () => {
          },
        };
        auth.checkRequest(request, response, (err) => {
          // Not called
          expect(err.message).to.be('You must provide an valid Authorization header to access seguir the seguir API.');
          done();
        });
      });
    });
  });
});
