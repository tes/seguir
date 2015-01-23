var apiManage = require('./api/manage');
var apiQuery = require('./api/query');
var apiAuth = require('./api/auth');
var KEYSPACE = 'seguir';

module.exports = function(client, keyspace) {
  KEYSPACE = keyspace || KEYSPACE;
  return {
    manage: apiManage(client, KEYSPACE),
    query: apiQuery(client, KEYSPACE),
    auth: apiAuth(client, KEYSPACE)
  }
}
