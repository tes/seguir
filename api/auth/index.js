var cassandra = require('cassandra-driver');
var restify = require('restify');
var async = require('async');
var moment = require('moment');
var userHeader = 'x-seguir-user-token';
var authUtils = require('./utils');
var setupKeyspace = require('../../setup/setupKeyspace');
var anonyomousUser = {user: '_anonymous_', username: 'Not logged in.'}

function Auth(client, keyspace) {

  var q = require('../db/queries');
  var query = require('../query')(client);

  /**
   * Core account API
   */
  function addAccount(name, isadmin, enabled, next) {
    checkAccountDuplicate(name, function(err, checkAccount) {
      if(err) { return next(err); }
      if(checkAccount) { return next(new Error('An account with that name already exists!')) }

      var account = cassandra.types.uuid();
      var accountData = [account, name, isadmin, enabled];
      client.execute(q(keyspace, 'upsertAccount'), accountData, function(err, result) {
        if(err) { return next(err); }
        next(null, {account: account, name: name, isadmin: isadmin, enabled: enabled});
      });

    });
  }

  function getAccount(account, next) {
    client.execute(q(keyspace, 'selectAccount'), [account], function(err, result) {
      if(err) { return next(err); }
      next(null, result && result.rows ? result.rows[0] : null);
    });
  }

  function checkAccountDuplicate(name, next) {
    client.execute(q(keyspace, 'selectAccountByName'), [name], function(err, result) {
      if(err) { return next(err); }
      next(null, result && result.rows ? result.rows[0] : null);
    });
  }

  function getAccounts(next) {
    client.execute(q(keyspace, 'selectAccounts'), function(err, result) {
      if(err) { return next(err); }
      next(null, result ? result.rows : null);
    });
  }

  function updateAccount(account, name, isadmin, enabled, next) {
    var accountData = [name, isadmin, enabled, account];
    client.execute(q(keyspace, 'updateAccount'), accountData, function(err, result) {
      if(err) { return next(err); }
      next(null, {account: account, name: name, isadmin: isadmin, enabled: enabled});
    });
  }

  /**
   * Core account user API
   */
  function addAccountUser(account, username, password, enabled, next) {
    getAccountUserByName(username, function(err, checkUser) {
      if(err) { return next(err); }
      if(checkUser) { return next(new Error('An user with that username already exists.')) }
      authUtils.hashPassword(password, function(err, hash) {
        var userData = [account, username, hash, enabled];
        client.execute(q(keyspace, 'upsertAccountUser'), userData, function(err, result) {
          if(err) { return next(err); }
          next(null, {account: account, username: username, enabled: enabled});
        });
      });
    });
  }

  function getAccountUserByName(username, next) {
    client.execute(q(keyspace, 'selectAccountUserByName'), [username], function(err, result) {
      if(err) { return next(err); }
      next(null, result && result.rows ? result.rows[0] : null);
    });
  }

  function loginUser(username, password, next) {
    client.execute(q(keyspace, 'selectAccountUserByName'), [username], function(err, result) {
      if(err) { return next(err); }
      var user = result.rows ? result.rows[0] : null;
      if(!user) { return next(null, false); }
      if(!user.enabled) { return next(null, false); }
      authUtils.checkPassword(password, user.password, function(err, valid) {
        if(err) { return next(err); }
        next(null, valid);
      })
    });
  }

  function getAccountUsers(account, next) {
    client.execute(q(keyspace, 'selectAccountUsers'), [account], function(err, result) {
      if(err) { return next(err); }
      next(null, result ? result.rows : null);
    });
  }

  function updateAccountUser(account, username, password, enabled, next) {
    authUtils.hashPassword(password, function(err, hash) {
      var userData = [hash, enabled, account, username];
      client.execute(q(keyspace, 'updateAccountUser'), userData, function(err, result) {
        if(err) { return next(err); }
        next(null, {account: account, username: username, enabled: enabled});
      });
    });
  }

  /**
   *  Application API
   */
  function updateApplication(appid, name, enabled, next) {
    var application = [name, enabled, appid];
    client.execute(q(keyspace,'updateApplication'), application, function(err) {
      next(err, {name: name, appid: appid, enabled: enabled});
    });
  }

  function updateApplicationSecret(appid, next) {
    var appsecret = authUtils.generateSecret(cassandra.types.uuid());
    var application = [appsecret, appid];
    client.execute(q(keyspace,'updateApplicationSecret'), application, function(err) {
      next(err, {appid: appid, appsecret: appsecret});
    });
  }

  function addApplication(account, name, next) {
    var appid = cassandra.types.uuid();
    var appsecret = authUtils.generateSecret(cassandra.types.uuid());
    var appkeyspace = generateKeyspaceFromName(name);
    var enabled = true;
    var app = [account, name, appkeyspace, appid, appsecret, enabled];
    client.execute(q(keyspace, 'upsertApplication'), app, function(err, result) {
      if(err) { return next(err); }
      setupKeyspace(client, keyspace + '_' + appkeyspace, function(err) {
        if(err) { return next(err); }
        next(null, {account: account, name: name, appkeyspace: appkeyspace, appid: appid, appsecret: appsecret, enabled: enabled});
      });
    });
  }

  function getApplications(account, next) {
    client.execute(q(keyspace, 'selectApplications'), [account], function(err, result) {
      next(err, result ? result.rows : null);
    });
  }

  /**
   * Checks incoming headers for the application and logged in user tokens.
   */
  function checkRequest(req, res, next) {

    // Authorization: Seguir 44CF9590006BF252F707:jZNOcbfWmD/A/f3hSvVzXZjM2HU=

    var appAuthorization = req.headers.authorization,
        user = req.headers[userHeader];

    if(!appAuthorization) {
      return res.send(new Error('You must provide an valid Authorization header to access seguir the seguir API.'));
    }

    var appId = appAuthorization.split(":")[0].split(" ")[1];

    checkApplication(appId, function(err, application) {

      if(err) { return res.send(err); }
      if(!application) { return res.send(new Error('You must provide an valid Authorization header to access seguir the seguir API.')); }

      if(authUtils.validateAuthorization(req.headers, application.appid, application.appsecret)) {
        req.keyspace = keyspace + '_' + application.appkeyspace;
        checkUser(req.keyspace, user, function(err, user) {
          if(err) { return res.send(err); }
          req.liu = user;
          next();
        });
      } else {
        return res.send(new Error('You must provide an valid Authorization header to access seguir the seguir API.'));
      }

    });

  }

  function checkApplication(appid, next) {
    if(!appid) {
      return next(new restify.UnauthorizedError('You must provide an application name via the header "' + appIdHeader + '" to access seguir the seguir API.'));
    }
    var app = [appid];
    client.execute(q(keyspace,'checkApplication'), app, function(err, result) {
      var application = result && result.rows.length > 0 ? result.rows[0] : null;
      if(err) { return next(err); }
      if(!application || !application.enabled) { return next(null, null); }
      next(null, application);
    });
  }

  function checkUser(keyspace, user, next) {
    if(!user) {
      return next(null, anonyomousUser);
    }
    client.execute(q(keyspace, 'selectUser'), [user], function(err, result) {
      if(err) { return next(err); }
      if(!result || result.rows.length == 0) { return next(new restify.InvalidArgumentError('Specified user "' + user + '" in header "' + userHeader + '" does not exist.')); }
      next(null, result.rows[0]);
    });
  }

  return {
    addAccount: addAccount,
    getAccount: getAccount,
    getAccounts: getAccounts,
    updateAccount: updateAccount,
    addAccountUser: addAccountUser,
    getAccountUsers: getAccountUsers,
    getAccountUserByName: getAccountUserByName,
    loginUser: loginUser,
    updateAccountUser: updateAccountUser,
    addApplication: addApplication,
    getApplications: getApplications,
    updateApplication: updateApplication,
    updateApplicationSecret: updateApplicationSecret,
    checkRequest: checkRequest,
    checkApplication: checkApplication,
    checkUser: checkUser
  }

}

function generateKeyspaceFromName(str) {
    str = str.toLowerCase();
    str = str.replace(/[^a-z0-9]+/g, '_');
    str = str.replace(/^-|-$/g, '');
    return str;
}

Auth.headerNames = {
  userHeader: userHeader
};

module.exports = Auth;

