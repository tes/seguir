const restify = require('restify');
const async = require('async');
const userHeader = 'x-seguir-user-token';
const authUtils = require('./utils');
const anonyomousUser = { user: null, username: 'Not logged in.' };
const debug = require('debug')('seguir:auth');

const Auth = (api) => {
  const client = api.client;
  const q = client.queries;
  const keyspace = api.config.keyspace;
  const setupTenant = client.setup.setupTenant;

  /**
   * Core account API
   */
  const addAccount = (name, isadmin, enabled, next) => {
    checkAccountDuplicate(name, (err, checkAccount) => {
      if (err) { return next(err); }
      if (checkAccount) { return next(new Error('An account with that name already exists!')); }

      const account = client.generateId();
      const accountData = [account, name, isadmin, enabled];
      client.execute(q(keyspace, 'upsertAccount'), accountData, {}, err => {
        if (err) { return next(err); }
        next(null, { account, name, isadmin, enabled });
      });
    });
  };

  const getAccount = (account, next) => {
    client.get(q(keyspace, 'selectAccount'), [account], { cacheKey: `account:${account}` }, (err, result) => {
      if (err) { return next(err); }
      next(null, result);
    });
  };

  const checkAccountDuplicate = (name, next) => {
    client.get(q(keyspace, 'selectAccountByName'), [name], {}, (err, result) => {
      if (err) { return next(err); }
      next(null, result);
    });
  };

  const getAccounts = (next) => {
    client.execute(q(keyspace, 'selectAccounts'), null, {}, (err, result) => {
      if (err) { return next(err); }
      next(null, result);
    });
  };

  const updateAccount = (account, name, isadmin, enabled, next) => {
    const accountData = [name, isadmin, enabled, account];
    client.execute(q(keyspace, 'updateAccount'), accountData, { cacheKey: `account:${account}` }, err => {
      if (err) { return next(err); }
      next(null, { account, name, isadmin, enabled });
    });
  };

  /**
   * Core account user API
   */
  const addAccountUser = (account, username, password, enabled, next) => {
    getAccountUserByName(username, (err, checkUser) => {
      if (err) { return next(err); }
      if (checkUser) { return next(new Error('An user with that username already exists.')); }
      authUtils.hashPassword(password, (err, hash) => {
        if (err) { return next(err); }
        const userData = [account, username, hash, enabled];
        client.execute(q(keyspace, 'upsertAccountUser'), userData, {}, err => {
          if (err) { return next(err); }
          next(null, { account, username, enabled });
        });
      });
    });
  };

  const getAccountUserByName = (username, next) => {
    client.get(q(keyspace, 'selectAccountUserByName'), [username], {}, (err, result) => {
      if (err) { return next(err); }
      next(null, result);
    });
  };

  const loginUser = (username, password, next) => {
    client.get(q(keyspace, 'selectAccountUserByName'), [username], {}, (err, result) => {
      if (err) { return next(err); }
      const user = result;
      if (!user) { return next(null, false); }
      if (!user.enabled) { return next(null, false); }
      authUtils.checkPassword(password, user.password, (err, valid) => {
        if (err) { return next(err); }
        next(null, valid);
      });
    });
  };

  const getAccountUsers = (account, next) => {
    client.execute(q(keyspace, 'selectAccountUsers'), [account], {}, (err, result) => {
      if (err) { return next(err); }
      next(null, result);
    });
  };

  const updateAccountUser = (account, username, password, enabled, next) => {
    authUtils.hashPassword(password, (err, hash) => {
      if (err) { return next(err); }
      const userData = [hash, enabled, account, username];
      client.execute(q(keyspace, 'updateAccountUser'), userData, {}, err => {
        if (err) { return next(err); }
        next(null, { account, username, enabled });
      });
    });
  };

  /**
   *  Application API
   */
  const updateApplication = (appid, name, enabled, next) => {
    const application = [name, enabled, appid];
    client.execute(q(keyspace, 'updateApplication'), application, { cacheKey: `application:${appid}` }, err => {
      next(err, { name, appid, enabled });
    });
  };

  const addApplication = (account, name, appid, next) => {
    if (!next) { next = appid; appid = null; }
    appid = appid || client.generateId();
    const appkeyspace = generateKeyspaceFromName(name);
    const enabled = true;
    const app = [account, name, appkeyspace, appid, enabled];
    client.execute(q(keyspace, 'upsertApplication'), app, {}, err => {
      if (err) { return next(err); }
      setupTenant(client, `${keyspace}_${appkeyspace}`, err => {
        if (err) { return next(err); }
        next(null, { account, name, appkeyspace, appid, enabled });
      });
    });
  };

  const getApplications = (account, next) => {
    client.execute(q(keyspace, 'selectApplications'), [account], (err, result) => {
      if (err) { return next(err); }
      next(null, result);
    });
  };

  /**
   *  Application Token API
   */
  const addApplicationToken = (appid, appkeyspace, description, tokenid, tokensecret, next) => {
    if (!next) { next = tokensecret; tokensecret = null; }
    if (!next) { next = tokenid; tokenid = null; }
    tokenid = tokenid || client.generateId();
    tokensecret = tokensecret || authUtils.generateSecret(client.generateId());
    const enabled = true;
    const token = [appid, appkeyspace, tokenid, tokensecret, description, enabled];
    client.execute(q(keyspace, 'upsertApplicationToken'), token, {}, err => {
      if (err) { return next(err); }
      next(null, { appid, appkeyspace, tokenid, tokensecret, description, enabled });
    });
  };

  const updateApplicationToken = (tokenid, enabled, description, next) => {
    const token = [enabled, description, tokenid];
    client.execute(q(keyspace, 'updateApplicationToken'), token, {}, err => {
      if (err) { return next(err); }
      next(null, { tokenid, description, enabled });
    });
  };

  const updateApplicationTokenSecret = (tokenid, next) => {
    const tokensecret = authUtils.generateSecret(client.generateId());
    const token = [tokensecret, tokenid];
    client.execute(q(keyspace, 'updateApplicationTokenSecret'), token, {}, err => {
      if (err) { return next(err); }
      next(null, { tokenid, tokensecret });
    });
  };

  const getApplicationTokens = (appid, next) => {
    client.execute(q(keyspace, 'selectApplicationTokens'), [appid], {}, (err, result) => {
      if (err) { return next(err); }
      next(null, result);
    });
  };

  /**
   * Checks incoming headers for the application and logged in user tokens.
   */
  const checkRequest = (req, res, next) => {
    // TODO: Cleaner way of excluding some paths from the auth check
    if (req.url === '/status') {
      return next(null);
    }

    const appAuthorization = req.headers.authorization;
    const user = req.headers[userHeader];

    if (!appAuthorization) {
      return next(new restify.InvalidArgumentError('You must provide an valid Authorization header to access seguir the seguir API.'));
    }

    const appId = appAuthorization.split(':')[0].split(' ')[1];

    checkApplicationToken(appId, (err, token) => {
      if (err) { return next(err); }
      if (!token) {
        return next(new restify.InvalidArgumentError('You must provide an valid Authorization header to access seguir the seguir API.'));
      }

      if (authUtils.validateAuthorization(req.headers, token.tokenid, token.tokensecret)) {
        req.keyspace = `${keyspace}_${token.appkeyspace}`;
        checkUser(req.keyspace, user, (err, user) => {
          if (err) { return next(err); }
          req.liu = user;
          next(null);
        });
      } else {
        return next(new restify.InvalidArgumentError('You must provide an valid Authorization header to access seguir the seguir API.'));
      }
    });
  };

  const checkApplicationToken = (tokenid, next) => {
    if (!tokenid) {
      return next(new restify.UnauthorizedError('You must provide an token id via the Authorization header to access seguir the seguir API.'));
    }
    const token = [tokenid];
    client.get(q(keyspace, 'checkApplicationToken'), token, { cacheKey: `token:${tokenid}` }, (err, result) => {
      const token = result;
      if (err) { return next(err); }
      if (!token || !token.enabled) { return next(null, null); }
      next(null, token);
    });
  };

  const getUserBySeguirId = (user_keyspace, user, next) => {
    client.get(q(user_keyspace, 'selectUser'), [user], { cacheKey: `user:${user}` }, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(new restify.InvalidArgumentError(`Specified user by seguir id "${user}" in header "${userHeader}" does not exist.`)); }
      next(null, result);
    });
  };

  const getUserByAltId = (user_keyspace, user, next) => {
    client.get(q(user_keyspace, 'selectUserByAltId'), [user], { cacheKey: `useraltid:${user}` }, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(new restify.InvalidArgumentError(`Specified user by alternate id "${user}" in header "${userHeader}" does not exist.`)); }
      next(null, result);
    });
  };

  const getUserByName = (user_keyspace, user, next) => {
    client.get(q(user_keyspace, 'selectUserByUsername'), [user], { cacheKey: `username:${user}` }, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(new restify.InvalidArgumentError(`Specified user by name "${user}" in header "${userHeader}" does not exist.`)); }
      next(null, result);
    });
  };

  const coerceUserToUuid = (user_keyspace, ids, next) => {
    debug('Coercing %s to uuid', ids);

    if (!ids) {
      return next(null, null);
    }

    const coerce = (id, cb) => {
      if (!id) {
        return cb(null, null);
      }

      if (client.isValidId(id)) {
        debug('Id %s IS already valid uuid', id);
        return cb(null, client.formatId(id));
      }

      // Assume altid first, then try name
      id = `${id}`; // Ensure it is a string
      debug('Trying %s as altid', id);
      getUserByAltId(user_keyspace, id, (err, user) => {
        if (err) {
          debug('Trying %s as username', id);
          getUserByName(user_keyspace, id, (err, user) => {
            if (err) {
              return next(err);
            }
            debug('%s is username, uuid is %s', id, user && user.user);
            return cb(err, user && user.user);
          });
        } else {
          debug('%s is altid, uuid is %s', id, user && user.user);
          return cb(err, user && user.user);
        }
      });
    };

    if (!Array.isArray(ids)) {
      coerce(ids, next);
    } else {
      async.map(ids, coerce, (err, uuids) => {
        if (err) { return next(err); }
        next(null, uuids);
      });
    }
  };

  const checkUser = (user_keyspace, id, next) => {
    debug('Checking user %s', id);

    if (!id) {
      return next(null, anonyomousUser);
    }

    if (client.isValidId(id)) {
      debug('User %s is uuid', id);
      // If user is supplied as a uuid, assume it is a Seguir ID, default back to altid
      getUserBySeguirId(user_keyspace, id, (err, user) => {
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
      getUserByAltId(user_keyspace, id, (err, user) => {
        if (err) {
          debug('User %s is NOT altid, trying username', id);
          return getUserByName(user_keyspace, id, next);
        }
        return next(null, user);
      });
    }
  };

  return {
    addAccount,
    getAccount,
    getAccounts,
    updateAccount,
    addAccountUser,
    getAccountUsers,
    getAccountUserByName,
    loginUser,
    updateAccountUser,
    addApplication,
    getApplications,
    updateApplication,
    addApplicationToken,
    updateApplicationToken,
    updateApplicationTokenSecret,
    getApplicationTokens,
    checkRequest,
    checkApplicationToken,
    checkUser,
    coerceUserToUuid,
  };
};

const generateKeyspaceFromName = (str) => {
  str = str.toLowerCase();
  str = str.replace(/[^a-z0-9]+/g, '_');
  str = str.replace(/^-|-$/g, '');
  return str;
};

Auth.headerNames = {
  userHeader,
};

module.exports = Auth;
