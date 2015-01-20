var restify = require('restify');
var api = require('./index');

var server = restify.createServer({
  name:'seguir',
  version:'0.1.0'
});

// Default middleware
server.use(restify.bodyParser({mapParams: true}));
server.use(restify.queryParser({ mapParams: false }));
server.use(restify.gzipResponse());
server.use(restify.CORS());
server.get(/\/docs\/current\/?.*/, restify.serveStatic({
  directory: './doc',
  default: 'index.html'
}));
server.use(restify.requestLogger());

// Preflight
server.pre(restify.pre.sanitizePath());
server.pre(restify.pre.userAgentConnection());
server.pre(api.auth.checkRequest);

/**
 * @apiDefine ApiUsers Users
 * This is a collection of methods that allow you to create and retrieve users.
 */

/**
 * @api {post} /user Add a user
 * @apiName Users
 * @apiGroup ApiUsers
 * @apiVersion 1.0.0
 *
 * @apiDescription Creates a new user.
 * @apiParam {String} username the name of the user
 *
 * @apiExample {curl} Example usage:
 *     curl --data "username=cliftonc" http://localhost:3000/user
 *
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
 *    {
 *      "user":"1b869349-d8f8-45b1-864e-19164e1b925a",
 *      "username": "cliftonc"
 *    }
 *
 *  @apiUse MissingUsername
 *  @apiUse ServerError
 *
 */
server.post('/user', function (req, res, next) {
  if(!req.params.username) {
    return next(new restify.errors.BadRequestError("You must provide a username."));
  }
  api.manage.addUser(req.params.username, function(err, user) {
    if(err) {
     return next(new restify.errors.ServerError(err.message));
    }
    res.send(user);
  });
});


/**
 * @api {get} /user/:username Get a specific user
 * @apiName GetUser
 * @apiGroup ApiUsers
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves details of a specific user
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://localhost:3000/user/cliftonc
 *
 * @apiParam {String} username The name of the user
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
 *    {
 *      "user":"cbeab41d-2372-4017-ac50-d8d63802d452",
 *      "username":"cliftonc"
 *    }
 *
 *  @apiUse MissingUsername
 *  @apiUse UserNotFound
 *  @apiUse ServerError
 *
 */
server.get('/user/:username', function (req, res, next) {
  if(!req.params.username) {
    return next(new restify.errors.BadRequestError("You must provide a username."));
  }
  api.query.getUserByName(req.params.username, function(err, user) {
      if(!user) {
        return next(new restify.errors.NotFoundError("Could not find that user."));
      }
      if(err) {
       return next(new restify.errors.ServerError(err.message));
      }
      res.send(user);
  });
});

/**
 * @apiDefine ApiLikes Likes
 *
 * This is a collection of methods that allow you to create and retrieve likes.
 */

/**
 * @api {post} /like Add a like by a user
 * @apiName AddLike
 * @apiGroup ApiLikes
 * @apiVersion 1.0.0
 *
 * @apiDescription Creates a new like of an item
 *
 * @apiExample {curl} Example usage:
 *     curl --data "username=cliftonc&item=github.com" http://localhost:3000/like
 *
 * @apiParam {Guid} user the guid representation of the user
 * @apiParam {String} item a canonical url to the item liked
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
 *    { 'like': '8a3c8e57-67a1-4874-8f34-451f59f6d153',
 *      'user': '405d7e5e-c028-449c-abad-9c11d8569b8f',
 *      'item': 'http://github.com',
 *      'timestamp': 1421585133444 }
 *
 *  @apiUse MissingUsername
 *  @apiUse MissingItem
 *  @apiUse UserNotFound
 *  @apiUse ServerError
 */
server.post('/like', function (req, res, next) {
  if(!req.params.username) {
    return next(new restify.errors.BadRequestError("You must provide a username."));
  }
  if(!req.params.item) {
    return next(new restify.errors.BadRequestError("You must provide an item."));
  }
  api.manage.addLikeByName(req.params.username, req.params.item, Date.now(), function(err, like) {
    if(err) {
     return next(new restify.errors.ServerError(err.message));
    }
    res.send(like);
  });
});

