const apply = (keyspace, api, next) => {
  const schemaVersionCql = 'CREATE TABLE ' + keyspace + '.counts (item text, type text, count counter, PRIMARY KEY (item, type))';
  api.client.execute(schemaVersionCql, next);
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply,
  rollback
};
