/**
 * Common helpers for migrations
 */
module.exports = function (keyspace, api) {

  var client = api.client,
      q = client.queries;

  function getMigrationsToApply (keyspace, next) {

  }

  function getMigrations (keyspace, next) {

  }

  function getSchemaVersions (keyspace, next) {
    client.execute(q(keyspace, 'selectSchemaVersions'), [], {prepare: true}, function (err, result) {
      if (err) { return next(err); }
      next(null, result);
    });
  }

  function insertSchemaVersion (keyspace, version, next) {
    client.execute(q(keyspace, 'insertSchemaVersion'), [version, client.getTimestamp()], {prepare: true}, function (err, result) {
      if (err) { return next(err); }
      next(null, result);
    });
  }

  return {
    insertSchemaVersion: insertSchemaVersion,
    getSchemaVersions: getSchemaVersions,
    getMigrations: getMigrations,
    getMigrationsToApply: getMigrationsToApply
  };

};
