/**
 * Seguir client
 */
var restify = require('restify');
var headerNames = require('../api/auth').headerNames;
var authUtils = require('../api/auth/utils');
var u = require('../api/urls');
var v = require('../api/visibility');
var debug = require('debug')('seguir:client');

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
 *    {
 *      appid: '12345',
 *      appsecret: '12345',
 *      host: 'http://seguir.server.com',
      }
 */
var defaults = {
  host: 'http://localhost:3000',
  rootpath: ''
};

function Seguir (options) {

  var self = this;

  if (!options || !options.appsecret || !options.appid) {
    console.log('You must provide an application secret and application id to initiate a seguir client!');
    return;
  }
  self.appid = options.appid;
  self.appsecret = options.appsecret;
  self.authtype = options.authtype || 'SeguirToken';

  self.host = options.host || defaults.host;
  self.rootpath = options.rootpath || defaults.rootpath;

  var clientConfig = {
    url: self.host,
    version: '*'
  };

  self.client = restify.createJsonClient(clientConfig);
  self.urls = u;
  self.visibility = v;

  debug('Initialised seguir client with options', options);

}

/**
 * Helper functions
 */
Seguir.prototype.get = function (liu, apiPath, next) {
  var self = this;
  debug('GET ' + apiPath, liu);
  self.client.get({path: self.rootpath + apiPath, headers: self.getHeaders(liu)}, function (err, req, res, obj) {
    next(err, obj);
  });
};

Seguir.prototype.post = function (liu, apiPath, data, next) {
  var self = this;
  debug('POST ' + apiPath, liu, data);
  self.client.post({path: self.rootpath + apiPath, headers: self.getHeaders(liu)}, data, function (err, req, res, obj) {
    next(err, obj);
  });
};

Seguir.prototype.del = function (liu, apiPath, next) {
  var self = this;
  debug('DEL ' + apiPath, liu);
  self.client.del({path: self.rootpath + apiPath, headers: self.getHeaders(liu)}, function (err, req, res, obj) {
    next(err, obj);
  });
};

Seguir.prototype.getHeaders = function (liu) {
  var self = this;
  var headers = authUtils.generateAuthorization(self.appid, self.appsecret, self.authtype);
  if (liu) {
    headers[headerNames.userHeader] = liu;
  }
  return headers;
};

Seguir.prototype.status = function (next) {
  var self = this;
  self.get(null, '/status', next);
};

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
 * @apiDescription Retrieve a users details by seguir ID
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user the id of the user
 * @apiParam {Function} next callback
 *
 * @apiUse getUserSuccessExample
 */
Seguir.prototype.getUser = function (liu, user, next) {
  var self = this;
  self.get(liu, u('getUser', {user: '' + user}), next);
};

/**
 * @api {function} getUserByName(liu,username,next) getUserByName
 * @apiName getUserByName
 * @apiGroup Users
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve a users details by username
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} username the username of the user
 * @apiParam {Function} next callback
 * @apiUse getUserByNameSuccessExample
 */
Seguir.prototype.getUserByName = function (liu, username, next) {
  var self = this;
  self.get(liu, u('getUserByName', {username: username}), next);
};

/**
 * @api {function} getUserByAltId(liu,altid,next) getUserByAltId
 * @apiName getUserByAltId
 * @apiGroup Users
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve a user details by alternate id
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} altid the altid of the user
 * @apiParam {Function} next callback
 * @apiUse getUserByAltIdSuccessExample
 */
Seguir.prototype.getUserByAltId = function (liu, altid, next) {
  var self = this;
  self.get(liu, u('getUserByAltId', {altid: altid}), next);
};

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
 * @apiParam {Object} initialise optional data structure that allows you to initialise a user in seguir
 * @apiParam {String} userid optional uuid that will be used for the user's id if provided
 * @apiParam {Function} next callback
 * @apiParamExample {json} userdata-example
{
  avatar: '/image/1.jpg',
  fullName: 'Clifton Cunningham'
}
 *
 * @apiParamExample {json} initialise-example
{
  follow: {
    users: ['bob', 'cliftonc'],
    backfill: '1d',
    visibility: 'personal'
  }
}
 *
 * @apiUse addUserSuccessExample
 */
