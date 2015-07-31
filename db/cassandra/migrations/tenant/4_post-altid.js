var async = require('async');

function apply (keyspace, api, next) {

  var addPostAltidCql = [
    'ALTER TABLE ' + keyspace + '.posts ADD altid text',
    'CREATE INDEX ON ' + keyspace + '.posts(altid)'
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
