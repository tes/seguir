const async = require('async');

const apply = (keyspace, api, next) => {
  const addPostAltidCql = [
    'CREATE INDEX ON ' + keyspace + '.user_timeline(type)',
    'CREATE INDEX ON ' + keyspace + '.feed_timeline(type)',
  ];

  async.mapSeries(addPostAltidCql, api.client.execute, next);
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply,
  rollback,
};
