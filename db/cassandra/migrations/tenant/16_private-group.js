const async = require('async');

const apply = (keyspace, api, next) => {
  const cqls = [
    `ALTER TABLE ${keyspace}.groups ADD is_private boolean`,
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
