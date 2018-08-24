var async = require('async');

function apply (keyspace, api, next) {
  var cqls = [
    'CREATE INDEX ON ' + keyspace + '.comments(user)'
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
