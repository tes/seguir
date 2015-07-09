var async = require('async');

function apply (keyspace, api, next) {
  var cql = [
    'ALTER TABLE ' + keyspace + '.application_tokens ADD description text'
  ];
  // Migrate the current appid / appsecret over to a new application_token
  var getApplications = 'SELECT account, name, appkeyspace, appid, appsecret, enabled FROM ' + keyspace + '.applications';
  var insertApplicationToken = 'INSERT INTO ' + keyspace + '.application_tokens (appid, appkeyspace, tokenid, tokensecret, description, enabled) VALUES(?, ?, ?, ?, ?, ?)';
  async.mapSeries(cql, api.client.execute, function (err) {
    if (err) return next(err);
    api.client.execute(getApplications, function (err, results) {
      if (err) return next(err);
      async.mapSeries(results, function (item, cb) {
        var data = [item.appid, item.appkeyspace, item.appid, item.appsecret, 'Initial Token', item.enabled];
        api.client.execute(insertApplicationToken, data, cb);
      }, next);
    });
  });
}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
