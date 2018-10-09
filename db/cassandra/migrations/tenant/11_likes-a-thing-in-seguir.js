const async = require('async');

const apply = (keyspace, api, next) => {
  const cqls = [
    'DROP TABLE ' + keyspace + '.likes',

    'CREATE TABLE ' + keyspace + '.likes (like uuid, user uuid, item uuid, since timestamp, PRIMARY KEY (user, item))',

    'CREATE INDEX ON ' + keyspace + '.likes(like)'
  ];
  async.mapSeries(cqls, api.client.execute, next);
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply,
  rollback
};
