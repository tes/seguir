var restify = require('restify');
var u = require('../api/urls');
var bunyan = require('bunyan');
var logger = bunyan.createLogger({
    name: 'seguir',
    serializers: restify.bunyan.serializers
});

function bootstrapServer(config, keyspace, next) {

  var client = require('../api/db/client')(config);
  var api = require('../index')(client, keyspace);

  var server = restify.createServer({
    name:'seguir',
    version:'0.1.0',
    log: logger
  });

  // Default middleware
  server.use(restify.bodyParser({mapParams: true}));
  server.use(restify.queryParser({ mapParams: false }));
  server.use(restify.gzipResponse());
  server.use(restify.CORS());
  server.use(restify.requestLogger());

  server.get(/\/docs\/current\/?.*/, restify.serveStatic({
    directory: './doc',
    default: 'index.html'
  }));

  // Preflight
  server.pre(restify.pre.sanitizePath());
  server.pre(restify.pre.userAgentConnection());
  server.pre(function (request, response, next) {
      if(config.logging) {
        request.log.info({ req: request }, 'REQUEST');
      }
      next();
  });
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
   * @apiParam {Object} userdata arbitrary user data
   *
   * @apiExample {curl} Example usage:
   *     curl --data "username=cliftonc" http://localhost:3000/user
   *
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    {
   *      "user":"1b869349-d8f8-45b1-864e-19164e1b925a",
   *      "username": "cliftonc",
   *      "userdata": {
   *        "avatar":"/img/123.jpg"
   *      }
   *    }
   *
   *  @apiUse MissingUsername
   *  @apiUse ServerError
   *
   */
  server.post(u('addUser'), function (req, res, next) {
    if(!req.params.username) {
      return next(new restify.InvalidArgumentError("You must provide a username."));
    }
    api.manage.addUser(req.keyspace, req.params.username, req.params.userdata, function(err, user) {
      if(err) {
       return next(new restify.ServerError(err.message));
      }
      res.send(user);
    });
  });


  /**
   * @api {get} /username/:username Get a specific user
   * @apiName GetUser
   * @apiGroup ApiUsers
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves details of a specific user
   *
   * @apiExample {curl} Example usage:
   *     curl -i http://localhost:3000/username/cliftonc
   *
   * @apiParam {String} username The name of the user
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    {
   *      "user":"cbeab41d-2372-4017-ac50-d8d63802d452",
   *      "username":"cliftonc"
   *    }
   *
   *  @apiUse UserNotFound
   *  @apiUse ServerError
   *
   */
  server.get(u('getUserByName'), function (req, res, next) {
    api.query.getUserByName(req.keyspace, req.params.username, function(err, user) {
        if(!user) {
          return next(new restify.NotFoundError("Could not find that user."));
        }
        if(err) {
         return next(new restify.ServerError(err.message));
        }
        res.send(user);
    });
  });

  /**
   * @api {get} /user/:id Get a specific user by id
   * @apiName GetUser
   * @apiGroup ApiUsers
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves details of a specific user by id
   *
   * @apiExample {curl} Example usage:
   *     curl -i http://localhost:3000/user/cbeab41d-2372-4017-ac50-d8d63802d452
   *
   * @apiParam {String} user The id of the user
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    {
   *      "user":"cbeab41d-2372-4017-ac50-d8d63802d452",
   *      "username":"cliftonc"
   *    }
   *
   *  @apiUse UserNotFound
   *  @apiUse ServerError
   *
   */
  server.get(u('getUser'), function (req, res, next) {
    api.query.getUser(req.keyspace, req.params.user, function(err, user) {
        if(!user) {
          return next(new restify.NotFoundError("Could not find that user."));
        }
        if(err) {
         return next(new restify.ServerError(err.message));
        }
        res.send(user);
    });
  });

  /**
   * @api {get} /user/:id/relationship Get details of a relationship
   * @apiName GetUserRelationship
   * @apiGroup ApiUsers
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves details of a specific user relationship by id
   *
   * @apiExample {curl} Example usage:
   *     curl -i http://localhost:3000/user/cbeab41d-2372-4017-ac50-d8d63802d452/relationship
   *
   * @apiParam {String} user The id of the user
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    {
   *      isFriend: true,
   *      youFollow: true,
   *      theyFollow: true
   *    }
   *
   *  @apiUse UserNotFound
   *  @apiUse ServerError
   *
   */
  server.get(u('getUserRelationship'), function (req, res, next) {
    if(!req.liu.user) {
      return next(new restify.UnauthorizedError('You must be logged in to access a friend request list.'));
    }
    api.query.getUserRelationship(req.keyspace, req.liu.user, req.params.user, function(err, relationship) {
        if(!relationship) {
          return next(new restify.NotFoundError("Could not find that user."));
        }
        if(err) {
         return next(new restify.ServerError(err.message));
        }
        res.send(relationship);
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
   *     curl --data "user=405d7e5e-c028-449c-abad-9c11d8569b8f&item=github.com" http://localhost:3000/like
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
  server.post(u('addLike'), function (req, res, next) {
    if(!req.params.user) {
      return next(new restify.InvalidArgumentError("You must provide a user."));
    }
    if(!req.params.item) {
      return next(new restify.InvalidArgumentError("You must provide an item."));
    }
    api.manage.addLike(req.keyspace, req.params.user, req.params.item, Date.now(), function(err, like) {
      if(err) {
       return next(new restify.ServerError(err.message));
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
   *     curl -i http://localhost:3000/like/405d7e5e-c028-449c-abad-9c11d8569b8f/github.com
   *
   * @apiParam {Guid} post The guid of the like
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    { 'like': '8a3c8e57-67a1-4874-8f34-451f59f6d153',
   *      'user': '405d7e5e-c028-449c-abad-9c11d8569b8f',
   *      'item': 'github.com',
   *      'timestamp': 1421585133444 }
   *
   *  @apiUse ServerError
   *
   */
  server.get(u('getLike'), function (req, res, next) {
    api.query.getLike(req.keyspace, req.params.like, function(err, like) {
        if(err) {
         return next(new restify.ServerError(err.message));
        }
        res.send(like);
    });
  });

  /**
   * @api {get} /user/:user/like/:item Check a specific like
   * @apiName CheckLike
   * @apiGroup ApiLikes
   * @apiVersion 1.0.0
   *
   * @apiDescription Checks if a user likes a specific item, typically the item is a canonical url.
   *
   * @apiExample {curl} Example usage:
   *     curl -i http://localhost:3000/like/405d7e5e-c028-449c-abad-9c11d8569b8f/github.com
   *
   * @apiParam {Guid} user The guid of the user
   * @apiParam {String} item The item to check
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    { 'like': '8a3c8e57-67a1-4874-8f34-451f59f6d153',
   *      'user': '405d7e5e-c028-449c-abad-9c11d8569b8f',
   *      'item': 'github.com',
   *      'timestamp': 1421585133444 }
   *
   *  @apiUse UserNotFound
   *  @apiUse ServerError
   *
   */
  server.get(u('checkLike'), function (req, res, next) {
    api.query.checkLike(req.keyspace, req.params.user, encodeURIComponent(req.params.item), function(err, like) {
        if(err) {
         return next(new restify.ServerError(err.message));
        }
        if(!like) {
         return next(new restify.NotFoundError('User + item like not found'));
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
   * @api {post} /post Add a post by a user
   * @apiName AddPost
   * @apiGroup ApiPosts
   * @apiVersion 1.0.0
   *
   * @apiDescription Creates a new post, by default all new posts are public, and so can be seen by all users.
   * @apiParam {String} user of the user
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
  server.post(u('addPost'), function (req, res, next) {
    if(!req.params.user) {
      return next(new restify.InvalidArgumentError("You must provide a user."));
    }
    if(!req.params.content) {
      return next(new restify.InvalidArgumentError("You must provide content for the post."));
    }
    api.manage.addPost(req.keyspace, req.params.user, req.params.content, Date.now(), req.params.isprivate ? true : false, function(err, post) {
      if(err) {
       return next(new restify.ServerError(err.message));
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
   *  @apiUse ServerError
   */
  server.get(u('getPost'), function (req, res, next) {
    api.query.getPost(req.keyspace, req.liu.user, req.params.post, function(err, post) {
        if(err) {
          return next(new restify.ForbiddenError(err.message));
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
   * @apiParam {String} user the guid representation of the user
   * @apiParam {String} user_friend the guid of the user to become friends with
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
  server.post(u('addFriend'), function (req, res, next) {
    if(!req.params.user) {
      return next(new restify.InvalidArgumentError("You must provide a user guid."));
    }
    if(!req.params.user_friend) {
      return next(new restify.InvalidArgumentError("You must provide a user_friend guid."));
    }
    api.manage.addFriend(req.keyspace, req.params.user, req.params.user_friend, Date.now(), function(err, friend) {
      if(err) {
       return next(new restify.ServerError(err.message));
      }
      if(!friend) {
         return next(new restify.NotFoundError('User not found'));
      }
      res.send(friend);
    });
  });

 /**
   * @api {get} /friend/:friend Get friend
   * @apiName GetFriend
   * @apiGroup ApiFriends
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves a specific relationship information
   * @apiParam {String} user the guid of the user
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
   *  @apiUse UserNotFound
   *  @apiUse ServerError
   *
   */
  server.get(u('getFriend'), function (req, res, next) {
    api.query.getFriend(req.keyspace, req.liu.user, req.params.friend, function(err, friend) {
      if(err) {
       return next(new restify.ForbiddenError(err.message));
      }
      res.send(friend);
    });
  });

  /**
   * @api {get} /user/:user/friends Get friends for a user
   * @apiName GetFriends
   * @apiGroup ApiFriends
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves a set of friends for a specific user
   * @apiParam {String} user the guid of the user
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
   *  @apiUse UserNotFound
   *  @apiUse ServerError
   *
   */
  server.get(u('getFriends'), function (req, res, next) {
    api.query.getFriends(req.keyspace, req.liu.user, req.params.user, function(err, friends) {
      if(err) {
       return next(new restify.ForbiddenError(err.message));
      }
      res.send(friends);
    });
  });

/**
   * @apiDefine ApiFriendRequests Friend Requests
   *
   * This is a collection of methods that allow you to use the friend request workflow (instead of creating friends automatically).
   */
  /**
   * @api {post} /friend-request Submit a new friend request
   * @apiName AddFriendRequest
   * @apiGroup ApiFriendRequests
   * @apiVersion 1.0.0
   *
   * @apiDescription Adds a new friend request.
   * @apiParam {String} user_friend the guid of the user to become friends with
   * @apiParam {String} message the message to leave
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
       {
          "friend_request": "28104896-2e8d-4ba1-9e13-14dd0f096277",
          "user": "cbeab41d-2372-4017-ac50-d8d63802d452",
          "user_friend": "379554e7-72b0-4009-b558-aa2804877595",
          "message": "Please be my friend!",
          "timestamp": 1421650920521
       }
   *
   *  @apiUse MissingUser
   *  @apiUse MissingFriend
   *  @apiUse ServerError
   */
  server.post(u('addFriendRequest'), function (req, res, next) {
    if(!req.params.user_friend) {
      return next(new restify.InvalidArgumentError("You must provide a user_friend guid."));
    }
    api.manage.addFriendRequest(req.keyspace, req.liu.user, req.params.user_friend, req.params.message || '', Date.now(), function(err, friend_request) {
      if(err) {
       return next(new restify.ServerError(err.message));
      }
      if(!friend_request) {
         return next(new restify.NotFoundError('User not found'));
      }
      res.send(friend_request);
    });
  });

  /**
   * @api {get} /friend-request/active Get active friend requests
   * @apiName GetFriendRequests
   * @apiGroup ApiFriendRequests
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves active friend Requests for logged in user (inbound and outbound)
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    { incoming: [],
          outgoing:
           [ { friend_request: '648909bf-9039-4e25-8c3d-1d80e9fe3b35',
               user: '17b4794d-0ec9-4005-a299-13e40dedf670',
               user_friend: 'cba56b9b-de75-4ed5-8a1b-1a152c016ed7',
               message: 'Hello world!',
               since: '2015-01-26T17:15:21.705Z' } ] }
   *
   *  @apiUse UserNotFound
   *  @apiUse ServerError
   *
   */
  server.get(u('getFriendRequests'), function (req, res, next) {
    if(!req.liu.user) {
      return next(new restify.UnauthorizedError('You must be logged in to access a friend request list.'));
    }
    api.query.getFriendRequests(req.keyspace, req.liu.user, function(err, friend_requests) {
      if(err) {
       return next(new restify.ServerError(err.message));
      }
      res.send(friend_requests);
    });
  });

  /**
   * @api {post} /friend-request/accept Accept a friend request
   * @apiName AcceptFriendRequest
   * @apiGroup ApiFriendRequests
   * @apiVersion 1.0.0
   *
   * @apiDescription Accepts a friend request.
   * @apiParam {String} friend_request the guid of the user to become friends with
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    { friend: '2334694d-21a6-42b1-809e-79175654dcd9',
          reciprocal: '90068d45-efc1-4e86-807d-a9ba1c8d794a',
          user: '17b4794d-0ec9-4005-a299-13e40dedf670',
          user_friend: 'cba56b9b-de75-4ed5-8a1b-1a152c016ed7',
          timestamp: 1422292521727 }

   *  @apiUse MissingUser
   *  @apiUse MissingFriend
   *  @apiUse ServerError
   */
  server.post(u('acceptFriendRequest'), function (req, res, next) {
    if(!req.params.friend_request) {
      return next(new restify.InvalidArgumentError("You must provide a friend_request guid."));
    }
    api.manage.acceptFriendRequest(req.keyspace, req.liu.user, req.params.friend_request, function(err, friend) {
      if(err) {
       return next(new restify.ServerError(err.message));
      }
      if(!friend) {
         return next(new restify.NotFoundError('Friend request not found'));
      }
      res.send(friend);
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
  server.post(u('addFollower'), function (req, res, next) {
    if(!req.params.user) {
      return next(new restify.InvalidArgumentError("You must provide a user."));
    }
    if(!req.params.user_follower) {
      return next(new restify.InvalidArgumentError("You must provide a user_follower."));
    }
    api.manage.addFollower(req.keyspace, req.params.user, req.params.user_follower, Date.now(), function(err, follow) {
      if(err) {
       return next(new restify.ServerError(err.message));
      }
      res.send(follow);
    });
  });


  /**
   * @api {get} /username/:user/followers Get followers for a user
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
   *  @apiUse UserNotFound
   *  @apiUse ServerError
   *
   */
  server.get(u('getFollowers'), function (req, res, next) {
    api.query.getFollowers(req.keyspace, req.params.user, function(err, followers) {
      if(err) {
       return next(new restify.ServerError(err.message));
      }
      res.send(followers);
    });
  });

  /**
   * @api {get} /followers/:follow Get follow details
   * @apiName GetFollower
   * @apiGroup ApiFollowers
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves details of a specific follow
   * @apiParam {Guid} follow the guid of a specific follow
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
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
   *
   *  @apiUse ServerError
   *
   */
  server.get(u('getFollow'), function (req, res, next) {
    api.query.getFollow(req.keyspace, req.params.follow, function(err, follow) {
      if(err) {
       return next(new restify.ServerError(err.message));
      }
      res.send(follow);
    });
  });

   /**
   * @apiDefine ApiFeeds Feeds
   *
   * This is a collection of methods that allow you to retrieve the news feed for a user.
   */

  /**
   * @api {get} /feed/:user Get a feed for a user
   * @apiName GetFeed
   * @apiGroup ApiFeeds
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves a set of feed items for a specific user
   * @apiParam {String} user the guid of the user
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
   *  @apiUse UserNotFound
   *  @apiUse ServerError
   *
   */
  server.get(u('getFeed'), function (req, res, next) {
    api.query.getFeedForUser(req.keyspace, req.liu.user, req.params.user, null, 50, function(err, feed) {
        if(err) {
         return next(new restify.ServerError(err.message));
        }
        res.send(feed || []);
    });
  });

  next(null, server);

}

/* istanbul ignore if */
if(require.main === module) {
  var config = require('./config');
  bootstrapServer(config, config.keyspace, function(err, server) {
    server.listen(config.port || 3000, function() {
      console.log('Server %s listening at %s', server.name, server.url);
    });
  });

} else {
  // Used for testing
  module.exports = bootstrapServer;
}

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
