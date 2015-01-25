/**
 * Seguir client
 */
var _ = require('lodash');
var restify = require('restify');
var headerNames = require('../api/auth').headerNames;
var u = require('../api/urls');

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
  return _.extend(_.clone(self.headers), liuHeader);
}

/**
 * User Functions
 */
Seguir.prototype.getUser = function(liu, user, next) {
  var self = this;
  self.get(liu, u('getUser', {user:user}), next);
}

Seguir.prototype.getUserByName = function(liu, username, next) {
  var self = this;
  self.get(liu, u('getUserByName', {username:username}), next);
}

Seguir.prototype.addUser = function(liu, username, next) {
  var self = this;
  self.post(liu, u('addUser'), {username: username}, next);
}

Seguir.prototype.getUserRelationship = function(liu, user, next) {
  var self = this;
  self.get(liu, u('getUserRelationship', {user: user}), next);
}

/**
 * Friend Wrapper
 */
Seguir.prototype.addFriend = function(liu, user_friend, timestamp, next) {
  var self = this;
  self.post(liu, u('addFriend'), {user: liu, user_friend: user_friend}, next);
}

Seguir.prototype.getFriends = function(liu, user, next) {
  var self = this;
  self.get(liu, u('getFriends', {user: user}), next);
}

Seguir.prototype.getFriend = function(liu, friend, next) {
  var self = this;
  self.get(liu, u('getFriend', {friend: friend}), next);
}

/**
 * Follow Wrapper
 */
Seguir.prototype.followUser = function(liu, user_to_follow, timestamp, next) {
  var self = this;
  self.post(liu, u('addFollower'), {user: user_to_follow, user_follower: liu}, next);
}

Seguir.prototype.addFollower = function(liu, user_follower, timestamp, next) {
  var self = this;
  self.post(liu, u('addFollower'), {user: liu, user_follower: user_follower}, next);
}

Seguir.prototype.getFollowers = function(liu, user, next) {
  var self = this;
  self.get(liu, u('getFollowers', {user: user}), next);
}

Seguir.prototype.getFollow = function(liu, follow, next) {
  var self = this;
  self.get(liu, u('getFollow', {follow: follow}), next);
}

/**
 * Post Wrapper
 */
Seguir.prototype.addPost = function(liu, content, timestamp, isprivate, next) {
  var self = this;
  self.post(liu, u('addPost'), {user: liu, content: content, timestamp: timestamp, isprivate:isprivate}, next);
}

Seguir.prototype.getPost = function(liu, post, next) {
  var self = this;
  self.get(liu, u('getPost', {post: post}), next);
}


/**
 * Like Wrapper
 */
Seguir.prototype.addLike = function(liu, item, next) {
  var self = this;
  self.post(liu, u('addLike'), {user: liu, item: encodeURIComponent(item) }, next);
}

Seguir.prototype.getLike = function(liu, like, next) {
  var self = this;
  self.get(liu, u('getLike', {like: like}), next);
}

Seguir.prototype.checkLike = function(liu, item, next) {
  var self = this;
  self.get(liu, u('checkLike', {user: liu, item: encodeURIComponent(item) }), next);
}

/**
 * Feed Wrapper
 */
Seguir.prototype.getFeedForUser = function(liu, user, start, limit, next) {
  var self = this;
  self.get(liu, u('getFeed', {user: user}), next);
}

module.exports = Seguir;
