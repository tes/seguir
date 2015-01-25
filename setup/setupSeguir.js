/**
 * Sets up the core
 */
var async = require('async');

function setup(client, keyspace, next) {

  var tables =['CREATE TABLE ' + keyspace + '.applications (name text, apptoken uuid, PRIMARY KEY (name))'];
  var indexes = ['CREATE INDEX ON ' + keyspace + '.applications(apptoken)'];

  var helpers = require('./helpers')(client, {
    KEYSPACE: keyspace,
    tables: tables,
    indexes: indexes
  });

  async.series([
    helpers.dropKeyspace,
    helpers.createKeyspace,
    helpers.createTables,
    helpers.createSecondaryIndexes
  ], function(err, data) {
    /* istanbul ignore if */
    if(err) console.dir(err);
    next();
  });
}

module.exports = setup;
