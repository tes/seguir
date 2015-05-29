var cassandra = require('cassandra-driver');
var Uuid = cassandra.types.Uuid;

/**
 * This is a collection of methods that allow you to create, update and delete social items.
 *
 * These methods all exclude the 'loggedinuser' parameter as they are all carried out only by
 * the currently logged in user and / or system level calls (e.g. adding a user via integration
 * with an SSO flow).
 *
 * TODO: Exception may be creating a post on someone elses feed.
 *
 */
module.exports = function (client, messaging, keyspace, api) {

  var q = require('../db/queries');

  function addPost (keyspace, user, content, timestamp, isprivate, ispersonal, next) {
    var post = Uuid.random();
    var data = [post, user, api.common.clean(content), timestamp, isprivate, ispersonal];
    client.execute(q(keyspace, 'upsertPost'), data, {prepare: true}, function (err, result) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.feed.addFeedItem(keyspace, user, post, 'post', isprivate, ispersonal, function (err, result) {
        if (err) { return next(err); }
        var tempPost = {
          post: post,
          user: user,
          content: api.common.clean(content),
          timestamp: timestamp,
          isprivate: isprivate,
          ispersonal: ispersonal
        };
        api.user.mapUserIdToUser(keyspace, tempPost, ['user', 'user_follower'], user, next);
      });
    });
  }

  function addPostByName (keyspace, username, content, timestamp, isprivate, ispersonal, next) {
    api.user.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      addPost(keyspace, user.user, content, timestamp, isprivate, ispersonal, next);
    });
  }

  function removePost (keyspace, user, post, next) {
    getPost(keyspace, user, post, function (err, postItem) {
      if (err) { return next(err); }
      var deleteData = [post];
      client.execute(q(keyspace, 'removePost'), deleteData, {prepare: true}, function (err, result) {
        if (err) return next(err);
        api.feed.removeFeedsForItem(keyspace, post, function (err) {
          if (err) return next(err);
          next(null, {status: 'removed'});
        });
      });
    });
  }

  function getPost (keyspace, liu, post, next) {
    var mapUserField = function (post) {
      api.user.mapUserIdToUser(keyspace, post, ['user', 'user_follower'], post.user, next);
    };

    api.common.get(keyspace, 'selectPost', [post], 'one', function (err, post) {
      if (err) { return next(err); }
      if (post.ispersonal) {
        if (liu.toString() !== post.user.toString()) { return next(api.common.error(403, 'You are not allowed to see this item.')); }
        return mapUserField(post);
      }
      if (post.isprivate) {
        api.friend.canSeePrivate(keyspace, liu, post.user, function (err, canSee) {
          if (err) { return next(err); }
          if (!canSee) { return next(api.common.error(403, 'You are not allowed to see this item.')); }
          return mapUserField(post);
        });
      } else {
        mapUserField(post);
      }
    });
  }

  return {
    addPost: addPost,
    addPostByName: addPostByName,
    removePost: removePost,
    getPost: getPost
  };

};
