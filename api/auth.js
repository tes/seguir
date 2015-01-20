var cassandra = require('cassandra-driver');
var async = require('async');
var moment = require('moment');

module.exports = function(client, keyspace) {

  var q = require('../db/queries')(keyspace);
  var query = require('./query')(client, keyspace);

  function checkRequest(applicationToken, userToken, next) {
    next();
  }

  function checkApplication(applicationToken, next) {
    var application = [applicationToken];
    client.execute(q('checkApplication'), application, function(err, result) {
      next(err, {user: userid, username: username});
    });
  }


}
