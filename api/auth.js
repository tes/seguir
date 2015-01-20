var cassandra = require('cassandra-driver');
var async = require('async');
var moment = require('moment');
var appNameHeader = 'x-seguir-app-name';
var appTokenHeader = 'x-seguir-app-token';
var userTokenHeader = 'x-seguir-user-token';
var anonyomousUser = {user: '_anonymous_', username: 'Not logged in.'}

module.exports = function(client, keyspace) {

  var q = require('../db/queries')(keyspace);
  var query = require('./query')(client, keyspace);

  /**
   * Checks incoming headers for the application and logged in user tokens.
   */
  function checkRequest(req, res, next) {

    var appToken = req.headers[appTokenHeader],
        appName = req.headers[appNameHeader],
        userToken = req.headers[userTokenHeader];

    checkApplication(appName, appToken, function(err, applicationOk) {
      if(err) { return res.send(err); }
      if(!applicationOk) { res.send(new Error('You must provide an valid application name and token to access seguir the seguir API.')); }
      checkUser(userToken, function(err, user) {
        if(err) { return res.send(err); }
        req.liu = user;
        next();
      });
    });

  }

  function checkApplication(appName, appToken, next) {
    if(!appName) {
      return next(new Error('You must provide an application name via the header "' + appNameHeader + '" to access seguir the seguir API.'));
    }
    if(!appToken) {
      return next(new Error('You must provide an application token via the header "' + appTokenHeader + '" to access seguir the seguir API.'));
    }
    var application = [appName, appToken];
    client.execute(q('checkApplication'), application, function(err, result) {
      next(err, result && result.rows.length > 0);
    });
  }

  function checkUser(userToken, next) {
    if(!userToken) {
      return next(null, anonyomousUser);
    }
    client.execute(q('selectUser'), [userToken], function(err, result) {
      if(err) { return next(err); }
      if(!result || result.rows.length == 0) { return next(new Error('Specified user in header "' + userTokenHeader + '" does not exist.')); }
      next(null, result.rows[0]);
    });
  }

  return {
    checkRequest: checkRequest
  }

}
