var async = require('async');

function apply (keyspace, api, next) {

  var sql = [
    'CREATE TABLE ' + keyspace + '.counts ("user" varchar(36) NOT NULL, "type" varchar(20) NOT NULL, count integer DEFAULT 0)',
    'CREATE INDEX counts_user_idx ON ' + keyspace + '.counts ("user")',
    'CREATE INDEX counts_type_idx ON ' + keyspace + '.counts ("type")'
  ];

  async.map(sql, api.client.execute, next);

}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};

