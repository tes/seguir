/**
 * Sets up the core
 */
var async = require('async');

function setup(client, keyspace, next) {

  var tables =[
    'CREATE TABLE ' + keyspace + '.accounts (account uuid, name text, isadmin boolean, enabled boolean, PRIMARY KEY (account))',
    'CREATE TABLE ' + keyspace + '.account_users (account uuid, username text, password text, enabled boolean, PRIMARY KEY (account, username))',
    'CREATE TABLE ' + keyspace + '.applications (appid uuid, name text, appkeyspace text, appsecret text, account uuid, enabled boolean, PRIMARY KEY (appid))'
  ];

  var indexes = [
    'CREATE INDEX ON ' + keyspace + '.applications(account)',
    'CREATE INDEX ON ' + keyspace + '.account_users(username)'
  ];

  var helpers = require('./helpers')(client, {
    KEYSPACE: keyspace,
    tables: tables,
    indexes: indexes
  });

  var setupAdmin = function(cb) {

    // Add the default account


  }

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
