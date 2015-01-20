var client = require('./db/client')();
var apiManage = require('./api/manage');
var apiQuery = require('./api/query');
var apiAuth = require('./api/auth');
var KEYSPACE = 'seguir';

module.exports = {
  manage: apiCreate(client, KEYSPACE),
  query: apiGet(client, KEYSPACE),
  auth: apiAuth(client, KEYSPACE)
}
