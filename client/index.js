/**
 * Seguir client
 */
var restify = require('restify');
var headerNames = require('../api/auth').headerNames;
var authUtils = require('../api/auth/utils');
var u = require('../api/urls');
var v = require('../api/visibility');

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

  self.host = options.host || defaults.host;
  self.rootpath = options.rootpath || defaults.rootpath;

  var clientConfig = {
    url: self.host,
    version: '*'
  };

  self.client = restify.createJsonClient(clientConfig);
  self.urls = u;
  self.visibility = v;

}

/**
 * Helper functions
 */
Seguir.prototype.get = function (liu, apiPath, next) {
  var self = this;
  self.client.get({path: self.rootpath + apiPath, headers: self.getHeaders(liu)}, function (err, req, res, obj) {
    next(err, obj);
  });
};

Seguir.prototype.post = function (liu, apiPath, data, next) {
  var self = this;
  self.client.post({path: self.rootpath + apiPath, headers: self.getHeaders(liu)}, data, function (err, req, res, obj) {
    next(err, obj);
  });
};

Seguir.prototype.del = function (liu, apiPath, next) {
  var self = this;
  self.client.del({path: self.rootpath + apiPath, headers: self.getHeaders(liu)}, function (err, req, res, obj) {
    next(err, obj);
  });
};

