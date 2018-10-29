const async = require('async');

/**
 * This migration moves the appsecret from applications, onto application tokens
 * so that they can be managed completely independently from the application itself.
 *
 * Particularly this allows you to change the secret by adding a new one, then redeploying
 * clients, then removing the old.
 */
const apply = (keyspace, api, next) => {
  const addDescription = 'ALTER TABLE ' + keyspace + '.application_tokens ADD description text';
  const getApplications = 'SELECT account, name, appkeyspace, appid, appsecret, enabled FROM ' + keyspace + '.applications';
  const insertApplicationToken = 'INSERT INTO ' + keyspace + '.application_tokens (appid, appkeyspace, tokenid, tokensecret, description, enabled) VALUES(?, ?, ?, ?, ?, ?)';

  api.client.execute(addDescription, err => {
    if (err) return next(err);
    api.client.execute(getApplications, (err, results) => {
      if (err) return next(err);
      async.mapSeries(results, (item, cb) => {
        const data = [item.appid, item.appkeyspace, item.appid, item.appsecret, 'Initial Token', item.enabled];
        api.client.execute(insertApplicationToken, data, cb);
      }, err => {
        if (err) return next(err);
        next(null);
      });
    });
  });
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply,
  rollback,
};
