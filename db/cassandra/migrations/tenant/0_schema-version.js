function apply (keyspace, api, next) {
  var schemaVersionCql = 'CREATE TABLE ' + keyspace + '.schema_version (version varint, applied timestamp, description text, PRIMARY KEY (version, applied)) WITH CLUSTERING ORDER BY (applied DESC)';
  api.client.execute(schemaVersionCql, next);
}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
