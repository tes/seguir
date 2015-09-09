var async = require('async');
var _ = require('lodash');

function apply (keyspace, api, next) {

  var addPostAltidCql = [
    'CREATE TABLE ' + keyspace + '.followers_timeline (follow uuid, user uuid, user_follower uuid, is_private boolean, is_personal boolean, is_public boolean, time timeuuid, since timestamp, PRIMARY KEY (user, time)) WITH CLUSTERING ORDER BY (time DESC)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(follow)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(user_follower)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(is_private)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(is_personal)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(is_public)'
  ];

  async.series(
    [
      function (cb) {
        async.mapSeries(addPostAltidCql, api.client.execute, cb);
      },
      function (cb) {
        var selectQuery = 'SELECT follow, user, user_follower, since, visibility FROM ' + keyspace + '.followers;';
        var insertQuery = 'INSERT INTO ' + keyspace + '.followers_timeline (follow, user, user_follower, time, since, is_private, is_personal, is_public) VALUES(?, ?, ?, ?, ?, ?);';
        api.client._client.eachRow(selectQuery, [], {autopage: true}, function (index, row) {
          var isPrivate = api.visibility.isPrivate(row.visibility);
          var isPersonal = api.visibility.isPersonal(row.visibility);
          var isPublic = api.visibility.isPublic(row.visibility);
          api.client._client.execute(insertQuery, [row.follow, row.user, row.user_follower, api.client.generateTimeId(row.since), row.since, isPrivate, isPersonal, isPublic], {prepare: true}, _.noop);
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
