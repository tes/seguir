var _ = require('lodash');
var async = require('async');

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
  var client = api.client;
  var q = client.queries;

  function addPost (keyspace, user, content, content_type, timestamp, visibility, altid, next) {
    if (!next) { next = altid; altid = null; }

    var group = null;
    var post = client.generateId();

    var convertedContent = api.common.convertContentToString(content, content_type);
    var originalContent = api.common.convertContentFromString(convertedContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not saved.')); }

    var data = [post, user, group, convertedContent, content_type, timestamp, visibility, altid];
    var object = _.zipObject(['post', 'user', 'group', 'convertedContent', 'content_type', 'timestamp', 'visibility', 'altid'], data);

    client.execute(q(keyspace, 'upsertPost'), data, {}, function (err, result) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.feed.addFeedItem(keyspace, user, object, 'post', function (err, result) {
        if (err) { return next(err); }
        var tempPost = {
          post: post,
          user: user,
          group: group,
          content: originalContent,
          content_type: content_type,
          posted: timestamp,
          visibility: visibility,
          altid: altid
        };
        api.user.mapUserIdToUser(keyspace, tempPost, ['user'], user, function (err, result) {
          if (err) { return next(err); }
          api.metrics.increment('post.add');
          next(null, { status: 'added', post });
        });
      });
    });
  }

  function addPostToGroup (keyspace, group, user, content, content_type, timestamp, visibility, altid, next) {
    if (!next) { next = altid; altid = null; }

    var post = client.generateId();

    var convertedContent = api.common.convertContentToString(content, content_type);
    var originalContent = api.common.convertContentFromString(convertedContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not saved.')); }

    var data = [post, user, group, convertedContent, content_type, timestamp, visibility, altid];
    var object = _.zipObject(['post', 'user', 'group', 'convertedContent', 'content_type', 'timestamp', 'visibility', 'altid'], data);

    client.execute(q(keyspace, 'upsertPost'), data, {}, function (err, result) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.feed.addFeedItemToGroup(keyspace, group, user, object, 'post', function (err, result) {
        if (err) { return next(err); }
        var tempPost = {
          post: post,
          user: user,
          group: group,
          content: originalContent,
          content_type: content_type,
          posted: timestamp,
          visibility: visibility,
          altid: altid
        };
        api.user.mapUserIdToUser(keyspace, tempPost, ['user'], user, function (err, result) {
          if (err) { return next(err); }
          api.metrics.increment('post.toGroup.add');
          next(null, { status: 'added', post });
        });
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

    client.execute(q(keyspace, 'updatePost'), data, {cacheKey: 'post:' + post}, function (err, result) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.metrics.increment('post.update');
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

  function removePostsByAltid (keyspace, user, altid, next) {
    getPostsByAltid(keyspace, user, altid, function (errGet, posts) {
      if (errGet) { return next(errGet); }
      async.map(posts, function (postItem, cb) {
        _removePost(keyspace, postItem.post, cb);
      }, function (errRemove, status) {
        next(errRemove, status && status.length ? status[0] : status);
      });
    });
  }

  function _removePost (keyspace, post, next) {
    var deleteData = [post];
    client.execute(q(keyspace, 'removePost'), deleteData, {cacheKey: 'post:' + post}, function (err, result) {
      if (err) return next(err);
      api.feed.removeFeedsForItem(keyspace, post, function (err) {
        if (err) return next(err);
        api.metrics.increment('post.remove');
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

  function _validatePost (keyspace, liu, post, next) {
    post.content = api.common.convertContentFromString(post.content, post.content_type);
    api.friend.userCanSeeItem(keyspace, liu, post, ['user'], function (err) {
      if (err) { return next(err); }
      api.user.mapUserIdToUser(keyspace, post, ['user'], liu, next);
    });
  }

  function getPostByAltid (keyspace, liu, altid, next) {
    api.common.get(keyspace, 'selectPostByAltid', [altid], 'one', function (err, post) {
      if (err) { return next(err); }
      _validatePost(keyspace, liu, post, next);
    });
  }

  function getPostsByAltid (keyspace, liu, altid, next) {
    api.common.get(keyspace, 'selectPostByAltid', [altid], 'many', function (err, posts) {
      if (err) { return next(err); }
      var userCanSeeItems = [];
      var userCanSeeItemError = null;
      async.map(posts, function (post, cb) {
        _validatePost(keyspace, liu, post, function (err2, item) {
          if (err2) {
            userCanSeeItemError = err2;
          } else {
            userCanSeeItems.push(item);
          }
          cb(null);
        });
      }, function () {
        // in the above loop, if _validatePost return error for 1 of item,
        // all the unerrored posts will be ignored in this callback
        // so we need to error only when _validatePost error for all items
        if (userCanSeeItems.length === 0) { return next(userCanSeeItemError); }
        next(null, userCanSeeItems);
      });
    });
  }

  return {
    addPost: addPost,
    addPostToGroup: addPostToGroup,
    removePost: removePost,
    removePostByAltid: removePostByAltid,
    removePostsByAltid: removePostsByAltid,
    getPost: getPost,
    getPostByAltid: getPostByAltid,
    getPostsByAltid: getPostsByAltid,
    getPostFromObject: getPostFromObject,
    updatePost: updatePost,
    updatePostByAltid: updatePostByAltid
  };
};
