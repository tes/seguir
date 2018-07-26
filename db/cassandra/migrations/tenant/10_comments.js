var async = require('async');

function apply (keyspace, api, next) {
  var cqls = [
    'CREATE TABLE ' + keyspace + '.comments (comment uuid PRIMARY KEY, user uuid, post uuid, commentdata map<text,text>, commented timestamp)',

    'CREATE TABLE ' + keyspace + '.comments_timeline (post uuid, time timeuuid, comment uuid, PRIMARY KEY (post, time)) WITH CLUSTERING ORDER BY (time ASC)'
  ];
  async.mapSeries(cqls, api.client.execute, next);
}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
