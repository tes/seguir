var apiManage = require('./api/manage');
var apiQuery = require('./api/query');
var apiAuth = require('./api/auth');
var KEYSPACE = 'seguir';

module.exports = function(client, keyspace) {
  return {
    manage: apiManage(client),  // Get their keyspace via the request
    query: apiQuery(client),    // Get their keyspace via the request
    auth: apiAuth(client, keyspace)
  };
};
