/**
 * Seguir client
 */

var _ = require('lodash');
var restify = require('restify');
var headerNames = require('../api/auth').headerNames;

var defaults = {
  host:'http://localhost:3000'
}

function Seguir(options) {

  var self = this;

  if(!options || !options.appToken || !options.appName) {
    console.log('You must provide an application key and application name to initiate a seguir client!');
    return;
  }
  self.appToken = options.appToken;
  self.appName = options.appName;
  self.host = options.host || defaults.host;

  var clientConfig = {
    url: self.host,
    version: '*'
  };

  self.headers = {};
  self.headers[headerNames.appNameHeader] = self.appName;
  self.headers[headerNames.appTokenHeader] = self.appToken;

  self.client = restify.createJsonClient(clientConfig);

}

/**
 * Helper functions
 */
Seguir.prototype.get = function(liu, apiPath, next) {
  var self = this;
  self.client.get({path: apiPath, headers: self.getHeaders(liu)}, function(err, req, res, obj) {
    next(err, obj)
  });
}

Seguir.prototype.post = function(liu, apiPath, data, next) {
  var self = this;
  self.client.post({path: apiPath, headers: self.getHeaders(liu)}, data, function(err, req, res, obj) {
    next(err, obj)
  });
}

Seguir.prototype.delete = function(liu, apiPath, next) {
  var self = this;
  self.client.del({path: apiPath, headers: self.getHeaders(liu)}, function(err, req, res, obj) {
    next(err, obj)
  });
}

Seguir.prototype.getHeaders = function(liu) {
  var self = this;
  var liuHeader = {};
  if(liu) {
    liuHeader[headerNames.userHeader] = liu;
  }
  return _.extend(self.headers, liuHeader);
}

/**
 * User Functions
 */
Seguir.prototype.getUser = function(liu, user, next) {
  var self = this;
  self.get(liu, '/user/' + user, next);
}

Seguir.prototype.getUserById = function(liu, userId, next) {
  var self = this;
  self.get(liu, '/user/id/' + userId, next);
}

Seguir.prototype.addUser = function(liu, username, next) {
  var self = this;
  self.post(liu, '/user', {username: username}, next);
}

/**
 * Friend Wrapper
 */
Seguir.prototype.addFriend = function(liu, user_friend, timestamp, next) {
  var self = this;
  self.post(liu, '/friend', {user: liu, user_friend: user_friend}, next);
}


module.exports = Seguir;
