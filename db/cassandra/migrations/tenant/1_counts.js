function apply (keyspace, api, next) {
  var schemaVersionCql = 'CREATE TABLE ' + keyspace + '.counts (item text, type text, count counter, PRIMARY KEY (item, type))';
  api.client.execute(schemaVersionCql, next);
}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
