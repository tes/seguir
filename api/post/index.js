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

  var q = client.queries;

  function addPost (keyspace, user, content, content_type, timestamp, isprivate, ispersonal, next) {
    var post = client.generateId();

    // Parse and re-parse the input content, this catches any errors and ensures we don't
    // persist broken data that will subsequently break the feed
    var cassandraContent = api.common.convertContentToCassandra(content, content_type);
    var originalContent = api.common.convertContentFromCassandra(cassandraContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not saved.')); }

    var data = [post, user, cassandraContent, content_type, timestamp, isprivate, ispersonal];
    client.execute(q(keyspace, 'upsertPost'), data, {prepare: true}, function (err, result) {
      /* istanbul ignore if */
      if (err) { return next(err); }

      api.feed.addFeedItem(keyspace, user, post, 'post', isprivate, ispersonal, timestamp, function (err, result) {
        if (err) { return next(err); }
        var tempPost = {
          post: post,
          user: user,
          content: originalContent,
          content_type: content_type,
          timestamp: timestamp,
          isprivate: isprivate,
          ispersonal: ispersonal
        };
        api.user.mapUserIdToUser(keyspace, tempPost, ['user', 'user_follower'], user, next);
      });
    });
  }

  function addPostByName (keyspace, username, content, content_type, timestamp, isprivate, ispersonal, next) {
    api.user.getUserByName(keyspace, username, function (err, user) {
      if (err || !user) { return next(err); }
      addPost(keyspace, user.user, content, content_type, timestamp, isprivate, ispersonal, next);
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
      post.content = api.common.convertContentFromCassandra(post.content, post.content_type);
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