/**
 * @api {get} /like/:like Get a specific like
 * @apiName GetLike
 * @apiGroup ApiLikes
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves details of a specific like
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://localhost:3000/like/cliftonc/github.com
 *
 * @apiParam {Guid} post The guid of the like
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
 *    { 'like': '8a3c8e57-67a1-4874-8f34-451f59f6d153',
 *      'user': '405d7e5e-c028-449c-abad-9c11d8569b8f',
 *      'item': 'github.com',
 *      'timestamp': 1421585133444 }
 *
 *  @apiUse MissingUsername
 *  @apiUse MissingItem
 *  @apiUse UserNotFound
 *  @apiUse ServerError
 *
 */
server.get('/like/:username/:item', function (req, res, next) {
  if(!req.params.username) {
    return next(new restify.errors.BadRequestError("You must provide a username."));
  }
  if(!req.params.item) {
    return next(new restify.errors.BadRequestError("You must provide an item."));
  }
  api.query.checkLike(req.params.username, req.params.item, function(err, like) {
      if(err) {
       return next(new restify.errors.ServerError(err.message));
      }
      if(!like) {
       return next(new restify.errors.NotFoundError('User + item like not found'));
      }
      res.send(like);
  });
});

/**
 * @apiDefine ApiPosts Posts
 *
 * This is a collection of methods that allow you to create and retrieve posts.
 */

/**
 * @api {post} /post Add a post by a user, by default posts are public.
 * @apiName AddPost
 * @apiGroup ApiPosts
 * @apiVersion 1.0.0
 *
 * @apiDescription Creates a new post.
 * @apiParam {String} username of the user
 * @apiParam {String} content of the post
 * @apiParam {Timestamp} timestamp the time that the post occurred
 * @apiParam {Boolean} private is the post private, e.g. only for friends
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
 *    { 'post': '19a8bfd1-8ebe-4462-bf93-9bd48efe08b7',
 *      'user': '4be37f53-7b79-4b77-9b08-c06346f507aa',
 *      'content': 'Hello, this is a post',
 *      'timestamp': 1421584990835 }
 *
 *  @apiUse MissingUser
 *  @apiUse MissingContent
 *  @apiUse ServerError
 */
server.post('/post', function (req, res, next) {
  if(!req.params.username) {
    return next(new restify.errors.BadRequestError("You must provide a username."));
  }
  if(!req.params.content) {
    return next(new restify.errors.BadRequestError("You must provide content for the post."));
  }
  api.manage.addPostByName(req.params.username, req.params.content, Date.now(), req.params.private, function(err, post) {
    if(err) {
     return next(new restify.errors.ServerError(err.message));
    }
    res.send(post);
  });
});

/**
 * @api {get} /post/:post Get a specific post
 * @apiName GetPost
 * @apiGroup ApiPosts
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves details of a specific post
 * @apiParam {Guid} post The guid of the post
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
      {
          "post": "247455fe-0e8e-4e3f-af4d-458ac13508b8",
          "content": "HELLO WORLD!",
          "user": "cbeab41d-2372-4017-ac50-d8d63802d452",
          "posted": "2015-01-18T20:37:32.626Z"
      }
 *
 *  @apiUse MissingPost
 *  @apiUse ServerError
 */
server.get('/post/:post', function (req, res, next) {
  if(!req.params.post) {
    return next(new restify.errors.BadRequestError("You must provide a post guid."));
  }
  api.query.getPost(req.liu.user, req.params.post, function(err, post) {
      if(err) {
       return next(new restify.errors.ServerError(err.message));
      }
      res.send(post);
  });
});

/**
 * @apiDefine ApiFriends Friends
 *
 * This is a collection of methods that allow you to create and retrieve friend links.
 */
/**
 * @api {post} /friend Add a friend to a user
 * @apiName AddFriend
 * @apiGroup ApiFriends
 * @apiVersion 1.0.0
 *
 * @apiDescription Adds a new friend to a user account.
 * @apiParam {String} username the guid representation of the user
 * @apiParam {String} username_friend the guid of the user to become friends with
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
     {
        "friend": "28104896-2e8d-4ba1-9e13-14dd0f096277",
        "user": "cbeab41d-2372-4017-ac50-d8d63802d452",
        "user_friend": "379554e7-72b0-4009-b558-aa2804877595",
        "timestamp": 1421650920521
     }
 *
 *  @apiUse MissingUsername
 *  @apiUse MissingFriend
 *  @apiUse ServerError
 */