Seguir.prototype.addUser = function (liu, username, altid, userdata, options, next) {
  var self = this;
  if (!next) { next = options; options = {}; }
  self.post(liu, u('addUser'), {username: username, altid: altid, userdata: userdata, initialise: options.initialise, userid: options.userid}, next);
};

/**
 * @api {function} updateUser(liu,username,altid,userdata,next) updateUser
 * @apiName updateUser
 * @apiGroup Users
 * @apiVersion 1.0.0
 *
 * @apiDescription Updates an existing user.
 * @apiParam {String} liu the id of the current logged in user [not used]
 * @apiParam {String} username the username
 * @apiParam {String} altid the local / alternate id
 * @apiParam {Object} userdata arbitrary user data (one level of key values only)
 * @apiParam {Function} next callback
 *
 * @apiUse updateUserSuccessExample
 */
Seguir.prototype.updateUser = function (liu, user, username, altid, userdata, next) {
  var self = this;
  self.post(liu, u('updateUser', {user: user}), {username: username, altid: altid, userdata: userdata}, next);
};

/**
 * @api {function} getUserRelationship(liu,user,next) getUserRelationship
 * @apiName getUserRelationship
 * @apiGroup Users
 * @apiVersion 1.0.0
 *
 * @apiDescription Get details of a relationship between two users
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user the id of the user
 * @apiParam {Function} next callback
 * @apiUse getUserRelationshipSuccessExample
 */
Seguir.prototype.getUserRelationship = function (liu, user, next) {
  var self = this;
  self.get(liu, u('getUserRelationship', {user: user}), next);
};

/**
 * @apiDefine Friends Friends
 * This is a collection of methods that allow you to manage the friend request process.
 */

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
 * @apiUse getFriendsSuccessExample
 */
Seguir.prototype.getFriends = function (liu, user, next) {
  var self = this;
  self.get(liu, u('getFriends', {user: user}), next);
};

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
 * @apiUse getFriendSuccessExample
 */
Seguir.prototype.getFriend = function (liu, friend, next) {
  var self = this;
  self.get(liu, u('getFriend', {friend: friend}), next);
};

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
 * @apiUse removeFriendSuccessExample
 */
Seguir.prototype.removeFriend = function (liu, user_friend, next) {
  var self = this;
  self.del(liu, u('removeFriend', {user: liu, user_friend: user_friend}), next);
};

/**
 * @apiDefine FriendRequests FriendRequests
 * This is a collection of methods that allow you to manage the friend request process.
 */

/**
 * @api {function} addFriendRequest(liu,user_friend,message,next) addFriendRequest
 * @apiName addFriendRequest
 * @apiGroup FriendRequests
 * @apiVersion 1.0.0
 *
 * @apiDescription Create a friend request with message
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user_friend the id of the user to send a friend request to
 * @apiParam {String} message a message to leave with the request
 * @apiParam {Function} next callback
 * @apiUse addFriendRequestSuccessExample
 */
Seguir.prototype.addFriendRequest = function (liu, user_friend, message, next) {
  var self = this;
  self.post(liu, u('addFriendRequest'), {user_friend: user_friend, message: message}, next);
};

/**
 * @api {function} getFriendRequests(liu,next) getFriendRequests
 * @apiName getFriendRequests
 * @apiGroup FriendRequests
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve pending friend requests for the current logged in user
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {Function} next callback
 * @apiUse getFriendRequestsSuccessExample
 */
Seguir.prototype.getFriendRequests = function (liu, next) {
  var self = this;
  self.get(liu, u('getFriendRequests'), next);
};

/**
 * @api {function} acceptFriendRequest(liu,friend_request,next) acceptFriendRequest
 * @apiName acceptFriendRequest
 * @apiGroup FriendRequests
 * @apiVersion 1.0.0
 *
 * @apiDescription Create a friend request with message
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} friend_request the id of friend request to accept
 * @apiParam {Function} next callback
 * @apiUse acceptFriendRequestSuccessExample
 */
Seguir.prototype.acceptFriendRequest = function (liu, friend_request, next) {
  var self = this;
  self.post(liu, u('acceptFriendRequest'), {friend_request: friend_request}, next);
};

/**
 * @apiDefine Following Following
 * This is a collection of methods that allow you to manage follow relationships.
 */

