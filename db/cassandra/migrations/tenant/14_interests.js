const async = require('async');

const apply = (keyspace, api, next) => {
  const cqls = [
    `CREATE TABLE ${keyspace}.interests (user uuid, type text, keyword text, PRIMARY KEY ((type, keyword), user));`,
    `CREATE INDEX ON ${keyspace}.interests (user);`,
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
