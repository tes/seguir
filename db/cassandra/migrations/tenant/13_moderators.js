const async = require('async');

const apply = (keyspace, api, next) => {
  const cqls = [
    `CREATE TABLE ${keyspace}.moderators (user uuid PRIMARY KEY)`,
    `ALTER TABLE ${keyspace}.posts ADD moderatedby text`,
    `ALTER TABLE ${keyspace}.comments ADD moderatedby text`,
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
