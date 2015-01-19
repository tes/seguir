
var cassandra = require('cassandra-driver');
var defaultConfiguration = {contactPoints: ['127.0.0.1']};

module.exports = function(config) {
  return new cassandra.Client(config || defaultConfiguration);
};
