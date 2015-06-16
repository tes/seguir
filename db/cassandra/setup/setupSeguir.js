/**
 * Sets up the core
 */
var async = require('async');

function setup (client, keyspace, next) {

  var tables = [
    'CREATE TABLE ' + keyspace + '.accounts (account uuid, name text, isadmin boolean, enabled boolean, PRIMARY KEY (account))',
    'CREATE TABLE ' + keyspace + '.account_users (account uuid, username text, password text, enabled boolean, PRIMARY KEY (account, username))',
    'CREATE TABLE ' + keyspace + '.applications (appid uuid, name text, appkeyspace text, appsecret text, account uuid, enabled boolean, PRIMARY KEY (appid))',
    'CREATE TABLE ' + keyspace + '.application_tokens (appid uuid, appkeyspace text, tokenid uuid,  tokensecret text, enabled boolean, PRIMARY KEY (tokenid))',
    'CREATE TABLE ' + keyspace + '.schema_version (version varint, applied timestamp, description text, PRIMARY KEY (version, applied)) WITH CLUSTERING ORDER BY (applied DESC)'
  ];

  var indexes = [
    'CREATE INDEX ON ' + keyspace + '.accounts(name)',
    'CREATE INDEX ON ' + keyspace + '.applications(account)',
    'CREATE INDEX ON ' + keyspace + '.account_users(username)',
    'CREATE INDEX ON ' + keyspace + '.application_tokens(appid)'
  ];

  var helpers = require('./helpers')(client, {
    KEYSPACE: keyspace,
    tables: tables,
    indexes: indexes
  });

  async.series([
    helpers.dropKeyspace,
    helpers.createKeyspace,
    helpers.createTables,
    helpers.createSecondaryIndexes,
    helpers.initialiseSchemaVersion
  ], function (err, data) {
    /* istanbul ignore if */
    if (err) console.dir(err);
    next();
  });
}

module.exports = setup;
