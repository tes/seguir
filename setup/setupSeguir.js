/**
 * Sets up the core
 */
var async = require('async');

function setup(client, keyspace, next) {

  var tables =['CREATE TABLE ' + keyspace + '.applications (name text, apptoken uuid, PRIMARY KEY (name))'];

  var helpers = require('./helpers')(client, {
    KEYSPACE: keyspace,
    tables: tables
  });

  async.series([
    helpers.dropKeyspace,
    helpers.createKeyspace,
    helpers.createTables
  ], function(err, data) {
    /* istanbul ignore if */
    if(err) console.dir(err);
    next();
  });
}

module.exports = setup;
