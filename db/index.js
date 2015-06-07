var debug = require('debug')('seguir:client');

module.exports = function (config, next) {

  var clientType;

  if (config.cassandra) clientType = 'cassandra';
  if (!clientType && config.postgres) clientType = 'postgres';
  if (!clientType) {
    return next(new Error('No storage configuration provided, you must provide a cassandra or postgres key - terminating.'));
  }

  debug('Using %s', clientType);
  require('./' + clientType)(config, next);

};