/**
 * @api {function} followUser(liu,user_to_follow,visibility,backfill,next) followUser
 * @apiName followUser
 * @apiGroup Following
 * @apiVersion 1.0.0
 *
 * @apiDescription Follow a user
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user_to_follow the id of the user to follow
 * @apiParam {String} visibility visibility level
 * @apiParam {String} backfill amount of time to backfill posts from the followed users direct feed - use moment duration format e.g. '1d'
 * @apiParam {Function} next callback
 * @apiUse followUserSuccessExample
 */
Seguir.prototype.followUser = function (liu, user_to_follow, visibility, backfill, next) {
  var self = this;
  if (!next) { next = backfill; backfill = null; }
  self.post(liu, u('addFollower'), {user: user_to_follow, user_follower: liu, visibility: visibility, backfill: backfill}, next);
};

/**
 * @api {function} unFollowUser(liu,user_following,next) unFollowUser
 * @apiName unFollowUser
 * @apiGroup Following
 * @apiVersion 1.0.0
 *
 * @apiDescription Stop following a user
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user_following the id of follow relationship
 * @apiParam {Function} next callback
 * @apiUse unFollowUserSuccessExample
 */
Seguir.prototype.unFollowUser = function (liu, user_following, next) {
  var self = this;
  self.del(liu, u('removeFollower', {user: user_following, user_follower: liu}), next);
};

/**
 * @api {function} removeFollower(liu,user_follower,next) removeFollower
 * @apiName removeFollower
 * @apiGroup Following
 * @apiVersion 1.0.0
 *
 * @apiDescription Stop following a user
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user_follower the id of user to remove as a follower
 * @apiParam {Function} next callback
 * @apiUse unFollowUserSuccessExample
 */
Seguir.prototype.removeFollower = function (liu, user_follower, next) {
  var self = this;
  self.del(liu, u('removeFollower', {user: liu, user_follower: user_follower}), next);
};

/**
 * @api {function} getFollowers(liu,user,next) getFollowers
 * @apiName getFollowers
 * @apiGroup Following
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve a list of followers for a user
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user the id of user to retrieve followers for
 * @apiParam {Function} next callback
 * @apiUse getFollowersSuccessExample
 */
Seguir.prototype.getFollowers = function (liu, user, next) {
  var self = this;
  self.get(liu, u('getFollowers', {user: user}), next);
};

/**
 * @api {function} getFollow(liu,follow,next) getFollow
 * @apiName getFollow
 * @apiGroup Following
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve details of a specific follow relationship
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} follow the id of the follow relationship
 * @apiParam {Function} next callback
 * @apiUse getFollowSuccessExample
 */
Seguir.prototype.getFollow = function (liu, follow, next) {
  var self = this;
  self.get(liu, u('getFollow', {follow: follow}), next);
};

/**
 * @apiDefine Posts Posts
 * This is a collection of methods that allow you to create posts on the logged in users feed.
 */

/**
 * @api {function} addPost(liu,content,posted,visibility,next) addPost
 * @apiName addPost
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiDescription Create a new post on a users news feed
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} content the content of the post
 * @apiParam {String} content_type the content contained in content, use application/json for json data
 * @apiParam {Timestamp} posted the timestamp the post should appear to be created - use Date.now() for now
 * @apiParam {String} visibility visibility level
 * @apiParam {String} altid optional altid
 * @apiParam {Function} next callback
 * @apiUse addPostSuccessExample
 */
Seguir.prototype.addPost = function (liu, content, content_type, posted, visibility, altid, next) {
  var self = this;
  if (!next) { next = altid; altid = null; }
  self.post(liu, u('addPost'), {user: liu, content: content, content_type: content_type, posted: posted, visibility: visibility, altid: altid}, next);
};

/**
 * @api {function} updatePost(liu,post,content,content_type,visibility,next) updatePost
 * @apiName updatePost
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiDescription Update content of specific post
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {Guid} post the id of the post to update
 * @apiParam {String} content the content of the post
 * @apiParam {String} content_type the content contained in content, use application/json for json data
 * @apiParam {String} visibility visibility level
 * @apiParam {Function} next callback
 * @apiUse getPostSuccessExample
 */
Seguir.prototype.updatePost = function (liu, post, content, content_type, visibility, next) {
  var self = this;
  self.post(liu, u('updatePost', {post: post}), {content: content, content_type: content_type, visibility: visibility}, next);
};

