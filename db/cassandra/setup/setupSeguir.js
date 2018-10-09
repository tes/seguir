/**
 * Sets up the core
 */
const async = require('async');
const schemaVersion = 1;

const setup = (client, keyspace, next) => {
  const tables = [
    'CREATE TABLE ' + keyspace + '.accounts (account uuid, name text, isadmin boolean, enabled boolean, PRIMARY KEY (account))',
    'CREATE TABLE ' + keyspace + '.account_users (account uuid, username text, password text, enabled boolean, PRIMARY KEY (account, username))',
    'CREATE TABLE ' + keyspace + '.applications (appid uuid, name text, appkeyspace text, account uuid, enabled boolean, PRIMARY KEY (appid))',
    'CREATE TABLE ' + keyspace + '.application_tokens (appid uuid, appkeyspace text, tokenid uuid,  tokensecret text, description text, enabled boolean, PRIMARY KEY (tokenid))',
    'CREATE TABLE ' + keyspace + '.schema_version (version varint, applied timestamp, description text, PRIMARY KEY (version, applied)) WITH CLUSTERING ORDER BY (applied DESC)'
  ];

  const indexes = [
    'CREATE INDEX ON ' + keyspace + '.accounts(name)',
    'CREATE INDEX ON ' + keyspace + '.applications(account)',
    'CREATE INDEX ON ' + keyspace + '.account_users(username)',
    'CREATE INDEX ON ' + keyspace + '.application_tokens(appid)'
  ];

  const tableIndexes = [
    'accounts.account',
    'accounts.name',
    'accounts.enabled',
    'accounts.isadmin',
    'account_users.account',
    'account_users.username',
    'account_users.password',
    'account_users.enabled',
    'applications.appid',
    'applications.name',
    'applications.appkeyspace',
    'application_tokens.appid',
    'application_tokens.appkeyspace',
    'application_tokens.tokenid',
    'application_tokens.description',
    'application_tokens.enabled',
    'application_tokens.tokensecret',
    'schema_version.version',
    'schema_version.applied',
    'schema_version.description',
    'applications.account',
    'applications.enabled'
  ];

  const helpers = require('./helpers')(client, {
    KEYSPACE: keyspace,
    tables,
    indexes,
    tableIndexes
  });

  async.series([
    helpers.dropKeyspace,
    helpers.createKeyspace,
    helpers.createTables,
    helpers.createSecondaryIndexes,
    helpers.waitForIndexes,
    async.apply(helpers.initialiseSchemaVersion, schemaVersion)
  ], (err, data) => {
    /* istanbul ignore if */
    if (err) console.dir(err);
    next();
  });
};

module.exports = setup;
