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
 * The Seguir client provides a simple and consistent API for interacting with a seguir server.
 *
 * This can only be used server side, as it uses the appId and appSecret which should never be
 * shared within pure client side code.  This client allows you to provide the 'logged in user'
 * which means that you can effectively create any relationship or item you like (even outside of)
 * an actual true user session - e.g. by system events.
 */

/**
 * @api {config} Options Options
 * @apiName ClientOptions
 * @apiGroup Client
 * @apiVersion 1.0.0
 * @apiDescription Default configuration
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
 *    { appid: '12345',
 *      appsecret: '12345',
 *      host: 'http://seguir.server.com',
      }
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
 * @apiDefine Users Users
 * This is a collection of methods that allow you to create and retrieve users.
 */

/**
 * @api {function} getUser(liu,user,next) getUser
 * @apiName getUser
 * @apiGroup Users
 * @apiVersion 1.0.0
 *
 * @apiDescription Get a user details
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user the id of the user
 * @apiParam {Function} next callback
 */
Seguir.prototype.getUser = function(liu, user, next) {
  var self = this;
  self.get(liu, u('getUser', {user: '' + user}), next);
}

/**
 * @api {function} getUserByName(liu,username,next) getUserByName
 * @apiName getUserByName
 * @apiGroup Users
 * @apiVersion 1.0.0
 *
 * @apiDescription Get a user details
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} username the username of the user
 * @apiParam {Function} next callback
 */
Seguir.prototype.getUserByName = function(liu, username, next) {
  var self = this;
  self.get(liu, u('getUserByName', {username:username}), next);
}

/**
 * @api {function} getUserByAltId(liu,altid,next) getUserByAltId
 * @apiName getUserByAltId
 * @apiGroup Users
 * @apiVersion 1.0.0
 *
 * @apiDescription Get a user details
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} altid the altid of the user
 * @apiParam {Function} next callback
 */
Seguir.prototype.getUserByAltId = function(liu, altid, next) {
  var self = this;
  self.get(liu, u('getUserByAltId', {altid: altid}), next);
}

/**
 * @api {function} addUser(liu,username,altid,userdata,next) addUser
 * @apiName addUser
 * @apiGroup Users
 * @apiVersion 1.0.0
 *
 * @apiDescription Creates a new user.
 * @apiParam {String} liu the id of the current logged in user [not used]
 * @apiParam {String} username the username
 * @apiParam {String} altid the local / alternate id
 * @apiParam {Object} userdata arbitrary user data (one level of key values only)
 * @apiParam {Function} next callback
 */
Seguir.prototype.addUser = function(liu, username, altid, userdata, next) {
  var self = this;
  self.post(liu, u('addUser'), {username: username, altid: altid, userdata: userdata}, next);
}

/**
 * @api {function} getUserRelationship(liu,user,next) getUserRelationship
 * @apiName getUserRelationship
 * @apiGroup Users
 * @apiVersion 1.0.0
 *
 * @apiDescription Get a user details
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user the id of the user
 * @apiParam {Function} next callback
 */
Seguir.prototype.getUserRelationship = function(liu, user, next) {
  var self = this;
  self.get(liu, u('getUserRelationship', {user: user}), next);
}

/**
 * @apiDefine Friends Friends
 * This is a collection of methods that allow you to manage the friend request process.
 */

/**
 * @api {function} addFriend(liu,user_friend,timestamp,next) addFriend
 * @apiName addFriend
 * @apiGroup Friends
 * @apiVersion 1.0.0
 *
 * @apiDescription Add a friend directly
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user_friend the id of the user to become friends with
 * @apiParam {Number} timestamp when the relationship began - Date.now()
 * @apiParam {Function} next callback
 */
Seguir.prototype.addFriend = function(liu, user_friend, timestamp, next) {
  var self = this;
  self.post(liu, u('addFriend'), {user: liu, user_friend: user_friend, timestamp: timestamp}, next);
}

/**
 * @api {function} getFriends(liu,user,next) getFriends
 * @apiName getFriends
 * @apiGroup Friends
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve a list of friends for a specific user
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user the id of the user to get the list of friends for
 * @apiParam {Function} next callback
 */
