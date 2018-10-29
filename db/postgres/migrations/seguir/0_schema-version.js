function apply(keyspace, api, next) {
  var schemaVersionCql = 'CREATE TABLE ' + keyspace + '.schema_version (version smallint, applied timestamptz, description varchar(500))';
  api.client.execute(schemaVersionCql, next);
}

function rollback(keyspace, api, next) {
  next();
}

module.exports = {
  apply,
  rollback,
};