/**
 * @api {function} updatePostByAltid(liu,altid,content,content_type,visibility,next) updatePostByAltid
 * @apiName updatePostByAltid
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiDescription Update content of specific post by altid
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} altid the id of the post to update
 * @apiParam {String} content the content of the post
 * @apiParam {String} content_type the content contained in content, use application/json for json data
 * @apiParam {String} visibility visibility level
 * @apiParam {Function} next callback
 * @apiUse getPostSuccessExample
 */
Seguir.prototype.updatePostByAltid = function (liu, altid, content, content_type, visibility, next) {
  var self = this;
  self.post(liu, u('updatePostByAltid', {altid: altid}), {content: content, content_type: content_type, visibility: visibility}, next);
};

/**
 * @api {function} getPost(liu,post,next) getPost
 * @apiName getPost
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve details of a specific post
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} post the id of the post to retrieve
 * @apiParam {Function} next callback
 * @apiUse getPostSuccessExample
 */
Seguir.prototype.getPost = function (liu, post, next) {
  var self = this;
  self.get(liu, u('getPost', {post: post}), next);
};

/**
 * @api {function} getPostByAltid(liu,altid,next) getPostByAltid
 * @apiName getPostByAltid
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve details of a specific post by altid
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} altid the altid of the post to retrieve
 * @apiParam {Function} next callback
 * @apiUse getPostSuccessExample
 */
Seguir.prototype.getPostByAltid = function (liu, altid, next) {
  var self = this;
  self.get(liu, u('getPostByAltid', {altid: altid}), next);
};

/**
 * @api {function} removePost(liu,post,next) removePost
 * @apiName removePost
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiDescription Remove a specific post from your newsfeed
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} post the id of the post to remove
 * @apiParam {Function} next callback
 * @apiUse removePostSuccessExample
 */
Seguir.prototype.removePost = function (liu, post, next) {
  var self = this;
  self.del(liu, u('removePost', {post: post}), next);
};

/**
 * @api {function} removePostByAltid(liu,altid,next) removePostByAltid
 * @apiName removePostByAltid
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiDescription Remove a specific post from your newsfeed
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} altid the altid of the post to remove
 * @apiParam {Function} next callback
 * @apiUse removePostSuccessExample
 */
Seguir.prototype.removePostByAltid = function (liu, altid, next) {
  var self = this;
  self.del(liu, u('removePostByAltid', {altid: altid}), next);
};

/**
 * @apiDefine Likes Likes
 * This is a collection of methods that allow you to signal that you like a specific URL.
 */

/**
 * @api {function} addLike(liu,item,next) addLike
 * @apiName addLike
 * @apiGroup Likes
 * @apiVersion 1.0.0
 *
 * @apiDescription Signal that you like a specific URL
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} item the url of the page to like
 * @apiParam {Function} next callback
 * @apiUse addLikeSuccessExample
 */
Seguir.prototype.addLike = function (liu, item, next) {
  var self = this;
  self.post(liu, u('addLike'), {user: liu, item: encodeURIComponent(item) }, next);
};

/**
 * @api {function} getLike(liu,like,next) getLike
 * @apiName getLike
 * @apiGroup Likes
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve details of a specific like item by id
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} like the id of the like that you want to retrieve details for
 * @apiParam {Function} next callback
 * @apiUse getLikeSuccessExample
 */
Seguir.prototype.getLike = function (liu, like, next) {
  var self = this;
  self.get(liu, u('getLike', {like: like}), next);
};

/**
 * @api {function} checkLike(liu,item,next) checkLike
 * @apiName checkLike
 * @apiGroup Likes
 * @apiVersion 1.0.0
 *
 * @apiDescription Check if the user likes a specific URL
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} item the url to check if the user likes
 * @apiParam {Function} next callback
 * @apiUse checkLikeSuccessExample
 */
Seguir.prototype.checkLike = function (liu, item, next) {
  var self = this;
  self.get(liu, u('checkLike', {user: liu, item: encodeURIComponent(item) }), next);
};

/**
 * @api {function} removeLike(liu,item,next) removeLike
 * @apiName removeLike
 * @apiGroup Likes
 * @apiVersion 1.0.0
 *
 * @apiDescription Check if the user likes a specific URL
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} item the url to remove the like for
 * @apiParam {Function} next callback
 * @apiUse removeLikeSuccessExample
 */
