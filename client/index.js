/**
 * Seguir client
 */
var _ = require('lodash');
var restify = require('restify');
var headerNames = require('../api/auth').headerNames;
var authUtils = require('../api/auth/utils');
var u = require('../api/urls');
/**
 * @apiDefine Client Server Side Seguir Client
 * The Seguir client provides a simple and consistent API for interacting with a seguir client
 * without having to worry about authentication or passing the logged in user details.
 *
 * This can only be used server side, as it uses the appId and appSecret which should never be
 * shared within pure client side code.  This client allows you to provide the 'logged in user'
 * which means that you can effectively create any relationship or item you like (even outside of)
 * an actual true user session.
 *
 */

/**
 * @api {config} Options Options
 * @apiName ClientOptions
 * @apiGroup Client
 * @apiVersion 1.0.0
 * @apiDescription Default configuration
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
 *    { isFriend: false,
          isFriendSince: null,
          isFriendRequestPending: false,
          isFriendRequestSince: null,
          youFollow: true,
          youFollowSince: '2015-02-02T06:45:55.459Z',
          theyFollow: false,
          theyFollowSince: null,
          inCommon:
           [ { user: '67528c2a-dd02-45a1-bc00-e240697a2256',
               username: 'ted'} ] }
 */
var defaults = {
  host:'http://localhost:3000'
}

function Seguir(options) {

  var self = this;

  if(!options || !options.appsecret || !options.appid) {
    console.log('You must provide an application secret and application id to initiate a seguir client!');
    return;
  }
  self.appid = options.appid;
  self.appsecret = options.appsecret;

  self.host = options.host || defaults.host;

  var clientConfig = {
    url: self.host,
    version: '*'
  };

  self.client = restify.createJsonClient(clientConfig);
  self.urls = u;

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

Seguir.prototype.del = function(liu, apiPath, next) {
  var self = this;
  self.client.del({path: apiPath, headers: self.getHeaders(liu)}, function(err, req, res, obj) {
    next(err, obj)
  });
}

Seguir.prototype.getHeaders = function(liu) {
  var self = this;
  var headers = authUtils.generateAuthorization(self.appid, self.appsecret);
  if(liu) {
    headers[headerNames.userHeader] = liu;
  }
  return headers;
}

/**
 * User Functions
 */
Seguir.prototype.getUser = function(liu, user, next) {
  var self = this;
  self.get(liu, u('getUser', {user: user}), next);
}

Seguir.prototype.getUserByName = function(liu, username, next) {
  var self = this;
  self.get(liu, u('getUserByName', {username:username}), next);
}

Seguir.prototype.getUserByAltId = function(liu, altid, next) {
  var self = this;
  self.get(liu, u('getUserByAltId', {altid: altid}), next);
}

Seguir.prototype.addUser = function(liu, username, altid, userdata, next) {
  var self = this;
  self.post(liu, u('addUser'), {username: username, altid: altid, userdata: userdata}, next);
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

Seguir.prototype.removeFriend = function(liu, user_friend, next) {
  var self = this;
  self.del(liu, u('removeFriend', {user: liu, user_friend: user_friend}), next);
}

/**
 * Friend Request Wrapper
 */
Seguir.prototype.addFriendRequest = function(liu, user_friend, message, timestamp, next) {
  var self = this;
  self.post(liu, u('addFriendRequest'), {user_friend: user_friend, message: message, timestamp: timestamp}, next);
}

Seguir.prototype.getFriendRequests = function(liu, next) {
  var self = this;
  self.get(liu, u('getFriendRequests'), next);
}

Seguir.prototype.acceptFriendRequest = function(liu, friend_request, next) {
  var self = this;
  self.post(liu, u('acceptFriendRequest'), {friend_request: friend_request}, next);
}

/**
 * Follow Wrapper
 */
Seguir.prototype.followUser = function(liu, user_to_follow, timestamp, next) {
  var self = this;
  self.post(liu, u('addFollower'), {user: user_to_follow, user_follower: liu}, next);
}

Seguir.prototype.unFollowUser = function(liu, user_following, next) {
  var self = this;
  self.del(liu, u('removeFollower', {user: user_following, user_follower: liu}), next);
}

Seguir.prototype.addFollower = function(liu, user_follower, timestamp, isprivate, ispersonal, next) {
  var self = this;
  self.post(liu, u('addFollower'), {user: liu, user_follower: user_follower, isprivate: isprivate, ispersonal: ispersonal}, next);
}

Seguir.prototype.removeFollower = function(liu, user_follower, next) {
  var self = this;
  self.del(liu, u('removeFollower', {user: liu, user_follower: user_follower}), next);
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
Seguir.prototype.addPost = function(liu, content, timestamp, isprivate, ispersonal, next) {
  var self = this;
  self.post(liu, u('addPost'), {user: liu, content: content, timestamp: timestamp, isprivate:isprivate, ispersonal: ispersonal}, next);
}

Seguir.prototype.getPost = function(liu, post, next) {
  var self = this;
  self.get(liu, u('getPost', {post: post}), next);
}

Seguir.prototype.removePost = function(liu, post, next) {
  var self = this;
  self.del(liu, u('removePost', {post: post}), next);
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

Seguir.prototype.removeLike = function(liu, item, next) {
  var self = this;
  self.del(liu, u('removeLike', {user: liu, item: encodeURIComponent(item)}), next);
}

/**
 * Feed Wrapper
 */
Seguir.prototype.getFeedForUser = function(liu, user, start, limit, next) {
  var self = this;
  self.get(liu, u('getFeed', {user: user}), next);
}

/**
 * Feed Wrapper
 */
Seguir.prototype.getUserFeedForUser = function(liu, user, start, limit, next) {
  var self = this;
  self.get(liu, u('getUserFeed', {user: user}), next);
}

module.exports = Seguir;
