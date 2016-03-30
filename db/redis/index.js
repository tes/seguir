/**
 * Create a redis client
 */

var _ = require('lodash');
var redis = require('redis');

module.exports = function client (config) {
  var redisConfig = _.defaults(config || {}, { host: 'localhost', port: 6379, options: { } });
  var redisClient = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);

  redisClient.on('error', function (err) {
    console.error('Error connecting to redis [%s:%s] - %s', redisConfig.host, redisConfig.port, err.message);
  });

  redisClient.select(redisConfig.db || 0);

  return redisClient;
};