Seguir.prototype.removeLike = function (liu, item, next) {
  var self = this;
  self.del(liu, u('removeLike', {user: liu, item: encodeURIComponent(item)}), next);
};

/**
 * @apiDefine Feeds Feeds
 * This is a collection of methods that allow you to retrieve the newsfeed for a specific user.
 */

/**
 * @api {function} getFeed(liu,user,start,limit,next) getFeed
 * @apiName getFeedForUser
 * @apiGroup Feeds
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve the aggregated newsfeed for a specific user.
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user the user to retrieve the feed for
 * @apiParam {Number} start pagination - item to start at
 * @apiParam {Number} limit pagination - number of items to show
 * @apiParam {Function} next callback
 * @apiUse getFeedSuccessExample
 */
Seguir.prototype.getFeed = function (liu, user, start, limit, next) {
  var self = this;
  var query = [start ? 'start=' + start : null, limit ? 'limit=' + limit : null ].join('&');
  self.get(liu, u('getFeed', {user: user, query: query}), next);
};

/**
 * @api {function} getUserFeed(liu,user,start,limit,next) getUserFeed
 * @apiName getUserFeedForUser
 * @apiGroup Feeds
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve the direct newsfeed for a specific user, can be shown on their profile.
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user the user to retrieve the feed for
 * @apiParam {Number} start pagination - item to start at
 * @apiParam {Number} limit pagination - number of items to show
 * @apiParam {Function} next callback
 * @apiUse getUserFeedSuccessExample
 */
Seguir.prototype.getUserFeed = function (liu, user, start, limit, next) {
  var self = this;
  var query = [start ? 'start=' + start : null, limit ? 'limit=' + limit : null ].join('&');
  self.get(liu, u('getUserFeed', {user: user, query: query}), next);
};

module.exports = Seguir;

// MARKER: Samples
/**
 * @apiDefine addUserSuccessExample
 * @apiSuccessExample
addUser result
{
  "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
  "username": "cliftonc",
  "altid": "1",
  "userdata": {
    "avatar": "test.jpg"
  }
}
 */
/**
 * @apiDefine getUserSuccessExample
 * @apiSuccessExample
getUser result
{
  "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
  "username": "cliftonc",
  "altid": "1",
  "userdata": {
    "avatar": "test.jpg"
  }
}
 */
/**
 * @apiDefine getUserByNameSuccessExample
 * @apiSuccessExample
getUserByName result
{
  "user": "7dca1508-ac01-4467-98f9-c107cd50ab32",
  "username": "evil &user <alert>name</alert>",
  "altid": "9",
  "userdata": {
    "avatar": "test.jpg"
  }
}
 */
/**
 * @apiDefine getUserByAltIdSuccessExample
 * @apiSuccessExample
getUserByAltId result
{
  "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
  "username": "cliftonc",
  "altid": "1",
  "userdata": {
    "avatar": "test.jpg"
  }
}
 */
/**
 * @apiDefine updateUserSuccessExample
 * @apiSuccessExample
updateUser result
{
  "user": "be053229-4460-4296-b5ec-1190fe770615",
  "username": "new_name",
  "altid": "new_altid",
  "userdata": {
    "hello": "world"
  }
}
 */
/**
 * @apiDefine addFriendRequestSuccessExample
 * @apiSuccessExample
addFriendRequest result
{
  "friend_request": "f42e1e37-09c0-4315-b64f-5f3637a9e94e",
  "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
  "user_friend": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
  "message": "Please be my friend",
  "since": "2015-07-14T12:52:13.607Z",
  "visibility": "private"
}
 */
/**
 * @apiDefine getFriendRequestsSuccessExample
 * @apiSuccessExample
getFriendRequests result
{
  "incoming": [],
  "outgoing": [
    {
      "friend_request": "f42e1e37-09c0-4315-b64f-5f3637a9e94e",
      "user": {
        "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_friend": {
        "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
        "username": "phteven",
        "altid": "2",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "message": "Please be my friend",
      "since": "2015-07-14T12:52:13.607Z",
      "visibility": "private"
    }
  ]
}
 */
/**
 * @apiDefine acceptFriendRequestSuccessExample
 * @apiSuccessExample
acceptFriendRequest result
{
  "friend": "c917cad2-3359-4d15-aa04-98f03af9c5bb",
  "reciprocal": "905d0d26-e888-4027-866d-1d849992dbcf",
  "user": {
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "user_friend": {
    "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
    "username": "phteven",
    "altid": "2",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-14T12:52:13.662Z"
}
 */
