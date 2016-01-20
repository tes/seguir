/**
 * Sets up the core
 */
var async = require('async');
var schemaVersion = 1;

function setup (client, keyspace, next) {
  var tables = [
    'CREATE TABLE ' + keyspace + '.accounts (account varchar(36), name varchar(100), isadmin boolean, enabled boolean)',
    'CREATE TABLE ' + keyspace + '.account_users (account varchar(36), username varchar(100), password varchar(500), enabled boolean)',
    'CREATE TABLE ' + keyspace + '.applications (appid varchar(36), name varchar(100), appkeyspace varchar(500), account varchar(36), enabled boolean)',
    'CREATE TABLE ' + keyspace + '.application_tokens (appid varchar(36), appkeyspace varchar(100), tokenid varchar(36), tokensecret varchar(100), enabled boolean, description varchar(500))',
    'CREATE TABLE ' + keyspace + '.schema_version (version smallint, applied timestamptz, description varchar(500))'
  ];

  var indexes = [
    'CREATE INDEX accounts_name_idx ON ' + keyspace + '.accounts ("name")',
    'CREATE INDEX applications_account_idx ON ' + keyspace + '.applications ("account")',
    'CREATE INDEX applications_username_idx ON ' + keyspace + '.applications ("username")',
    'CREATE INDEX account_users_username_idx ON ' + keyspace + '.account_users ("username")',
    'CREATE INDEX application_tokens_appid_idx ON ' + keyspace + '.application_tokens ("appid")'
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
    async.apply(helpers.initialiseSchemaVersion, schemaVersion)
  ], function (err, data) {
    /* istanbul ignore if */
    if (err) console.dir(err);
    next();
  });
}

module.exports = setup;
