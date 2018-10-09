/**
 * Create a redis client
 */
const _ = require('lodash');
const redis = require('redis');

module.exports = config => {
  const redisConfig = _.defaults(config || {}, { host: 'localhost', port: 6379, options: {} });
  const redisClient = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);

  redisClient.on('error', err => {
    console.error('Error connecting to redis [%s:%s] - %s', redisConfig.host, redisConfig.port, err.message);
  });

  redisClient.select(redisConfig.db || 0);

  return redisClient;
};
