
var cassandra = require('cassandra-driver');
var RetryPolicy = cassandra.policies.retry.RetryPolicy;
var defaultConfiguration = {contactPoints: ['127.0.0.1'], options: { retry: new RetryPolicy() }};

var debug = require('debug')('seguir:cassandra');

module.exports = function (config) {
  var cassandraConfig = config && config.cassandra ? config.cassandra : defaultConfiguration;
  var client = new cassandra.Client(cassandraConfig);
  client.on('log', function (level, className, message, furtherInfo) {
    debug('log event: %s -- %s', level, message);
  });
  return client;
};
