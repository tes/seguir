
var cassandra = require('cassandra-driver');
var defaultConfiguration = {contactPoints: ['127.0.0.1']};

module.exports = function (config) {
  var cassandraConfig = config && config.cassandra ? config.cassandra : defaultConfiguration;
  return new cassandra.Client(cassandraConfig);
};