/**
 * @apiDefine getFriendSuccessExample
 * @apiSuccessExample
getFriend result
{
  "friend": "c917cad2-3359-4d15-aa04-98f03af9c5bb",
  "user": {
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "user_friend": {
    "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
    "username": "phteven",
    "altid": "2",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-14T12:52:13.662Z",
  "visibility": "private"
}
 */
/**
 * @apiDefine getFriendsSuccessExample
 * @apiSuccessExample
getFriends result
[
  {
    "user_friend": {
      "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
      "username": "phteven",
      "altid": "2",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "since": "2015-07-14T12:52:13.662Z"
  }
]
 */
/**
 * @apiDefine removeFriendSuccessExample
 * @apiSuccessExample
removeFriend result
{
  "status": "removed"
}
 */
/**
 * @apiDefine followUserSuccessExample
 * @apiSuccessExample
followUser result
{
  "follow": "e6409f1a-bd77-4158-8ff5-277b88fef5dd",
  "user": {
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "user_follower": {
    "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
    "username": "phteven",
    "altid": "2",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-14T12:52:13.878Z",
  "visibility": "public"
}
 */
/**
 * @apiDefine getFollowSuccessExample
 * @apiSuccessExample
getFollow result
{
  "follow": "e6409f1a-bd77-4158-8ff5-277b88fef5dd",
  "user": {
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "user_follower": {
    "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
    "username": "phteven",
    "altid": "2",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-14T12:52:13.878Z",
  "visibility": "public"
}
 */
/**
 * @apiDefine getFollowersSuccessExample
 * @apiSuccessExample
getFollowers result
[
  {
    "follow": "4d2f982e-e6a3-4b6e-8320-c16d24b8d320",
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "user_follower": {
      "user": "4b9dc007-3b55-403e-89ef-2642ff6a6525",
      "username": "ted",
      "altid": "3",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "since": "2015-07-14T12:52:13.924Z",
    "visibility": "public"
  },
  {
    "follow": "e6409f1a-bd77-4158-8ff5-277b88fef5dd",
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "user_follower": {
      "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
      "username": "phteven",
      "altid": "2",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "since": "2015-07-14T12:52:13.878Z",
    "visibility": "public"
  }
]
 */
/**
 * @apiDefine unFollowUserSuccessExample
 * @apiSuccessExample
unFollowUser result
{
  "status": "removed"
}
 */
/**
 * @apiDefine getPostSuccessExample
 * @apiSuccessExample
getPost result
{
  "post": "140b7d84-e36e-4d25-ac93-b6eea9e364eb",
  "content": "Hello, this is a post",
  "content_type": "text/html",
  "user": {
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "posted": "2015-07-14T12:52:14.137Z",
  "visibility": "public"
}
 */
/**
 * @apiDefine removePostSuccessExample
 * @apiSuccessExample
removePost result
{
  "status": "removed"
}
 */
/**
 * @apiDefine addPostSuccessExample
 * @apiSuccessExample
addPost result
{
  "post": "96ff40e8-1af5-4f3a-b742-0ff75aba0e67",
  "user": {
    "user": "be053229-4460-4296-b5ec-1190fe770615",
    "username": "new_name",
    "altid": "new_altid",
    "userdata": {
      "hello": "world"
    }
  },
  "content": {
    "hello": "world"
  },
  "content_type": "application/json",
  "posted": "2015-07-14T12:52:14.378Z",
  "visibility": "public"
}
 */
/**
 * @apiDefine addLikeSuccessExample
 * @apiSuccessExample
addLike result
{
  "like": "709c3fee-d997-416c-a53a-9ea751426235",
  "user": {
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "item": "http%3A%2F%2Fgithub.com",
  "since": "2015-07-14T12:52:14.451Z",
  "visibility": "public"
}
 */
/**
 * @apiDefine getLikeSuccessExample
 * @apiSuccessExample
getLike result
{
  "like": "709c3fee-d997-416c-a53a-9ea751426235",
  "item": "http%3A%2F%2Fgithub.com",
  "user": {
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-14T12:52:14.451Z",
  "visibility": "public"
}
 */
