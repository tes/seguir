var async = require('async');

function apply (keyspace, api, next) {

  var addPostAltidCql = [
    'CREATE INDEX ON ' + keyspace + '.user_timeline(type)',
    'CREATE INDEX ON ' + keyspace + '.feed_timeline(type)'
  ];

  async.mapSeries(addPostAltidCql, api.client.execute, next);
}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