Seguir.prototype.getHeaders = function (liu) {
  var self = this;
  var headers = authUtils.generateAuthorization(self.appid, self.appsecret);
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
Seguir.prototype.addUser = function (liu, username, altid, userdata, initialise, next) {
  var self = this;
  if (!next) { next = initialise; initialise = null; }
  self.post(liu, u('addUser'), {username: username, altid: altid, userdata: userdata, initialise: initialise}, next);
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
 * @apiParam {String} content the id of the user to follow
 * @apiParam {String} content_type the content contained in content, use application/json for json data
 * @apiParam {Timestamp} posted the timestamp the post should appear to be created - use Date.now() for now
 * @apiParam {String} visibility visibility level
 * @apiParam {Function} next callback
 * @apiUse addPostSuccessExample
 */
Seguir.prototype.addPost = function (liu, content, content_type, posted, visibility, next) {
  var self = this;
  self.post(liu, u('addPost'), {user: liu, content: content, content_type: content_type, posted: posted, visibility: visibility}, next);
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
  "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
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
  "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
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
  "user": "1263fdd8-877c-4f40-bfef-a9b1e1d18420",
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
  "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
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
  "user": "202ad897-b047-4644-8de7-d5965934318e",
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
  "friend_request": "ab86f93c-afff-42d2-8fcb-d281f797022e",
  "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
  "user_friend": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
  "message": "Please be my friend",
  "since": "2015-07-06T05:31:53.246Z"
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
      "friend_request": "ab86f93c-afff-42d2-8fcb-d281f797022e",
      "user": {
        "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_friend": {
        "user": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
        "username": "phteven",
        "altid": "2",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "message": "Please be my friend",
      "since": "2015-07-06T05:31:53.246Z"
    }
  ]
}
 */
/**
 * @apiDefine acceptFriendRequestSuccessExample
 * @apiSuccessExample
acceptFriendRequest result
{
  "friend": "131cc41b-3b3f-44d6-ac7f-2731ea253610",
  "reciprocal": "e1a948f0-d124-4d1c-b08b-3d1d9f76c8ba",
  "user": {
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "user_friend": {
    "user": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
    "username": "phteven",
    "altid": "2",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-06T05:31:53.378Z"
}
 */
/**
 * @apiDefine getFriendSuccessExample
 * @apiSuccessExample
getFriend result
{
  "friend": "131cc41b-3b3f-44d6-ac7f-2731ea253610",
  "user": {
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "user_friend": {
    "user": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
    "username": "phteven",
    "altid": "2",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-06T05:31:53.378Z"
}
 */
/**
 * @apiDefine getFriendsSuccessExample
 * @apiSuccessExample
getFriends result
[
  {
    "user_friend": {
      "user": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
      "username": "phteven",
      "altid": "2",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "since": "2015-07-06T05:31:53.378Z"
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
  "follow": "5434c7cc-a544-4015-b0f4-9b39fc692cb1",
  "user": {
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "user_follower": {
    "user": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
    "username": "phteven",
    "altid": "2",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "visibility": null,
  "since": "2015-07-06T05:31:53.943Z"
}
 */
/**
 * @apiDefine getFollowSuccessExample
 * @apiSuccessExample
getFollow result
{
  "follow": "5434c7cc-a544-4015-b0f4-9b39fc692cb1",
  "user": {
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "user_follower": {
    "user": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
    "username": "phteven",
    "altid": "2",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-06T05:31:53.943Z",
  "visibility": null
}
 */
/**
 * @apiDefine getFollowersSuccessExample
 * @apiSuccessExample
getFollowers result
[
  {
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
    "user_follower": {
      "user": "10b6cc3c-25e9-4d90-b72c-364fdbd8a59e",
      "username": "ted",
      "altid": "3",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "since": "2015-07-06T05:31:54.014Z",
    "visibility": null
  },
  {
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
    "user_follower": {
      "user": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
      "username": "phteven",
      "altid": "2",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "since": "2015-07-06T05:31:53.943Z",
    "visibility": null
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
  "post": "12b8b721-a745-4dce-ae60-1038fda788c4",
  "content": "Hello, this is a post",
  "content_type": "text/html",
  "user": {
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "posted": "2015-07-06T05:31:54.468Z",
  "visibility": null
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
  "post": "556a60f1-82bf-4061-9377-015464387ad9",
  "user": {
    "user": "202ad897-b047-4644-8de7-d5965934318e",
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
  "posted": "2015-07-06T05:31:54.978Z",
  "visibility": null
}
 */
/**
 * @apiDefine addLikeSuccessExample
 * @apiSuccessExample
addLike result
{
  "like": "dda4dacc-1cbe-4b16-89ed-ec8c530c0dd4",
  "user": {
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "item": "http%3A%2F%2Fgithub.com",
  "since": "2015-07-06T05:31:55.125Z"
}
 */
/**
 * @apiDefine getLikeSuccessExample
 * @apiSuccessExample
getLike result
{
  "like": "dda4dacc-1cbe-4b16-89ed-ec8c530c0dd4",
  "item": "http%3A%2F%2Fgithub.com",
  "user": {
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-06T05:31:55.125Z"
}
 */
/**
 * @apiDefine checkLikeSuccessExample
 * @apiSuccessExample
checkLike result
{
  "like": "dda4dacc-1cbe-4b16-89ed-ec8c530c0dd4",
  "user": {
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
    "username": "cliftonc",
    "altid": "1",
    "userdata": {
      "avatar": "test.jpg"
    }
  },
  "since": "2015-07-06T05:31:55.125Z",
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
    "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
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
      "like": "dda4dacc-1cbe-4b16-89ed-ec8c530c0dd4",
      "item": "http%3A%2F%2Fgithub.com",
      "user": {
        "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-07-06T05:31:55.125Z",
      "_item": "dda4dacc-1cbe-4b16-89ed-ec8c530c0dd4",
      "type": "like",
      "timeuuid": "5028aa5e-23a0-11e5-9b28-9e1c8fb7408d",
      "date": "2015-07-06T05:31:55.125Z",
      "fromNow": "a few seconds ago",
      "visibility": null,
      "isprivate": false,
      "ispersonal": false,
      "fromFollower": true,
      "isLike": true,
      "isPost": false,
      "isFollow": false,
      "isFriend": false,
      "isUsersItem": true,
      "isFollower": false
    },
    {
      "post": "12b8b721-a745-4dce-ae60-1038fda788c4",
      "content": "Hello, this is a post",
      "content_type": "text/html",
      "user": {
        "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "posted": "2015-07-06T05:31:54.468Z",
      "visibility": null,
      "_item": "12b8b721-a745-4dce-ae60-1038fda788c4",
      "type": "post",
      "timeuuid": "4fc46a49-23a0-11e5-8dd6-3a23beea6d38",
      "date": "2015-07-06T05:31:54.468Z",
      "fromNow": "a few seconds ago",
      "isprivate": false,
      "ispersonal": false,
      "fromFollower": true,
      "isLike": false,
      "isPost": true,
      "isFollow": false,
      "isFriend": false,
      "isUsersItem": true,
      "isFollower": false
    },
    {
      "follow": "09556fa6-c485-46ba-859f-3b1e4bfd02ec",
      "user": {
        "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_follower": {
        "user": "10b6cc3c-25e9-4d90-b72c-364fdbd8a59e",
        "username": "ted",
        "altid": "3",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-07-06T05:31:54.014Z",
      "visibility": null,
      "_item": "09556fa6-c485-46ba-859f-3b1e4bfd02ec",
      "type": "follow",
      "timeuuid": "4f7f23e6-23a0-11e5-ab76-fd6ec4e40e2d",
      "date": "2015-07-06T05:31:54.014Z",
      "fromNow": "a few seconds ago",
      "isprivate": false,
      "ispersonal": false,
      "fromFollower": true,
      "isLike": false,
      "isPost": false,
      "isFollow": true,
      "isFriend": false,
      "isUsersItem": true,
      "isFollower": false
    },
    {
      "follow": "5434c7cc-a544-4015-b0f4-9b39fc692cb1",
      "user": {
        "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_follower": {
        "user": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
        "username": "phteven",
        "altid": "2",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-07-06T05:31:53.943Z",
      "visibility": null,
      "_item": "5434c7cc-a544-4015-b0f4-9b39fc692cb1",
      "type": "follow",
      "timeuuid": "4f744e75-23a0-11e5-81d8-4f086522bd0f",
      "date": "2015-07-06T05:31:53.943Z",
      "fromNow": "a few seconds ago",
      "isprivate": false,
      "ispersonal": false,
      "fromFollower": true,
      "isLike": false,
      "isPost": false,
      "isFollow": true,
      "isFriend": false,
      "isUsersItem": true,
      "isFollower": false
    },
    {
      "friend": "131cc41b-3b3f-44d6-ac7f-2731ea253610",
      "user": {
        "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_friend": {
        "user": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
        "username": "phteven",
        "altid": "2",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-07-06T05:31:53.378Z",
      "_item": "131cc41b-3b3f-44d6-ac7f-2731ea253610",
      "type": "friend",
      "timeuuid": "4f1e1821-23a0-11e5-8146-d0dd3ccedbae",
      "date": "2015-07-06T05:31:53.378Z",
      "fromNow": "a few seconds ago",
      "visibility": "personal",
      "isprivate": false,
      "ispersonal": true,
      "fromFollower": true,
      "isLike": false,
      "isPost": false,
      "isFollow": false,
      "isFriend": true,
      "isUsersItem": true,
      "isFollower": false
    },
    {
      "post": "c542a444-f653-47b6-9ee8-faa6c89a0b6a",
      "content": "Hello, this is a private post",
      "content_type": "text/html",
      "user": {
        "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "posted": "2010-07-28T06:01:00.145Z",
      "visibility": "private",
      "_item": "c542a444-f653-47b6-9ee8-faa6c89a0b6a",
      "type": "post",
      "timeuuid": "7f10961a-9a0d-11df-a1b2-a9ad6f994749",
      "date": "2010-07-28T06:01:00.145Z",
      "fromNow": "5 years ago",
      "isprivate": true,
      "ispersonal": false,
      "fromFollower": true,
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
    "friend": "e1a948f0-d124-4d1c-b08b-3d1d9f76c8ba",
    "user": {
      "user": "61b4af74-cf49-4bd8-83f9-ee96ab5909e8",
      "username": "phteven",
      "altid": "2",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "user_friend": {
      "user": "c23ff0a4-460e-4ae6-ba39-2581f1de5eed",
      "username": "cliftonc",
      "altid": "1",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "since": "2015-07-06T05:31:53.378Z",
    "_item": "e1a948f0-d124-4d1c-b08b-3d1d9f76c8ba",
    "type": "friend",
    "timeuuid": "4f1e1822-23a0-11e5-89c1-a6a7f62137a2",
    "date": "2015-07-06T05:31:53.378Z",
    "fromNow": "a few seconds ago",
    "visibility": "personal",
    "isprivate": false,
    "ispersonal": true,
    "fromFollower": true,
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
  "isFriendSince": "2015-07-06T05:31:53.378Z",
  "isFriendRequestPending": false,
  "isFriendRequestSince": null,
  "youFollow": false,
  "youFollowSince": null,
  "youFollowPrivate": false,
  "youFollowPersonal": false,
  "theyFollow": true,
  "theyFollowSince": "2015-07-06T05:31:53.943Z",
  "theyFollowVisibility": null,
  "theyFollowPrivate": false,
  "theyFollowPersonal": false,
  "inCommon": [],
  "followerCount": 0
}
 */
