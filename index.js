var apiManage = require('./api/manage');
var apiQuery = require('./api/query');
var apiAuth = require('./api/auth');
var urls = require('./api/urls');
var KEYSPACE = 'seguir';

module.exports = function(client, messaging, keyspace) {
  return {
    manage: apiManage(client, messaging),  // Get their keyspace via the request
    query: apiQuery(client, messaging),    // Get their keyspace via the request
    auth: apiAuth(client, messaging, keyspace || KEYSPACE),
    urls: urls
  };
};
