var client = require('../db/client');
var async = require('async');
var KEYSPACE = 'seguir';
var verbose = false;

function dropKeyspace(next) {
  if(verbose) console.log('Dropping keyspace: ' + KEYSPACE + '...');
  client.execute('DROP KEYSPACE ' + KEYSPACE, function(err) {
    if(err && err.code === 8960) { return next(); }
    return next(err);
  });
}

function createKeyspace(next) {
  if(verbose) console.log('Creating keyspace: ' + KEYSPACE + '...');
  client.execute('CREATE KEYSPACE IF NOT EXISTS ' + KEYSPACE + ' WITH replication ' +
                '= {\'class\' : \'SimpleStrategy\', \'replication_factor\' : 3};', next);
}

function createTables(next) {

  if(verbose) console.log('Creating tables in: ' + KEYSPACE + '...');

  var tables = [
    'CREATE TABLE ' + KEYSPACE + '.applications (application uuid, key text, name text, PRIMARY KEY (application, key))',
    'CREATE TABLE ' + KEYSPACE + '.users (user uuid PRIMARY KEY, username text)',
    'CREATE TABLE ' + KEYSPACE + '.friends (friend uuid, user uuid, user_friend uuid, since timestamp, PRIMARY KEY (user, user_friend))',
    'CREATE TABLE ' + KEYSPACE + '.followers (follow uuid, user uuid, user_follower uuid, since timestamp, PRIMARY KEY (user, user_follower))',
    'CREATE TABLE ' + KEYSPACE + '.likes (like uuid, user uuid, item text, since timestamp, PRIMARY KEY (user, item))',
    'CREATE TABLE ' + KEYSPACE + '.posts (post uuid PRIMARY KEY, user uuid, content text, posted timestamp)',
    'CREATE TABLE ' + KEYSPACE + '.userline (user uuid, time timeuuid, item uuid, type text, PRIMARY KEY (user, time)) WITH CLUSTERING ORDER BY (time DESC)',

  ]

  async.map(tables, function(cql, cb) {
    client.execute(cql, function(err) {
      if(err && (err.code == 9216 || err.code == 8704)) { // Already exists
        return cb();
      }
      return cb(err);
    });
  }, next);

}

function createSecondaryIndexes(next) {

  if(verbose) console.log('Creating secondary indexes in: ' + KEYSPACE + '...');

  var indexes = [
    'CREATE INDEX ON ' + KEYSPACE + '.users(username)',
    'CREATE INDEX ON ' + KEYSPACE + '.posts(user)',
    'CREATE INDEX ON ' + KEYSPACE + '.likes(like)',
    'CREATE INDEX ON ' + KEYSPACE + '.friends(friend)',
    'CREATE INDEX ON ' + KEYSPACE + '.followers(follow)'
  ]

  async.map(indexes, function(cql, cb) {
    client.execute(cql, function(err) {
      if(err && (err.code == 9216 || err.code == 8704)) { // Already exists
        return cb();
      }
      return cb(err);
    });
  }, next);

}

if(require.main === module) {
  verbose = true;
  setup(null, function() {
    console.dir('Setup complete.');
    client.shutdown();
  });
}

function setup(specificKeyspace, next) {

  // Used for test environments
  if(specificKeyspace) { KEYSPACE = specificKeyspace};

  async.series([
    dropKeyspace,
    createKeyspace,
    createTables,
    createSecondaryIndexes
  ], function(err, data) {
    if(err) console.dir(err);
    next();
  });
}

module.exports = setup;
