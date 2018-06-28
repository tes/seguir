var async = require('async');

function apply (keyspace, api, next) {
  var cqls = [
    'CREATE TABLE ' + keyspace + '.groups (group uuid PRIMARY KEY, supergroupid text, groupdata map<text,text>, groupname text)',
    'CREATE INDEX ON ' + keyspace + '.groups(supergroupid)',
    'CREATE INDEX ON ' + keyspace + '.groups(groupname)',

    'CREATE TABLE ' + keyspace + '.members (group uuid, user uuid, since timestamp, PRIMARY KEY (group, user))',
    'CREATE INDEX ON ' + keyspace + '.members(user)',

    'ALTER TABLE ' + keyspace + '.posts ADD group uuid',
    'CREATE INDEX ON ' + keyspace + '.posts(group)',

    'CREATE TABLE ' + keyspace + '.group_timeline (group uuid, time timeuuid, item uuid, type text, PRIMARY KEY (group, time)) WITH CLUSTERING ORDER BY (time DESC)',
    'CREATE INDEX ON ' + keyspace + '.group_timeline (item)',
    'CREATE INDEX ON ' + keyspace + '.group_timeline (type)'
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
