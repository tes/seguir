var async = require('async');
var _ = require('lodash');

function apply (keyspace, api, next) {

  var addPostAltidCql = [
    'CREATE TABLE ' + keyspace + '.followers_timeline (follow uuid, user uuid, user_follower uuid, visibility text, time timeuuid, since timestamp, PRIMARY KEY (user, time)) WITH CLUSTERING ORDER BY (time DESC)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(follow)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(user_follower)'
  ];

  async.series(
    [
      function (cb) {
        async.mapSeries(addPostAltidCql, api.client.execute, cb);
      },
      function (cb) {
        var selectQuery = 'SELECT follow, user, user_follower, since, visibility FROM ' + keyspace + '.followers;';
        var insertQuery = 'INSERT INTO ' + keyspace + '.followers_timeline (follow, user, user_follower, time, since, visibility) VALUES(?, ?, ?, ?, ?, ?);';
        api.client._client.eachRow(selectQuery, [], {autopage: true}, function (index, row) {
          api.client._client.execute(insertQuery, [row.follow, row.user, row.user_follower, api.client.generateTimeId(row.since), row.since, row.visibility], {prepare: true}, _.noop);
        }, cb);
      }
    ], next);

}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
