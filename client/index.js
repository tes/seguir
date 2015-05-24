/**
 * Seguir client
 */
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
 *    {
 *      appid: '12345',
 *      appsecret: '12345',
 *      host: 'http://seguir.server.com',
      }
 */
var defaults = {
  host: 'http://localhost:3000'
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
Seguir.prototype.get = function (liu, apiPath, next) {
  var self = this;
  self.client.get({path: apiPath, headers: self.getHeaders(liu)}, function (err, req, res, obj) {
    next(err, obj);
  });
};

Seguir.prototype.post = function (liu, apiPath, data, next) {
  var self = this;
  self.client.post({path: apiPath, headers: self.getHeaders(liu)}, data, function (err, req, res, obj) {
    next(err, obj);
  });
};

Seguir.prototype.del = function (liu, apiPath, next) {
  var self = this;
  self.client.del({path: apiPath, headers: self.getHeaders(liu)}, function (err, req, res, obj) {
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
 * @apiParam {Function} next callback
 *
 * @apiUse addUserSuccessExample
 */
Seguir.prototype.addUser = function (liu, username, altid, userdata, next) {
  var self = this;
  self.post(liu, u('addUser'), {username: username, altid: altid, userdata: userdata}, next);
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
 * @api {function} addFriendRequest(liu,user_friend,message,timestamp,next) addFriendRequest
 * @apiName addFriendRequest
 * @apiGroup FriendRequests
 * @apiVersion 1.0.0
 *
 * @apiDescription Create a friend request with message
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} user_friend the id of the user to send a friend request to
 * @apiParam {String} message a message to leave with the request
 * @apiParam {Timestamp} timestamp time to leave the request
 * @apiParam {Function} next callback
 * @apiUse addFriendRequestSuccessExample
 */
Seguir.prototype.addFriendRequest = function (liu, user_friend, message, timestamp, next) {
  var self = this;
  self.post(liu, u('addFriendRequest'), {user_friend: user_friend, message: message, timestamp: timestamp}, next);
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
 * @apiUse followUserSuccessExample
 */
Seguir.prototype.followUser = function (liu, user_to_follow, timestamp, isprivate, ispersonal, next) {
  var self = this;
  self.post(liu, u('addFollower'), {user: user_to_follow, user_follower: liu, isprivate: isprivate, ispersonal: ispersonal}, next);
};

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
 * @api {function} addPost(liu,content,timestamp,isprivate,ispersonal,next) addPost
 * @apiName addPost
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiDescription Create a new post on a users news feed
 * @apiParam {String} liu the id of the current logged in user
 * @apiParam {String} content the id of the user to follow
 * @apiParam {Timestamp} timestamp time to leave the request
 * @apiParam {Boolean} isprivate is this visible only to friends
 * @apiParam {Boolean} ispersonal is this visible only to the user
 * @apiParam {Function} next callback
 * @apiUse addPostSuccessExample
 */
Seguir.prototype.addPost = function (liu, content, timestamp, isprivate, ispersonal, next) {
  var self = this;
  self.post(liu, u('addPost'), {user: liu, content: content, timestamp: timestamp, isprivate: isprivate, ispersonal: ispersonal}, next);
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
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
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
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
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
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "username": "cliftonc",
  "altid": "1",
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
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "username": "cliftonc",
  "altid": "1",
  "userdata": {
    "avatar": "test.jpg"
  }
}
 */
/**
 * @apiDefine addFriendRequestSuccessExample
 * @apiSuccessExample
addFriendRequest result
{
  "friend_request": "cb465cde-91e2-4453-98c8-9c9180ea877d",
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "user_friend": "192b4054-d668-4695-acd9-c6c9420f5a37",
  "message": "Please be my friend",
  "timestamp": 1432469763890
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
      "friend_request": "cb465cde-91e2-4453-98c8-9c9180ea877d",
      "user": {
        "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_friend": {
        "user": "192b4054-d668-4695-acd9-c6c9420f5a37",
        "username": "phteven",
        "altid": "2",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "message": "Please be my friend",
      "since": "2015-05-24T12:16:03.890Z"
    }
  ]
}
 */
/**
 * @apiDefine acceptFriendRequestSuccessExample
 * @apiSuccessExample
acceptFriendRequest result
{
  "friend": "2e9e9e7c-8591-4936-9c3d-93e445976989",
  "reciprocal": "154de9e1-89d6-41f0-baab-203f65e15ff9",
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "user_friend": "192b4054-d668-4695-acd9-c6c9420f5a37",
  "timestamp": 1432469763989
}
 */
/**
 * @apiDefine getFriendSuccessExample
 * @apiSuccessExample
getFriend result
{
  "friend": "2e9e9e7c-8591-4936-9c3d-93e445976989",
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "user_friend": "192b4054-d668-4695-acd9-c6c9420f5a37",
  "since": "2015-05-24T12:16:03.989Z",
  "username_friend": "phteven"
}
 */
/**
 * @apiDefine getFriendsSuccessExample
 * @apiSuccessExample
getFriends result
[
  {
    "user_friend": "192b4054-d668-4695-acd9-c6c9420f5a37",
    "since": "2015-05-24T12:16:03.989Z"
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
  "follow": "74941829-8750-4760-a897-b49214227a5c",
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "user_follower": "192b4054-d668-4695-acd9-c6c9420f5a37",
  "isprivate": false,
  "ispersonal": false,
  "timestamp": 1432469764455
}
 */
/**
 * @apiDefine getFollowSuccessExample
 * @apiSuccessExample
getFollow result
{
  "follow": "74941829-8750-4760-a897-b49214227a5c",
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "user_follower": "192b4054-d668-4695-acd9-c6c9420f5a37",
  "since": "2015-05-24T12:16:04.455Z",
  "isprivate": false,
  "ispersonal": false,
  "username_follower": "phteven"
}
 */
/**
 * @apiDefine getFollowersSuccessExample
 * @apiSuccessExample
getFollowers result
[
  {
    "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
    "user_follower": "192b4054-d668-4695-acd9-c6c9420f5a37",
    "since": "2015-05-24T12:16:04.455Z",
    "isprivate": false,
    "ispersonal": false
  },
  {
    "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
    "user_follower": "6011f3a8-48e6-4732-961a-4d5e4fa43b6d",
    "since": "2015-05-24T12:16:04.502Z",
    "isprivate": false,
    "ispersonal": false
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
 * @apiDefine addPostSuccessExample
 * @apiSuccessExample
addPost result
{
  "post": "fcd2d950-f1a8-44dc-8b00-8af0d5656bbe",
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "content": "Hello, this is a post",
  "timestamp": 1432469764823,
  "isprivate": false,
  "ispersonal": false
}
 */
/**
 * @apiDefine getPostSuccessExample
 * @apiSuccessExample
getPost result
{
  "post": "fcd2d950-f1a8-44dc-8b00-8af0d5656bbe",
  "content": "Hello, this is a post",
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "posted": "2015-05-24T12:16:04.823Z",
  "isprivate": false,
  "ispersonal": false
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
 * @apiDefine addLikeSuccessExample
 * @apiSuccessExample
addLike result
{
  "like": "744db763-3ede-4e15-8eeb-9f1e172870bd",
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "item": "http%3A%2F%2Fgithub.com",
  "timestamp": 1432469765243
}
 */
/**
 * @apiDefine getLikeSuccessExample
 * @apiSuccessExample
getLike result
{
  "like": "744db763-3ede-4e15-8eeb-9f1e172870bd",
  "item": "http%3A%2F%2Fgithub.com",
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "since": "2015-05-24T12:16:05.243Z"
}
 */
/**
 * @apiDefine checkLikeSuccessExample
 * @apiSuccessExample
checkLike result
{
  "like": "744db763-3ede-4e15-8eeb-9f1e172870bd",
  "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
  "since": "2015-05-24T12:16:05.243Z"
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
 * @apiDefine getFeedSuccessExample
 * @apiSuccessExample
getFeed result
{
  "feed": [
    {
      "like": "744db763-3ede-4e15-8eeb-9f1e172870bd",
      "item": "http%3A%2F%2Fgithub.com",
      "user": {
        "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-05-24T12:16:05.243Z",
      "type": "like",
      "timeuuid": "a69a35b0-020e-11e5-972d-11cdcc541144",
      "date": "2015-05-24T12:16:05.259Z",
      "fromNow": "a few seconds ago",
      "isprivate": false,
      "ispersonal": false,
      "fromFollower": true,
      "isLike": true,
      "isPost": false,
      "isFollow": false,
      "isFriend": false,
      "isUsersItem": true
    },
    {
      "post": "732c1858-e54f-4258-811e-d516d1511ca0",
      "content": "Hello, this is a private post",
      "user": {
        "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "posted": "2015-05-24T12:16:04.895Z",
      "isprivate": true,
      "ispersonal": false,
      "type": "post",
      "timeuuid": "a663e370-020e-11e5-972d-11cdcc541144",
      "date": "2015-05-24T12:16:04.903Z",
      "fromNow": "a few seconds ago",
      "fromFollower": true,
      "isLike": false,
      "isPost": true,
      "isFollow": false,
      "isFriend": false,
      "isUsersItem": true
    },
    {
      "post": "fcd2d950-f1a8-44dc-8b00-8af0d5656bbe",
      "content": "Hello, this is a post",
      "user": {
        "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "posted": "2015-05-24T12:16:04.823Z",
      "isprivate": false,
      "ispersonal": false,
      "type": "post",
      "timeuuid": "a6595c20-020e-11e5-972d-11cdcc541144",
      "date": "2015-05-24T12:16:04.834Z",
      "fromNow": "a few seconds ago",
      "fromFollower": true,
      "isLike": false,
      "isPost": true,
      "isFollow": false,
      "isFriend": false,
      "isUsersItem": true
    },
    {
      "follow": "270897f1-112a-481a-a3cb-3ce62faa3736",
      "user": {
        "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_follower": {
        "user": "6011f3a8-48e6-4732-961a-4d5e4fa43b6d",
        "username": "ted",
        "altid": "3",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-05-24T12:16:04.502Z",
      "isprivate": false,
      "ispersonal": false,
      "username_follower": "ted",
      "type": "follow",
      "timeuuid": "a6274fa0-020e-11e5-972d-11cdcc541144",
      "date": "2015-05-24T12:16:04.506Z",
      "fromNow": "a few seconds ago",
      "fromFollower": true,
      "isLike": false,
      "isPost": false,
      "isFollow": true,
      "isFriend": false,
      "isUsersItem": true
    },
    {
      "follow": "74941829-8750-4760-a897-b49214227a5c",
      "user": {
        "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_follower": {
        "user": "192b4054-d668-4695-acd9-c6c9420f5a37",
        "username": "phteven",
        "altid": "2",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-05-24T12:16:04.455Z",
      "isprivate": false,
      "ispersonal": false,
      "username_follower": "phteven",
      "type": "follow",
      "timeuuid": "a621aa50-020e-11e5-972d-11cdcc541144",
      "date": "2015-05-24T12:16:04.469Z",
      "fromNow": "a few seconds ago",
      "fromFollower": true,
      "isLike": false,
      "isPost": false,
      "isFollow": true,
      "isFriend": false,
      "isUsersItem": true
    },
    {
      "friend": "2e9e9e7c-8591-4936-9c3d-93e445976989",
      "user": {
        "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
        "username": "cliftonc",
        "altid": "1",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "user_friend": {
        "user": "192b4054-d668-4695-acd9-c6c9420f5a37",
        "username": "phteven",
        "altid": "2",
        "userdata": {
          "avatar": "test.jpg"
        }
      },
      "since": "2015-05-24T12:16:03.989Z",
      "username_friend": "phteven",
      "type": "friend",
      "timeuuid": "a5db0460-020e-11e5-972d-11cdcc541144",
      "date": "2015-05-24T12:16:04.006Z",
      "fromNow": "a few seconds ago",
      "isprivate": true,
      "ispersonal": false,
      "fromFollower": true,
      "isLike": false,
      "isPost": false,
      "isFollow": false,
      "isFriend": true,
      "isUsersItem": true
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
    "friend": "154de9e1-89d6-41f0-baab-203f65e15ff9",
    "user": {
      "user": "192b4054-d668-4695-acd9-c6c9420f5a37",
      "username": "phteven",
      "altid": "2",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "user_friend": {
      "user": "c3ae24de-9b87-4c36-b2ec-9eaec5dbbc02",
      "username": "cliftonc",
      "altid": "1",
      "userdata": {
        "avatar": "test.jpg"
      }
    },
    "since": "2015-05-24T12:16:03.989Z",
    "username_friend": "cliftonc",
    "type": "friend",
    "timeuuid": "a5e2f3a1-020e-11e5-972d-11cdcc541144",
    "date": "2015-05-24T12:16:04.058Z",
    "fromNow": "a few seconds ago",
    "isprivate": true,
    "ispersonal": false,
    "fromFollower": true,
    "isLike": false,
    "isPost": false,
    "isFollow": false,
    "isFriend": true,
    "isUsersItem": false
  }
]
 */
/**
 * @apiDefine getUserRelationshipSuccessExample
 * @apiSuccessExample
getUserRelationship result
{
  "isFriend": true,
  "isFriendSince": "2015-05-24T12:16:03.989Z",
  "isFriendRequestPending": false,
  "isFriendRequestSince": null,
  "youFollow": false,
  "youFollowSince": null,
  "youFollowPrivate": false,
  "youFollowPersonal": false,
  "theyFollow": true,
  "theyFollowSince": "2015-05-24T12:16:04.455Z",
  "theyFollowPrivate": false,
  "theyFollowPersonal": false,
  "inCommon": []
}
 */
