var async = require('async');

function apply (keyspace, api, next) {
  var schemaVersionCql = [
    'ALTER TABLE ' + keyspace + '.likes ADD visibility text',
    'ALTER TABLE ' + keyspace + '.friends ADD visibility text',
    'ALTER TABLE ' + keyspace + '.friend_request ADD visibility text',
    'ALTER TABLE ' + keyspace + '.posts ADD visibility text',
    'ALTER TABLE ' + keyspace + '.posts DROP isprivate',
    'ALTER TABLE ' + keyspace + '.posts DROP ispersonal',
    'ALTER TABLE ' + keyspace + '.followers ADD visibility text',
    'ALTER TABLE ' + keyspace + '.followers DROP isprivate',
    'ALTER TABLE ' + keyspace + '.followers DROP ispersonal',
    'ALTER TABLE ' + keyspace + '.feed_timeline ADD visibility text',
    'ALTER TABLE ' + keyspace + '.feed_timeline DROP isprivate',
    'ALTER TABLE ' + keyspace + '.feed_timeline DROP ispersonal',
    'ALTER TABLE ' + keyspace + '.user_timeline ADD visibility text',
    'ALTER TABLE ' + keyspace + '.user_timeline DROP isprivate',
    'ALTER TABLE ' + keyspace + '.user_timeline DROP ispersonal'
  ];

  async.mapSeries(schemaVersionCql, api.client.execute, next);
}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