Seguir.prototype.getFriends = function(liu, user, next) {
  var self = this;
  self.get(liu, u('getFriends', {user: user}), next);
}

/**
 * @api {function} getFriend(liu,friend,next) getFriend
 * @apiName getFriend
 * @apiGroup Friends
 * @apiVersion 1.0.0
 *
 * @apiDescription Get details of a specific friendship
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} friend the id of the friend relationship
 * @apiParam {Function} next callback
 */
Seguir.prototype.getFriend = function(liu, friend, next) {
  var self = this;
  self.get(liu, u('getFriend', {friend: friend}), next);
}

/**
 * @api {function} removeFriend(liu,user_friend,next) removeFriend
 * @apiName removeFriend
 * @apiGroup Friends
 * @apiVersion 1.0.0
 *
 * @apiDescription End a friendship
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user_friend the id of the user to stop being friends with
 * @apiParam {Function} next callback
 */
Seguir.prototype.removeFriend = function(liu, user_friend, next) {
  var self = this;
  self.del(liu, u('removeFriend', {user: liu, user_friend: user_friend}), next);
}

/**
 * @api {function} addFriendRequest(liu,user_friend,message,timestamp,next) addFriendRequest
 * @apiName addFriendRequest
 * @apiGroup Friends
 * @apiVersion 1.0.0
 *
 * @apiDescription Create a friend request with message
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user_friend the id of the user to send a friend request to
 * @apiParam {String} message a message to leave with the request
 * @apiParam {Timestamp} timestamp time to leave the request
 * @apiParam {Function} next callback
 */
Seguir.prototype.addFriendRequest = function(liu, user_friend, message, timestamp, next) {
  var self = this;
  self.post(liu, u('addFriendRequest'), {user_friend: user_friend, message: message, timestamp: timestamp}, next);
}

/**
 * @api {function} getFriendRequests(liu,next) getFriendRequests
 * @apiName getFriendRequests
 * @apiGroup Friends
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve pending friend requests for the current logged in user
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {Function} next callback
 */
Seguir.prototype.getFriendRequests = function(liu, next) {
  var self = this;
  self.get(liu, u('getFriendRequests'), next);
}

/**
 * @api {function} acceptFriendRequest(liu,friend_request,next) acceptFriendRequest
 * @apiName acceptFriendRequest
 * @apiGroup Friends
 * @apiVersion 1.0.0
 *
 * @apiDescription Create a friend request with message
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} friend_request the id of friend request to accept
 * @apiParam {Function} next callback
 */
Seguir.prototype.acceptFriendRequest = function(liu, friend_request, next) {
  var self = this;
  self.post(liu, u('acceptFriendRequest'), {friend_request: friend_request}, next);
}


/**
 * @apiDefine Following Following
 * This is a collection of methods that allow you to manage follow relationships.
 */

/**
 * @api {function} followUser(liu,user_to_follow,timestamp,isprivate,ispersonal,next) followUser
 * @apiName followUser
 * @apiGroup Following
 * @apiVersion 1.0.0
 *
 * @apiDescription Follow a user
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user_to_follow the id of the user to follow
 * @apiParam {Timestamp} timestamp time to leave the request
 * @apiParam {Boolean} isprivate is this visible only to friends
 * @apiParam {Boolean} ispersonal is this visible only to the user
 * @apiParam {Function} next callback
 */
Seguir.prototype.followUser = function(liu, user_to_follow, timestamp, isprivate, ispersonal,  next) {
  var self = this;
  self.post(liu, u('addFollower'), {user: user_to_follow, user_follower: liu, isprivate: isprivate, ispersonal: ispersonal}, next);
}

/**
 * @api {function} unFollowUser(liu,user_following,timestamp,next) unFollowUser
 * @apiName unFollowUser
 * @apiGroup Following
 * @apiVersion 1.0.0
 *
 * @apiDescription Stop following a user
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user_following the id of follow relationship
 * @apiParam {Function} next callback
 */
Seguir.prototype.unFollowUser = function(liu, user_following, next) {
  var self = this;
  self.del(liu, u('removeFollower', {user: user_following, user_follower: liu}), next);
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
