const async = require('async');

const apply = (keyspace, api, next) => {
  const addFromFollowerCql = [
    'ALTER TABLE ' + keyspace + '.feed_timeline ADD from_follow uuid',
    'ALTER TABLE ' + keyspace + '.user_timeline ADD from_follow uuid',
    'CREATE INDEX ON ' + keyspace + '.feed_timeline(from_follow)',
    'CREATE INDEX ON ' + keyspace + '.user_timeline(from_follow)',
  ];
  async.mapSeries(addFromFollowerCql, api.client.execute, next);
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply,
  rollback,
};