server.post('/friend', function (req, res, next) {
  if(!req.params.username) {
    return next(new restify.errors.BadRequestError("You must provide a user guid."));
  }
  if(!req.params.username_friend) {
    return next(new restify.errors.BadRequestError("You must provide a user_friend guid."));
  }
  api.manage.addFriendByName(req.params.username, req.params.username_friend, Date.now(), function(err, friend) {
    if(err) {
     return next(new restify.errors.ServerError(err.message));
    }
    if(!friend) {
       return next(new restify.errors.NotFoundError('User not found'));
    }
    res.send(friend);
  });
});

/**
 * @api {get} /user/:username/friends Get friends for a user
 * @apiName GetFriends
 * @apiGroup ApiFriends
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves a set of friends for a specific user
 * @apiParam {String} username the username of the user
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
 *  [
        {
            "user_friend": {
                "user": "cbeab41d-2372-4017-ac50-d8d63802d452",
                "username": "cliftonc"
            },
            "since": "2015-01-18T20:36:38.632Z"
        }
    ]
 *
 *  @apiUse MissingUsername
 *  @apiUse UserNotFound
 *  @apiUse ServerError
 *
 */
server.get('/user/:username/friends', function (req, res, next) {
  if(!req.params.username) {
    return next(new restify.errors.BadRequestError("You must provide a user."));
  }
  api.query.getFriendsByName(req.liu.user, req.params.username, function(err, friends) {
    if(err) {
     next.ifError(new restify.errors.ForbiddenError(err.message));
    }
    res.send(friends);
  });
});

 /**
 * @apiDefine ApiFollowers Followers
 *
 * This is a collection of methods that allow you to create and retrieve follows.
 */

/**
 * @api {post} /follow Add a follower to a user
 * @apiName AddFollower
 * @apiGroup ApiFollowers
 * @apiVersion 1.0.0
 *
 * @apiDescription Adds a new friend to a user account.
 * @apiParam {Guid} user the guid representation of the user
 * @apiParam {Guid} user_follower the guid of the user to become friends with
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
      {
          "follow": "b90d442f-8473-4d50-84f2-d8bf0a25f514",
          "user": "cbeab41d-2372-4017-ac50-d8d63802d452",
          "user_follower": "cbeab41d-2372-4017-ac50-d8d63802d452",
          "timestamp": 1421663431703
      }
 *
 *  @apiUse MissingUsername
 *  @apiUse MissingFollow
 *  @apiUse ServerError
 */
server.post('/follow', function (req, res, next) {
  if(!req.params.username) {
    return next(new restify.errors.BadRequestError("You must provide a user."));
  }
  if(!req.params.username_follower) {
    return next(new restify.errors.BadRequestError("You must provide a user_follower."));
  }
  api.manage.addFollowerByName(req.params.username, req.params.username_follower, Date.now(), function(err, follow) {
    if(err) {
     return next(new restify.errors.ServerError(err.message));
    }
    res.send(follow);
  });
});


/**
 * @api {get} /user/:username/followers Get followers for a user
 * @apiName GetFollowers
 * @apiGroup ApiFollowers
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves a set of feed items for a specific user
 * @apiParam {String} username the username of the user
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
 *    [
          {
              "user_follower": {
                  "user": "379554e7-72b0-4009-b558-aa2804877595",
                  "username": "Mabel.Sporer"
              },
              "since": "1993-11-19T00:58:16.000Z"
          },
          {
              "user_follower": {
                  "user": "cbeab41d-2372-4017-ac50-d8d63802d452",
                  "username": "cliftonc"
              },
              "since": "2015-01-18T20:37:09.383Z"
          }
      ]
 *
 *  @apiUse MissingUsername
 *  @apiUse UserNotFound
 *  @apiUse ServerError
 *
 */
server.get('/user/:username/followers', function (req, res, next) {
  if(!req.params.username) {
    return next(new restify.errors.BadRequestError("You must provide a user."));
  }
  api.query.getFollowersByName(req.params.username, function(err, followers) {
    if(err) {
     return next(new restify.errors.ServerError(err.message));
    }
    res.send(followers);
  });
});

 /**
 * @apiDefine ApiFeeds Feeds
 *
 * This is a collection of methods that allow you to retrieve the news feed for a user.
 */

