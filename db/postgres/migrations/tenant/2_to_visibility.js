var async = require('async');

function apply (keyspace, api, next) {

  var schemaVersionCql = [
    'ALTER TABLE ' + keyspace + '.posts ADD COLUMN visibility varchar(50)',
    'ALTER TABLE ' + keyspace + '.posts DROP COLUMN isprivate',
    'ALTER TABLE ' + keyspace + '.posts DROP COLUMN ispersonal',
    'ALTER TABLE ' + keyspace + '.followers ADD COLUMN visibility varchar(50)',
    'ALTER TABLE ' + keyspace + '.followers DROP COLUMN isprivate',
    'ALTER TABLE ' + keyspace + '.followers DROP COLUMN ispersonal',
    'ALTER TABLE ' + keyspace + '.feed_timeline ADD COLUMN visibility varchar(50)',
    'ALTER TABLE ' + keyspace + '.feed_timeline DROP COLUMN isprivate',
    'ALTER TABLE ' + keyspace + '.feed_timeline DROP COLUMN ispersonal',
    'ALTER TABLE ' + keyspace + '.user_timeline ADD COLUMN visibility varchar(50)',
    'ALTER TABLE ' + keyspace + '.user_timeline DROP COLUMN isprivate',
    'ALTER TABLE ' + keyspace + '.user_timeline DROP COLUMN ispersonal'
  ];

  async.map(schemaVersionCql, api.client.execute, next);

}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
