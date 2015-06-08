var cassandra = require('cassandra-driver');
var Uuid = cassandra.types.Uuid;
var TimeUuid = cassandra.types.TimeUuid;

var debug = require('debug')('seguir:cassandra');

function createClient (config, next) {

  var cassandraConfig = config && config.cassandra;
  var client = new cassandra.Client(cassandraConfig);
  client.on('log', function (level, className, message, furtherInfo) {
    debug('log event: %s -- %s', level, message);
  });

  function get (query, data, options, next) {
    if (!next) { next = options; options = null; }
    if (!next) { next = data; data = null; }
    client.execute(query, data, options, function (err, result) {
      if (err) { return next(err); }
      next(null, result && result.rows ? result.rows[0] : null);
    });
  }

  function execute (query, data, options, next) {
    if (!next) { next = options; options = null; }
    if (!next) { next = data; data = null; }
    client.execute(query, data, options, function (err, result) {
      if (err) { return next(err); }
      next(null, result && result.rows ? result.rows : null);
    });
  }

  function generateId (uuid) {
    if (uuid) {
      if (isUuid(uuid)) {
        return uuid;
      } else {
        return Uuid.fromString(uuid);
      }
    } else {
      return Uuid.random();
    }
  }

  function generateTimeId (timestamp) {
    if (timestamp) {
      return TimeUuid.fromDate(timestamp);
    } else {
      return TimeUuid.now();
    }
  }

  function isUuid (value) {
    return value instanceof Uuid;
  }

  function isStringUuid (value) {
    return (typeof value === 'string' && value.length === 36 && (value.match(/-/g) || []).length === 4);
  }

  function isValidId (value) {
    return isUuid(value) || isStringUuid(value);
  }

  function formatId (value) {
    if (isUuid(value)) {
      return value;
    } else {
      return generateId(value);
    }
  }

  client.connect(function () {
    next(null, {
      type: 'cassandra',
      config: cassandraConfig,
      _client: client,
      get: get,
      execute: execute,
      generateId: generateId,
      generateTimeId: generateTimeId,
      isValidId: isValidId,
      formatId: formatId,
      queries: require('./queries'),
      setup: require('./setup')
    });
  });

}

module.exports = createClient;
