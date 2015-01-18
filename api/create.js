var cassandra = require('cassandra-driver');
var async = require('async');
var moment = require('moment');

/**
 * @apiDefine Data Creating Data
 *
 * This is a collection of methods that allow you to create social items.
 */
module.exports = function(client, keyspace) {

  var q = require('./queries')(keyspace);

  /**
   * @api {post} /api/user 1. Add a user
   * @apiName AddUser
   * @apiGroup Data
   * @apiVersion 1.0.0
   *
   * @apiDescription Creates a new user.
   * @apiParam {String} username the name of the user
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    {"user":"1b869349-d8f8-45b1-864e-19164e1b925a", "username": "cliftonc"}
   */
  function addUser(username, next) {
    var userid = cassandra.types.uuid();
    var user = [userid, username];
    client.execute(q('upsertUser'), user, function(err, result) {
      next(err, {user: userid, username: username});
    });
  }

  /**
   * @api {post} /api/post 2. Add a post by a user
   * @apiName AddPost
   * @apiGroup Data
   * @apiVersion 1.0.0
   *
   * @apiDescription Creates a new post.
   * @apiParam {Guid} user the guid representation of the user
   * @apiParam {String} content of the post
   * @apiParam {Timestamp} timestamp the time that the post occurred
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    { 'post': '19a8bfd1-8ebe-4462-bf93-9bd48efe08b7',
   *      'user': '4be37f53-7b79-4b77-9b08-c06346f507aa',
   *      'content': 'Hello, this is a post',
   *      'timestamp': 1421584990835 }
   */
  function addPost(user, content, timestamp, next) {

    var post = cassandra.types.uuid();
    var data = [post, user, content, timestamp];
    client.execute(q('upsertPost'), data, {prepare:true}, function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(user, post, 'post', function(err, result) {
        next(err, {post: post, user: user, content: content, timestamp: timestamp});
      });
    });

  }

  /**
   * @api {post} /api/like 3. Add a like by a user
   * @apiName AddLike
   * @apiGroup Data
   * @apiVersion 1.0.0
   *
   * @apiDescription Creates a new like of an item
   * @apiParam {Guid} user the guid representation of the user
   * @apiParam {String} item a canonical url to the item liked
   * @apiParam {Timestamp} timestamp time that the like occurred
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    { 'like': '8a3c8e57-67a1-4874-8f34-451f59f6d153',
   *      'user': '405d7e5e-c028-449c-abad-9c11d8569b8f',
   *      'item': 'http://github.com',
   *      'timestamp': 1421585133444 }
   */
  function addLike(user, item, timestamp, next) {

    var like = cassandra.types.uuid();
    var data = [like, user, item, timestamp];

    client.execute(q('upsertLike'), data, {prepare:true}, function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(user, like, 'like', function(err, result) {
        next(err, {like: like, user: user, item: item, timestamp: timestamp});
      });
    });

  }

  /**
   * @api {post} /api/friend 4. Add a friend to a user
   * @apiName AddFriend
   * @apiGroup Data
   * @apiVersion 1.0.0
   *
   * @apiDescription Adds a new friend to a user account.
   * @apiParam {Guid} user the guid representation of the user
   * @apiParam {Guid} friend the guid of the user to become friends with
   * @apiParam {Timestamp} timestamp time that the friending occurred
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    {"status":"OK"}
   */
  function addFriend(user, user_friend, timestamp, next) {

    var friend = cassandra.types.uuid();
    var data = [friend, user, user_friend, timestamp];
    client.execute(q('upsertFriend'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(user, friend, 'friend', function(err, result) {
        next(err, {friend: friend, user: user, user_friend: user_friend, timestamp: timestamp});
      });
    });

  }

  /**
   * @api {post} /api/follower 5. Add a follower to a user
   * @apiName AddFollower
   * @apiGroup Data
   * @apiVersion 1.0.0
   *
   * @apiDescription Adds a new friend to a user account.
   * @apiParam {Guid} user the guid representation of the user
   * @apiParam {Guid} friend the guid of the user to become friends with
   * @apiParam {Timestamp} timestamp time that the friending occurred
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    {"status":"OK"}
   */
  function addFollower(user, user_follower, timestamp, next) {

    var follow = cassandra.types.uuid();
    var data = [follow, user, user_follower, timestamp];
    client.execute(q('upsertFollower'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(user, follow, 'follow', function(err, result) {
        next(err, {follow: follow, user: user, user_follower: user_follower, timestamp: timestamp});
      });
    });

  }

  function _addFeedItem(user, item, type, next) {

    var insertUserTimeline = function(cb) {
      var data = [user, item, type, cassandra.types.timeuuid()];
      client.execute(q('upsertUserTimeline'), data, {prepare:true}, cb);
    }

    var insertFollowersTimeline = function(cb) {
      client.execute(q('selectFollowers'), [user], {prepare:true} ,function(err, data) {
        /* istanbul ignore if */
        if(err || data.rows.length == 0) { return cb(err); }
        async.map(data.rows, function(row, cb2) {
          var data = [row.user_follower, item, type, cassandra.types.timeuuid()];
          client.execute(q('upsertUserTimeline'), data, {prepare:true}, cb2);
        }, cb);
      });
    }

    async.series([
      insertUserTimeline,
      insertFollowersTimeline
    ], next);

  }

  return {
    addUser: addUser,
    addPost: addPost,
    addLike: addLike,
    addFriend: addFriend,
    addFollower: addFollower
  }

}
