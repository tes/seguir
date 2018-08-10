var async = require('async');

function apply (keyspace, api, next) {
  var cqls = [
    'DROP TABLE ' + keyspace + '.likes',

    'CREATE TABLE ' + keyspace + '.likes (like uuid, user uuid, item uuid, since timestamp, PRIMARY KEY (user, item))',

    'CREATE INDEX ON ' + keyspace + '.likes(like)'
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
