var pg = require('pg');
var uuid = require('node-uuid');
var debug = require('debug')('seguir:postgres');

function createClient (config, next) {

  var pgConfig = config.postgres;

  function getConnectionString () {
    return 'postgres://' + pgConfig.user + ':' + (pgConfig.password || '') + '@' + (pgConfig.host || 'localhost') + '/' + pgConfig.database;
  }

  function get (query, data, options, next) {
    if (!next) { next = options; options = null; }
    if (!next) { next = data; data = null; }
    pg.connect(getConnectionString(), function (err, client, done) {
      if (err) { return next(err); }
      debug('get', query, data);
      client.query(query, data, function (err, result) {
        if (err) { return next(err); }
        done();
        next(null, result.rows[0]);
      });
    });
  }

  function execute (query, data, options, next) {
    if (!next) { next = options; options = null; }
    if (!next) { next = data; data = null; }
    pg.connect(getConnectionString(), function (err, client, done) {
      if (err) { return next(err); }
      debug('execute', query, data);
      client.query(query, data, function (err, result) {
        if (err) { return next(err); }
        done();
        next(null, result.rows);
      });
    });
  }

  function generateId (suppliedUuid) {
    return uuid.v4();
  }

  function generateTimeId (timestamp) {
    return uuid.v1();
  }

  function isValidId (value) {

  }

  function formatId (value) {

  }

  next(null, {
    type: 'postgres',
    config: pgConfig,
    get: get,
    execute: execute,
    generateId: generateId,
    generateTimeId: generateTimeId,
    isValidId: isValidId,
    formatId: formatId,
    queries: require('./queries'),
    setup: require('./setup')
  });

}

module.exports = createClient;
