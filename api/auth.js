var cassandra = require('cassandra-driver');
var async = require('async');
var moment = require('moment');
var appNameHeader = 'x-seguir-app-name';
var appTokenHeader = 'x-seguir-app-token';
var userHeader = 'x-seguir-user-token';
var anonyomousUser = {user: '_anonymous_', username: 'Not logged in.'}

function Auth(client, keyspace) {

  var q = require('../db/queries')(keyspace);
  var query = require('./query')(client, keyspace);

  /**
   * Checks incoming headers for the application and logged in user tokens.
   */
  function checkRequest(req, res, next) {

    var appToken = req.headers[appTokenHeader],
        appName = req.headers[appNameHeader],
        user = req.headers[userHeader];

    checkApplication(appName, appToken, function(err, applicationOk) {
      if(err) { return res.send(err); }
      if(!applicationOk) { res.send(new Error('You must provide an valid application name and token to access seguir the seguir API.')); }
      checkUser(user, function(err, user) {
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

  function checkUser(user, next) {
    if(!user) {
      return next(null, anonyomousUser);
    }
    client.execute(q('selectUser'), [user], function(err, result) {
      if(err) { return next(err); }
      if(!result || result.rows.length == 0) { return next(new Error('Specified user in header "' + userHeader + '" does not exist.')); }
      next(null, result.rows[0]);
    });
  }

  function addApplication(appName, appToken, next) {
    var app = [appName, appToken];
    client.execute(q('upsertApplication'), app, function(err, result) {
      next(err, {name: appName, apptoken: appToken});
    });
  }

  return {
    addApplication: addApplication,
    checkRequest: checkRequest
  }

}

Auth.headerNames = {
  appNameHeader: appNameHeader,
  appTokenHeader: appTokenHeader,
  userHeader: userHeader
};

module.exports = Auth;

