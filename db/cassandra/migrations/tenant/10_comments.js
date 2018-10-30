const async = require('async');

const apply = (keyspace, api, next) => {
  const cqls = [
    `CREATE TABLE ${keyspace}.comments (comment uuid PRIMARY KEY, user uuid, post uuid, commentdata map<text,text>, commented timestamp)`,

    `CREATE TABLE ${keyspace}.comments_timeline (post uuid, time timeuuid, comment uuid, PRIMARY KEY (post, time)) WITH CLUSTERING ORDER BY (time ASC)`,
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
