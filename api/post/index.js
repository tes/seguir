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
module.exports = function (client, messaging, api) {

  var q = client.queries;

  function addPost (keyspace, user, content, content_type, timestamp, isprivate, ispersonal, next) {
    var post = client.generateId();

    // Parse and re-parse the input content, this catches any errors and ensures we don't
    // persist broken data that will subsequently break the feed
    var convertedContent = api.common.convertContentToString(content, content_type);
    var originalContent = api.common.convertContentFromString(convertedContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not saved.')); }

    var data = [post, user, convertedContent, content_type, timestamp, isprivate, ispersonal];
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

  function getPostFromObject (keyspace, liu, postObject, next) {
    api.friend.userCanSeeItem(keyspace, liu, postObject, ['user'], function (err) {
      if (err) { return next(err); }
      postObject.content = api.common.convertContentFromString(postObject.content, postObject.content_type);
      api.user.mapUserIdToUser(keyspace, postObject, ['user', 'user_follower'], postObject.user, next);
    });
  }

  function getPost (keyspace, liu, post, next) {
    api.common.get(keyspace, 'selectPost', [post], 'one', function (err, post) {
      if (err) { return next(err); }
      post.content = api.common.convertContentFromString(post.content, post.content_type);
      api.friend.userCanSeeItem(keyspace, liu, post, ['user'], function (err) {
        if (err) { return next(err); }
        api.user.mapUserIdToUser(keyspace, post, ['user', 'user_follower'], liu, next);
      });
    });
  }

  return {
    addPost: addPost,
    addPostByName: addPostByName,
    removePost: removePost,
    getPost: getPost,
    getPostFromObject: getPostFromObject
  };

};
