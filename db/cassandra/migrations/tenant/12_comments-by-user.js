const async = require('async');

const apply = (keyspace, api, next) => {
  const cqls = [
    'CREATE INDEX ON ' + keyspace + '.comments(user)',
  ];
  async.mapSeries(cqls, api.client.execute, next);
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply,
  rollback,
};
