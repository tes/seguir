function apply (keyspace, api, next) {
  var schemaVersionCql = 'CREATE TABLE ' + keyspace + '.counts (user uuid, type text, count counter, PRIMARY KEY (user, type))';
  api.client.execute(schemaVersionCql, next);
}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