/**
 * @api {get} /feed/:username Get a feed for a user
 * @apiName GetFeed
 * @apiGroup ApiFeeds
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves a set of feed items for a specific user
 * @apiParam {String} username the username of the user
 * @apiSuccessExample
 *    HTTP/1.1 200 OK
      [
        {
            "post": "247455fe-0e8e-4e3f-af4d-458ac13508b8",
            "content": "HELLO WORLD!",
            "user": {
                "user": "cbeab41d-2372-4017-ac50-d8d63802d452",
                "username": "cliftonc"
            },
            "posted": "2015-01-18T20:37:32.626Z",
            "type": "post",
            "timeuuid": "d4065671-9f51-11e4-889d-9f08914a01c0",
            "date": "2015-01-18T20:37:32.631Z",
            "fromNow": "a few seconds ago",
            "fromFollow": false,
            "isLike": false,
            "isPost": true,
            "isFollow": false,
            "isFriend": false
        },
        {
          "friend": "7b3891d8-cc27-4284-8fb4-d3b455186f99",
          "user": {
              "user": "cbeab41d-2372-4017-ac50-d8d63802d452",
              "username": "cliftonc"
          },
          "user_friend": "cbeab41d-2372-4017-ac50-d8d63802d452",
          "since": "2015-01-18T20:36:38.632Z",
          "username_friend": "cliftonc",
          "type": "friend",
          "timeuuid": "b3d781d0-9f51-11e4-889d-9f08914a01c0",
          "date": "2015-01-18T20:36:38.637Z",
          "fromNow": "5 minutes ago",
          "fromFollow": false,
          "isLike": false,
          "isPost": false,
          "isFollow": false,
          "isFriend": true
      }
      ]
 *
 *  @apiUse MissingUsername
 *  @apiUse UserNotFound
 *  @apiUse ServerError
 *
 */
server.get('/feed/:username', function (req, res, next) {
  if(!req.params.username) {
    return next(new restify.errors.BadRequestError("You must provide a user guid."));
  }
  api.query.getFeedForUser(req.liu.user, req.params.username, null, 50, function(err, feed) {
      if(err) {
       return next(new restify.errors.ServerError(err.message));
      }
      res.send(feed);
  });
});

server.listen(3000, function() {
  console.log('%s listening at %s', server.name, server.url);
});

/**
 * @apiDefine MissingUser
 * @apiError (4xx) BadRequestError You did not provide a guid for the user
 * @apiErrorExample Bad-Request:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "BadRequestError",
 *       "message": "You must provide a user guid."
 *     }
 */

/**
 * @apiDefine MissingUsername
 * @apiError (4xx) BadRequestError You did not provide a username
 * @apiErrorExample Bad-Request:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "BadRequestError",
 *       "message": "You must provide a username."
 *     }
 */

/**
 * @apiDefine MissingPost
 * @apiError (4xx) BadRequestError You did not provide a post guid
 * @apiErrorExample Bad-Request:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "BadRequestError",
 *       "message": "You must provide a post guid."
 *     }
 */

/**
 * @apiDefine MissingFriend
 * @apiError (4xx) BadRequestError You did not provide a friend guid
 * @apiErrorExample Bad-Request:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "BadRequestError",
 *       "message": "You must provide a friend guid."
 *     }
 */

/**
 * @apiDefine MissingFollow
 * @apiError (4xx) BadRequestError You did not provide a follow guid
 * @apiErrorExample Bad-Request:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "BadRequestError",
 *       "message": "You must provide a follow guid."
 *     }
 */

/**
 * @apiDefine MissingItem
 * @apiError (4xx) BadRequestError You did not provide an item to check
 * @apiErrorExample Bad-Request:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "BadRequestError",
 *       "message": "You must provide an item."
 *     }
 */

/**
 * @apiDefine MissingContent
 * @apiError (4xx) BadRequestError You did not provide content for the post
 * @apiErrorExample Bad-Request:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "BadRequestError",
 *       "message": "You must provide content for the post."
 *     }
 */

/**
 * @apiDefine UserNotFound
 * @apiError (4xx) NotFoundError The user was not found.
 * @apiErrorExample Not-Found:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "code": "NotFoundError",
 *       "message": "Could not find that user."
 *     }
 */

/**
 * @apiDefine ServerError
 * @apiError (5xx) ServerError There was a server problem.
 * @apiErrorExample Server-Error:
 *     HTTP/1.1 500 Server Error
 *     {
 *       "code": "NotFoundError",
 *       "message": "Something specific about the server error"
 *     }
 */
