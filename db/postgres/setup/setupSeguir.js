/**
 * Sets up the core
 */
var async = require('async');

function setup (client, keyspace, next) {

  var tables = [
    'CREATE TABLE ' + keyspace + '.accounts (account varchar(36), name varchar(500), isadmin boolean, enabled boolean)',
    'CREATE TABLE ' + keyspace + '.account_users (account varchar(36), username varchar(500), password varchar(500), enabled boolean)',
    'CREATE TABLE ' + keyspace + '.applications (appid varchar(36), name varchar(500), appkeyspace varchar(500), appsecret varchar(500), account varchar(36), enabled boolean)',
    'CREATE TABLE ' + keyspace + '.application_tokens (appid varchar(36), appkeyspace varchar(500), tokenid varchar(36), tokensecret varchar(500), enabled boolean)'
  ];

  var indexes = [
    // 'CREATE INDEX ON ' + keyspace + '.accounts(name)',
    // 'CREATE INDEX ON ' + keyspace + '.applications(account)',
    // 'CREATE INDEX ON ' + keyspace + '.account_users(username)',
    // 'CREATE INDEX ON ' + keyspace + '.application_tokens(appid)'
  ];

  var helpers = require('./helpers')(client, {
    KEYSPACE: keyspace,
    tables: tables,
    indexes: indexes
  });

  async.series([
    helpers.dropKeyspace,
    helpers.createKeyspace,
    helpers.createTables
  ], function (err, data) {
    /* istanbul ignore if */
    if (err) console.dir(err);
    next();
  });
}

module.exports = setup;
