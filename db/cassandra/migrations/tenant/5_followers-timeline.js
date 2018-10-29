const async = require('async');

const apply = (keyspace, api, next) => {
  const addPostAltidCql = [
    'CREATE TABLE ' + keyspace + '.followers_timeline (follow uuid, user uuid, user_follower uuid, is_private boolean, is_personal boolean, is_public boolean, time timeuuid, since timestamp, PRIMARY KEY (user, time)) WITH CLUSTERING ORDER BY (time DESC)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(follow)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(user_follower)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(is_private)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(is_personal)',
    'CREATE INDEX ON ' + keyspace + '.followers_timeline(is_public)',
  ];

  async.series(
    [
      cb => {
        async.mapSeries(addPostAltidCql, api.client.execute, cb);
      },
      cb => {
        let write = 0;
        let read = 0;
        let done = false;
        const selectQuery = 'SELECT follow, user, user_follower, since, visibility FROM ' + keyspace + '.followers;';
        const insertQuery = 'INSERT INTO ' + keyspace + '.followers_timeline (follow, user, user_follower, time, since, is_private, is_personal, is_public) VALUES(?, ?, ?, ?, ?, ?, ?, ?);';
        api.client._client.eachRow(selectQuery, [], { autoPage: true }, (index, row) => {
          read++;
          const isPrivate = api.visibility.isPrivate(row.visibility);
          const isPersonal = api.visibility.isPersonal(row.visibility);
          const isPublic = api.visibility.isPublic(row.visibility);
          api.client.execute(insertQuery, [row.follow, row.user, row.user_follower, api.client.generateTimeId(row.since), row.since, isPrivate, isPersonal, isPublic], { prepare: true }, err => {
            if (err) {
              throw err;
            }
            if (read === ++write && done) {
              cb();
            }
          });
        }, () => {
          done = true;
        });
      },
    ], next);
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply,
  rollback,
};