/**
 * @apiDefine checkLikeSuccessExample
 * @apiSuccessExample
checkLike result
{
  "like": "709c3fee-d997-416c-a53a-9ea751426235",
  "user": {
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-14T12:52:14.451Z",
  "visibility": "public",
  "userLikes": true,
  "count": 1
}
 */
/**
 * @apiDefine removeLikeSuccessExample
 * @apiSuccessExample
removeLike result
{
  "status": "removed"
}
 */
/**
 * @apiDefine checkNotLikeSuccessExample
 * @apiSuccessExample
checkNotLike result
{
  "userLikes": false,
  "user": {
    "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "count": 0
}
 */
/**
 * @apiDefine getFeedSuccessExample
 * @apiSuccessExample
getFeed result
{
  "feed": [
    {
      "like": "709c3fee-d997-416c-a53a-9ea751426235",
      "item": "http%3A%2F%2Fgithub.com",
      "user": {
        "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-07-14T12:52:14.451Z",
      "visibility": "public",
      "_item": "709c3fee-d997-416c-a53a-9ea751426235",
      "type": "like",
      "timeuuid": "269be442-2a27-11e5-9c09-4004be1dfb86",
      "date": "2015-07-14T12:52:14.451Z",
      "fromNow": "a few seconds ago",
      "isPrivate": false,
      "isPersonal": false,
      "isPublic": true,
      "fromSomeoneYouFollow": false,
      "isLike": true,
      "isPost": false,
      "isFollow": false,
      "isFriend": false,
      "isUsersItem": true,
      "isFollower": false
    },
    {
      "post": "140b7d84-e36e-4d25-ac93-b6eea9e364eb",
      "content": "Hello, this is a post",
      "content_type": "text/html",
      "user": {
        "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "posted": "2015-07-14T12:52:14.137Z",
      "visibility": "public",
      "_item": "140b7d84-e36e-4d25-ac93-b6eea9e364eb",
      "type": "post",
      "timeuuid": "266bfa9d-2a27-11e5-a892-f3763f80968b",
      "date": "2015-07-14T12:52:14.137Z",
      "fromNow": "a few seconds ago",
      "isPrivate": false,
      "isPersonal": false,
      "isPublic": true,
      "fromSomeoneYouFollow": false,
      "isLike": false,
      "isPost": true,
      "isFollow": false,
      "isFriend": false,
      "isUsersItem": true,
      "isFollower": false
    },
    {
      "follow": "4d2f982e-e6a3-4b6e-8320-c16d24b8d320",
      "user": {
        "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_follower": {
        "user": "4b9dc007-3b55-403e-89ef-2642ff6a6525",
        "username": "ted",
        "altid": "3",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-07-14T12:52:13.924Z",
      "visibility": "public",
      "_item": "4d2f982e-e6a3-4b6e-8320-c16d24b8d320",
      "type": "follow",
      "timeuuid": "264c8bb7-2a27-11e5-872b-2681299a712d",
      "date": "2015-07-14T12:52:13.931Z",
      "fromNow": "a few seconds ago",
      "isPrivate": false,
      "isPersonal": false,
      "isPublic": true,
      "fromSomeoneYouFollow": false,
      "isLike": false,
      "isPost": false,
      "isFollow": true,
      "isFriend": false,
      "isUsersItem": true,
      "isFollower": false
    },
    {
      "follow": "e6409f1a-bd77-4158-8ff5-277b88fef5dd",
      "user": {
        "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_follower": {
        "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
        "username": "phteven",
        "altid": "2",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-07-14T12:52:13.878Z",
      "visibility": "public",
      "_item": "e6409f1a-bd77-4158-8ff5-277b88fef5dd",
      "type": "follow",
      "timeuuid": "26475b95-2a27-11e5-90e4-cd0d65ea3231",
      "date": "2015-07-14T12:52:13.897Z",
      "fromNow": "a few seconds ago",
      "isPrivate": false,
      "isPersonal": false,
      "isPublic": true,
      "fromSomeoneYouFollow": false,
      "isLike": false,
      "isPost": false,
      "isFollow": true,
      "isFriend": false,
      "isUsersItem": true,
      "isFollower": false
    },
    {
      "friend": "c917cad2-3359-4d15-aa04-98f03af9c5bb",
      "user": {
        "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_friend": {
        "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
        "username": "phteven",
        "altid": "2",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-07-14T12:52:13.662Z",
      "visibility": "personal",
      "_item": "c917cad2-3359-4d15-aa04-98f03af9c5bb",
      "type": "friend",
      "timeuuid": "26237fe1-2a27-11e5-a236-16eda2330d34",
      "date": "2015-07-14T12:52:13.662Z",
      "fromNow": "a few seconds ago",
      "isPrivate": false,
      "isPersonal": true,
      "isPublic": false,
      "fromSomeoneYouFollow": false,
      "isLike": false,
      "isPost": false,
      "isFollow": false,
      "isFriend": true,
      "isUsersItem": true,
      "isFollower": false
    },
    {
      "post": "d884040a-4e53-4b53-b9e0-fcd52cabc584",
      "content": "Hello, this is a private post",
      "content_type": "text/html",
      "user": {
        "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "posted": "2010-07-28T06:01:00.145Z",
      "visibility": "private",
      "_item": "d884040a-4e53-4b53-b9e0-fcd52cabc584",
      "type": "post",
      "timeuuid": "7f10961e-9a0d-11df-b7ac-490cdead999a",
      "date": "2010-07-28T06:01:00.145Z",
      "fromNow": "5 years ago",
      "isPrivate": true,
      "isPersonal": false,
      "isPublic": false,
      "fromSomeoneYouFollow": false,
      "isLike": false,
      "isPost": true,
      "isFollow": false,
      "isFriend": false,
      "isUsersItem": true,
      "isFollower": false
    }
  ],
  "more": null
}
 */
