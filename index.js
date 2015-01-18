var client = require('./db/client');
var apiCreate = require('./api/create');
var apiGet = require('./api/get');
var KEYSPACE = 'seguir';

module.exports = {
  create: apiCreate(client, KEYSPACE),
  get: apiGet(client, KEYSPACE)
}
