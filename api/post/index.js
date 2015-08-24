var _ = require('lodash');

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
module.exports = function (api) {

  var client = api.client,
      q = client.queries;

  function addPost (keyspace, user, content, content_type, timestamp, visibility, altid, next) {

    if (!next) { next = altid; altid = null; }

    var post = client.generateId();

    var convertedContent = api.common.convertContentToString(content, content_type);
    var originalContent = api.common.convertContentFromString(convertedContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not saved.')); }

    var data = [post, user, convertedContent, content_type, timestamp, visibility, altid];
    var object = _.object(['post', 'user', 'convertedContent', 'content_type', 'timestamp', 'visibility', 'altid'], data);

    client.execute(q(keyspace, 'upsertPost'), data, {prepare: true}, function (err, result) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.feed.addFeedItem(keyspace, user, object, 'post', function (err, result) {
        if (err) { return next(err); }
        var tempPost = {
          post: post,
          user: user,
          content: originalContent,
          content_type: content_type,
          posted: timestamp,
          visibility: visibility,
          altid: altid
        };
        api.user.mapUserIdToUser(keyspace, tempPost, ['user'], user, next);
      });
    });
  }

  function updatePost (keyspace, post, content, content_type, visibility, next) {
    _updatePost(keyspace, post, content, content_type, visibility, next);
  }

  function updatePostByAltid (keyspace, altid, content, content_type, visibility, next) {
    api.common.get(keyspace, 'selectPostByAltid', [altid], 'one', function (err, post) {
      if (err) { return next(err); }
      _updatePost(keyspace, post.post, content, content_type, visibility, next);
    });
  }

  function _updatePost (keyspace, post, content, content_type, visibility, next) {

    var convertedContent = api.common.convertContentToString(content, content_type);
    var originalContent = api.common.convertContentFromString(convertedContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not updated.')); }

    var data = [convertedContent, content_type, visibility, post];

    client.execute(q(keyspace, 'updatePost'), data, {prepare: true, cacheKey: 'post:' + post}, function (err, result) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      next(null, {status: 'updated'});
    });

  }

  function removePost (keyspace, user, post, next) {
    getPost(keyspace, user, post, function (err, postItem) {
      if (err) { return next(err); }
      _removePost(keyspace, postItem.post, next);
    });
  }

  function removePostByAltid (keyspace, user, altid, next) {
    getPostByAltid(keyspace, user, altid, function (err, postItem) {
      if (err) { return next(err); }
      _removePost(keyspace, postItem.post, next);
    });
  }

  function _removePost (keyspace, post, next) {
    var deleteData = [post];
    client.execute(q(keyspace, 'removePost'), deleteData, {prepare: true, cacheKey: 'post:' + post}, function (err, result) {
      if (err) return next(err);
      api.feed.removeFeedsForItem(keyspace, post, function (err) {
        if (err) return next(err);
        next(null, {status: 'removed'});
      });
    });
  }

  function getPostFromObject (keyspace, liu, item, next) {
    var postObject = api.common.expandEmbeddedObject(item, 'post', 'post');
    api.friend.userCanSeeItem(keyspace, liu, postObject, ['user'], function (err) {
      if (err) { return next(err); }
      postObject.content = api.common.convertContentFromString(postObject.content, postObject.content_type);
      api.user.mapUserIdToUser(keyspace, item, ['user'], liu, true, function (err, objectWithUsers) {
        postObject.user = objectWithUsers.user;
        next(err, postObject);
      });
    });
  }

  function getPost (keyspace, liu, post, expandUser, next) {
    if (!next) { next = expandUser; expandUser = true; }
    client.get(q(keyspace, 'selectPost'), [post], {cacheKey: 'post:' + post}, function (err, post) {
      if (err) { return next(err); }
      if (!post) { return next({statusCode: 404, message: 'Post not found'}); }
      post.content = api.common.convertContentFromString(post.content, post.content_type);
      api.friend.userCanSeeItem(keyspace, liu, post, ['user'], function (err) {
        if (err) { return next(err); }
        api.user.mapUserIdToUser(keyspace, post, ['user'], liu, expandUser, next);
      });
    });
  }

  function getPostByAltid (keyspace, liu, altid, next) {
    api.common.get(keyspace, 'selectPostByAltid', [altid], 'one', function (err, post) {
      if (err) { return next(err); }
      post.content = api.common.convertContentFromString(post.content, post.content_type);
      api.friend.userCanSeeItem(keyspace, liu, post, ['user'], function (err) {
        if (err) { return next(err); }
        api.user.mapUserIdToUser(keyspace, post, ['user'], liu, next);
      });
    });
  }

  return {
    addPost: addPost,
    removePost: removePost,
    removePostByAltid: removePostByAltid,
    getPost: getPost,
    getPostByAltid: getPostByAltid,
    getPostFromObject: getPostFromObject,
    updatePost: updatePost,
    updatePostByAltid: updatePostByAltid
  };

};
