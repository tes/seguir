var cassandra = require('cassandra-driver');
var restify = require('restify');
var async = require('async');
var userHeader = 'x-seguir-user-token';
var authUtils = require('./utils');
var setupKeyspace = require('../../setup/setupKeyspace');
var anonyomousUser = {user: '_anonymous_', username: 'Not logged in.'};
var Uuid = cassandra.types.Uuid;
var debug = require('debug')('seguir:auth');

function Auth (client, redis, keyspace, options) {

  var q = require('../db/queries');

  /**
   * Core account API
   */
  function addAccount (name, isadmin, enabled, next) {
    checkAccountDuplicate(name, function (err, checkAccount) {
      if (err) { return next(err); }
      if (checkAccount) { return next(new Error('An account with that name already exists!')); }

      var account = Uuid.random();
      var accountData = [account, name, isadmin, enabled];
      client.execute(q(keyspace, 'upsertAccount'), accountData, function (err, result) {
        if (err) { return next(err); }
        next(null, {account: account, name: name, isadmin: isadmin, enabled: enabled});
      });

    });
  }

  function getAccount (account, next) {
    client.execute(q(keyspace, 'selectAccount'), [account], function (err, result) {
      if (err) { return next(err); }
      next(null, result && result.rows ? result.rows[0] : null);
    });
  }

  function checkAccountDuplicate (name, next) {
    client.execute(q(keyspace, 'selectAccountByName'), [name], function (err, result) {
      if (err) { return next(err); }
      next(null, result && result.rows ? result.rows[0] : null);
    });
  }

  function getAccounts (next) {
    client.execute(q(keyspace, 'selectAccounts'), function (err, result) {
      if (err) { return next(err); }
      next(null, result ? result.rows : null);
    });
  }

  function updateAccount (account, name, isadmin, enabled, next) {
    var accountData = [name, isadmin, enabled, account];
    client.execute(q(keyspace, 'updateAccount'), accountData, function (err, result) {
      if (err) { return next(err); }
      next(null, {account: account, name: name, isadmin: isadmin, enabled: enabled});
    });
  }

  /**
   * Core account user API
   */
  function addAccountUser (account, username, password, enabled, next) {
    getAccountUserByName(username, function (err, checkUser) {
      if (err) { return next(err); }
      if (checkUser) { return next(new Error('An user with that username already exists.')); }
      authUtils.hashPassword(password, function (err, hash) {
        if (err) { return next(err); }
        var userData = [account, username, hash, enabled];
        client.execute(q(keyspace, 'upsertAccountUser'), userData, function (err, result) {
          if (err) { return next(err); }
          next(null, {account: account, username: username, enabled: enabled});
        });
      });
    });
  }

  function getAccountUserByName (username, next) {
    client.execute(q(keyspace, 'selectAccountUserByName'), [username], function (err, result) {
      if (err) { return next(err); }
      next(null, result && result.rows ? result.rows[0] : null);
    });
  }

  function loginUser (username, password, next) {
    client.execute(q(keyspace, 'selectAccountUserByName'), [username], function (err, result) {
      if (err) { return next(err); }
      var user = result.rows ? result.rows[0] : null;
      if (!user) { return next(null, false); }
      if (!user.enabled) { return next(null, false); }
      authUtils.checkPassword(password, user.password, function (err, valid) {
        if (err) { return next(err); }
        next(null, valid);
      });
    });
  }

  function getAccountUsers (account, next) {
    client.execute(q(keyspace, 'selectAccountUsers'), [account], function (err, result) {
      if (err) { return next(err); }
      next(null, result ? result.rows : null);
    });
  }

  function updateAccountUser (account, username, password, enabled, next) {
    authUtils.hashPassword(password, function (err, hash) {
      if (err) { return next(err); }
      var userData = [hash, enabled, account, username];
      client.execute(q(keyspace, 'updateAccountUser'), userData, function (err, result) {
        if (err) { return next(err); }
        next(null, {account: account, username: username, enabled: enabled});
      });
    });
  }

  /**
   *  Application API
   */
  function updateApplication (appid, name, enabled, next) {
    var application = [name, enabled, appid];
    client.execute(q(keyspace, 'updateApplication'), application, function (err) {
      next(err, {name: name, appid: appid, enabled: enabled});
    });
  }

  function updateApplicationSecret (appid, next) {
    var appsecret = authUtils.generateSecret(cassandra.types.uuid());
    var application = [appsecret, appid];
    client.execute(q(keyspace, 'updateApplicationSecret'), application, function (err) {
      next(err, {appid: appid, appsecret: appsecret});
    });
  }

  function addApplication (account, name, appid, appsecret, next) {
    appid = appid || Uuid.random();
    appsecret = appsecret || authUtils.generateSecret(cassandra.types.uuid());
    var appkeyspace = generateKeyspaceFromName(name);
    var enabled = true;
    var app = [account, name, appkeyspace, appid, appsecret, enabled];
    client.execute(q(keyspace, 'upsertApplication'), app, function (err, result) {
      if (err) { return next(err); }
      setupKeyspace(client, keyspace + '_' + appkeyspace, function (err) {
        if (err) { return next(err); }
        next(null, {account: account, name: name, appkeyspace: appkeyspace, appid: appid, appsecret: appsecret, enabled: enabled});
      });
    });
  }

  function getApplications (account, next) {
    client.execute(q(keyspace, 'selectApplications'), [account], function (err, result) {
      next(err, result ? result.rows : null);
    });
  }

  /**
   *  Application Token API
   */
  function addApplicationToken (appid, appkeyspace, tokenid, tokensecret, next) {
    tokenid = tokenid || Uuid.random();
    tokensecret = tokensecret || authUtils.generateSecret(cassandra.types.uuid());
    var enabled = true;
    var token = [appid, appkeyspace, tokenid, tokensecret, enabled];
    client.execute(q(keyspace, 'upsertApplicationToken'), token, function (err, result) {
      if (err) { return next(err); }
      next(null, {appid: appid, appkeyspace: appkeyspace, tokenid: tokenid, tokensecret: tokensecret, enabled: enabled});
    });
  }

  function updateApplicationToken (tokenid, enabled, next) {
    var token = [enabled, tokenid];
    client.execute(q(keyspace, 'updateApplicationToken'), token, function (err) {
      if (err) { return next(err); }
      next(err, {tokenid: tokenid, enabled: enabled});
    });
  }

  function getApplicationTokens (appid, next) {
    client.execute(q(keyspace, 'selectApplicationTokens'), [appid], function (err, result) {
      next(err, result ? result.rows : null);
    });
  }

  /**
   * Checks incoming headers for the application and logged in user tokens.
   */
  function checkRequest (req, res, next) {

    // TODO: Cleaner way of excluding some paths from the auth check
    if (req.url === '/status') {
      return next(null);
    }

    var appAuthorization = req.headers.authorization,
        user = req.headers[userHeader];

    if (!appAuthorization) {
      return res.send(new Error('You must provide an valid Authorization header to access seguir the seguir API.'));
    }

    var appId = appAuthorization.split(':')[0].split(' ')[1],
        authType = appAuthorization.split(':')[0].split(' ')[0];

    if (authType === 'SeguirApp') {

      checkApplication(appId, function (err, application) {

        if (err) { return res.send(err); }
        if (!application) { return res.send(new Error('You must provide an valid Authorization header to access seguir the seguir API.')); }

        if (authUtils.validateAuthorization(req.headers, application.appid, application.appsecret)) {
          req.keyspace = keyspace + '_' + application.appkeyspace;
          checkUser(req.keyspace, user, function (err, user) {
            if (err) { return res.send(err); }
            req.liu = user;
            next(null);
          });
        } else {
          return res.send(new Error('You must provide an valid Authorization header to access seguir the seguir API.'));
        }

      });

    } else {

      checkApplicationToken(appId, function (err, token) {

        if (err) { return res.send(err); }
        if (!user || !token) { return res.send(new Error('You must provide an valid Authorization header to access seguir the seguir API.')); }

        if (authUtils.validateAuthorization(req.headers, token.tokenid, token.tokensecret)) {
          req.keyspace = keyspace + '_' + token.appkeyspace;
          checkUser(req.keyspace, user, function (err, user) {
            if (err) { return res.send(err); }
            req.liu = user;
            next(null);
          });
        } else {
          return res.send(new Error('You must provide an valid Authorization header to access seguir the seguir API.'));
        }

      });

    }

  }

  function checkApplication (appid, next) {
    if (!appid) {
      return next(new restify.UnauthorizedError('You must provide an application id via the Authorization header to access seguir the seguir API.'));
    }
    var app = [appid];
    client.execute(q(keyspace, 'checkApplication'), app, function (err, result) {
      var application = result && result.rows.length > 0 ? result.rows[0] : null;
      if (err) { return next(err); }
      if (!application || !application.enabled) { return next(null, null); }
      next(null, application);
    });
  }

  function checkApplicationToken (tokenid, next) {
    if (!tokenid) {
      return next(new restify.UnauthorizedError('You must provide an token id via the Authorization header to access seguir the seguir API.'));
    }
    var token = [tokenid];
    client.execute(q(keyspace, 'checkApplicationToken'), token, function (err, result) {
      var token = result && result.rows.length > 0 ? result.rows[0] : null;
      if (err) { return next(err); }
      if (!token || !token.enabled) { return next(null, null); }
      next(null, token);
    });
  }

  function isUuid (value) {
    return value instanceof Uuid;
  }

  function isStringUuid (value) {
    return (typeof value === 'string' && value.length === 36 && (value.match(/-/g) || []).length === 4);
  }

  function getUserBySeguirId (user_keyspace, user, next) {
    client.execute(q(user_keyspace, 'selectUser'), [user], function (err, result) {
      if (err) { return next(err); }
      if (!result || result.rows.length === 0) { return next(new restify.InvalidArgumentError('Specified user by seguir id "' + user + '" in header "' + userHeader + '" does not exist.')); }
      next(null, result.rows[0]);
    });
  }

  function getUserByAltId (user_keyspace, user, next) {
    client.execute(q(user_keyspace, 'selectUserByAltId'), [user], function (err, result) {
      if (err) { return next(err); }
      if (!result || result.rows.length === 0) { return next(new restify.InvalidArgumentError('Specified user by alternate id "' + user + '" in header "' + userHeader + '" does not exist.')); }
      next(null, result.rows[0]);
    });
  }

  function getUserByName (user_keyspace, user, next) {
    client.execute(q(user_keyspace, 'selectUserByUsername'), [user], function (err, result) {
      if (err) { return next(err); }
      if (!result || result.rows.length === 0) { return next(new restify.InvalidArgumentError('Specified user by name "' + user + '" in header "' + userHeader + '" does not exist.')); }
      next(null, result.rows[0]);
    });
  }

  function coerceUserToUuid (user_keyspace, ids, next) {

    debug('Coercing %s to uuid', ids);

    if (!ids) {
      return next();
    }

    if (isUuid(ids)) {
      debug('Id %s IS uuid', ids);
      return next(null, ids);
    }

    var coerce = function (id, cb) {

      if (isStringUuid(id)) {
        // If user is supplied as a uuid, assume it is a Seguir ID, default back to altid
        debug('Id is string Uuid, converting', ids);
        return cb(null, Uuid.fromString(id));
      } else {
        // Assume altid first, then try name
        id = '' + id; // Ensure it is a string
        debug('Trying %s as altid', id);
        getUserByAltId(user_keyspace, id, function (err, user) {
          if (err) {
            debug('Trying %s as username', ids);
            return getUserByName(user_keyspace, id, function (err, user) {
              if (err) { return next(err); }
              debug('%s is username, uuid is %s', id, user && user.user);
              return cb(err, user && user.user);
            });
          }
          debug('%s is altid, uuid is %s', id, user && user.user);
          return cb(err, user && user.user);
        });
      }

    };

    if (typeof ids === 'string' || typeof ids === 'number') {
      coerce(ids, next);
    } else {
      async.map(ids, coerce, function (err, uuids) {
        if (err) { return next(err); }
        next(null, uuids);
      });
    }

  }

  function checkUser (user_keyspace, id, next) {

    debug('Checking user %s', id);

    if (!id) {
      return next(null, anonyomousUser);
    }

    if (isStringUuid(id)) {
      debug('Converting string %s to uuid', id);
      id = Uuid.fromString(id);
    }

    if (isUuid(id)) {
      debug('User %s is uuid', id);
      // If user is supplied as a uuid, assume it is a Seguir ID, default back to altid
      getUserBySeguirId(user_keyspace, id, function (err, user) {
        if (err) {
          // If missed, lets check to see if it is the altid
          // This does mean a performance hit for altids that look like guids!
          return getUserByAltId(user_keyspace, id, next);
        }
        return next(null, user);
      });
    } else {
      debug('User %s is NOT uuid, trying altid', id);
      // Assume altid first, then try name
      getUserByAltId(user_keyspace, id, function (err, user) {
        if (err) {
          debug('User %s is NOT altid, trying username', id);
          return getUserByName(user_keyspace, id, next);
        }
        return next(null, user);
      });
    }

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
    addApplicationToken: addApplicationToken,
    updateApplicationToken: updateApplicationToken,
    getApplicationTokens: getApplicationTokens,
    checkRequest: checkRequest,
    checkApplication: checkApplication,
    checkApplicationToken: checkApplicationToken,
    checkUser: checkUser,
    coerceUserToUuid: coerceUserToUuid
  };

}

function generateKeyspaceFromName (str) {
  str = str.toLowerCase();
  str = str.replace(/[^a-z0-9]+/g, '_');
  str = str.replace(/^-|-$/g, '');
  return str;
}

Auth.headerNames = {
  userHeader: userHeader
};

module.exports = Auth;

