const apply = (keyspace, api, next) => {
  const schemaVersionCql = 'CREATE TABLE ' + keyspace + '.schema_version (version varint, applied timestamp, description text, PRIMARY KEY (version, applied)) WITH CLUSTERING ORDER BY (applied DESC)';
  api.client.execute(schemaVersionCql, next);
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply,
  rollback
};
