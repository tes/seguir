var client = require('./db/client')();
var apiManage = require('./api/manage');
var apiQuery = require('./api/query');
var apiAuth = require('./api/auth');
var KEYSPACE = 'seguir';

module.exports = {
  manage: apiManage(client, KEYSPACE),
  query: apiQuery(client, KEYSPACE),
  auth: apiAuth(client, KEYSPACE)
}
