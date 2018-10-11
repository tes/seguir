var async = require('async');

function apply (keyspace, api, next) {
  var cqls = [
    'CREATE TABLE ' + keyspace + '.moderators (user uuid PRIMARY KEY)',
    'ALTER TABLE ' + keyspace + '.posts ADD moderatedby text',
    'ALTER TABLE ' + keyspace + '.comments ADD moderatedby text'
  ];
  async.mapSeries(cqls, api.client.execute, next);
}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