/**
 * @apiDefine getUserFeedSuccessExample
 * @apiSuccessExample
getUserFeed result
[
  {
    "follow": "e6409f1a-bd77-4158-8ff5-277b88fef5dd",
    "user": {
      "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
      "username": "cliftonc",
      "altid": "1",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "user_follower": {
      "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
      "username": "phteven",
      "altid": "2",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "since": "2015-07-14T12:52:13.878Z",
    "visibility": "public",
    "_item": "e6409f1a-bd77-4158-8ff5-277b88fef5dd",
    "type": "follow",
    "timeuuid": "2647f7d6-2a27-11e5-8cab-b509a536b29e",
    "date": "2015-07-14T12:52:13.901Z",
    "fromNow": "a few seconds ago",
    "isPrivate": false,
    "isPersonal": false,
    "isPublic": true,
    "fromSomeoneYouFollow": true,
    "isLike": false,
    "isPost": false,
    "isFollow": true,
    "isFriend": false,
    "isUsersItem": true,
    "isFollower": false
  },
  {
    "friend": "905d0d26-e888-4027-866d-1d849992dbcf",
    "user": {
      "user": "ad0d553b-ef07-443a-a08b-219a6a8904dd",
      "username": "phteven",
      "altid": "2",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "user_friend": {
      "user": "79176bbd-d250-4e53-9bb7-8e8453a864ab",
      "username": "cliftonc",
      "altid": "1",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "since": "2015-07-14T12:52:13.662Z",
    "visibility": "personal",
    "_item": "905d0d26-e888-4027-866d-1d849992dbcf",
    "type": "friend",
    "timeuuid": "26237fe2-2a27-11e5-b749-33a94c84a0ec",
    "date": "2015-07-14T12:52:13.662Z",
    "fromNow": "a few seconds ago",
    "isPrivate": false,
    "isPersonal": true,
    "isPublic": false,
    "fromSomeoneYouFollow": false,
    "isLike": false,
    "isPost": false,
    "isFollow": false,
    "isFriend": true,
    "isUsersItem": false,
    "isFollower": false
  }
]
 */
/**
 * @apiDefine getUserRelationshipSuccessExample
 * @apiSuccessExample
getUserRelationship result
{
  "isFriend": true,
  "isFriendSince": "2015-07-14T12:52:13.662Z",
  "isFriendRequestPending": false,
  "isFriendRequestSince": null,
  "youFollow": false,
  "youFollowSince": null,
  "youFollowPrivate": false,
  "youFollowPersonal": false,
  "theyFollow": true,
  "theyFollowSince": "2015-07-14T12:52:13.878Z",
  "theyFollowVisibility": "public",
  "theyFollowPrivate": false,
  "theyFollowPersonal": false,
  "inCommon": [],
  "followerCount": 0
}
 */
