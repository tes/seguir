const async = require('async');

const apply = (keyspace, api, next) => {
  const addPostAltidCql = [
    `ALTER TABLE ${keyspace}.posts ADD altid text`,
    `CREATE INDEX ON ${keyspace}.posts(altid)`,
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
