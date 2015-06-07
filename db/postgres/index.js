function createClient (config) {

  var pgConfig = config.postgres;

  function get (query, data, options, next) {

  }

  function execute (query, data, options, next) {
  }

  function generateId (uuid) {
  }

  function generateTimeId (timestamp) {
  }

  function isValidId (value) {

  }

  function formatId (value) {
  }

  return {
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
  };

}

module.exports = createClient;
