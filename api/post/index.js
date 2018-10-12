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
    client.execute(q(keyspace, 'upsertPost'), data, {}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }

      var object = _.zipObject(['post', 'user', 'group', 'convertedContent', 'content_type', 'timestamp', 'visibility', 'altid'], data);
      api.feed.addFeedItem(keyspace, user, object, 'post', function (err) {
        if (err) { return next(err); }
        getPost(keyspace, user, post, true, next);
        api.metrics.increment('post.add');
      });
    });
  }

  function _addPostToGroup (keyspace, group, user, content, content_type, timestamp, visibility, altid, next) {
    var post = client.generateId();

    var convertedContent = api.common.convertContentToString(content, content_type);
    var originalContent = api.common.convertContentFromString(convertedContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not saved.')); }

    var data = [post, user, group, convertedContent, content_type, timestamp, visibility, altid];
    client.execute(q(keyspace, 'upsertPost'), data, {}, function (err) {
      /* istanbul ignore if */
      if (err) { return next(err); }

      var object = _.zipObject(['post', 'user', 'group', 'convertedContent', 'content_type', 'timestamp', 'visibility', 'altid'], data);
      api.feed.addFeedItemToGroup(keyspace, group, user, object, 'post', function (err) {
        if (err) { return next(err); }
        getPost(keyspace, user, post, true, next);
        api.metrics.increment('post.toGroup.add');
      });
    });
  }

  function isUserGroupMember (keyspace, user, group, next) {
    client.get(q(keyspace, 'selectMemberByUserAndGroup'), [user, group], {}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'User ' + user + ' is not a member of group ' + group)); }
      next(null, result);
    });
  }

  function addPostToGroup (keyspace, group, user, content, content_type, timestamp, visibility, altid, next) {
    if (!next) { next = altid; altid = null; }

    isUserGroupMember(keyspace, user, group, function (err) {
      if (err) { return next(err); }
      _addPostToGroup(keyspace, group, user, content, content_type, timestamp, visibility, altid, next);
    });
  }

  function updatePost (keyspace, user, post, content, content_type, visibility, next) {
    getPost(keyspace, user, post, function (err, postItem) {
      if (err) { return next(err); }
      if (postItem.user.user.toString() !== user.toString()) {
        return next(new Error('Unable to update the post, only author can update it.'));
      }
      _updatePost(keyspace, postItem, content, content_type, visibility, next);
    });
  }

  function updatePostByAltid (keyspace, altid, content, content_type, visibility, next) {
    api.common.get(keyspace, 'selectPostByAltid', [altid], 'one', function (err, postItem) {
      if (err) { return next(err); }
      _updatePost(keyspace, postItem, content, content_type, visibility, next);
    });
  }

  function _updatePost (keyspace, post, content, content_type, visibility, next) {
    var convertedContent = api.common.convertContentToString(content, content_type);
    var originalContent = api.common.convertContentFromString(convertedContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not updated.')); }

    var data = [convertedContent, content_type, visibility, post.post];

    client.execute(q(keyspace, 'updatePost'), data, {cacheKey: 'post:' + post.post}, function (err, result) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.metrics.increment('post.update');
      next(null, Object.assign({}, post, {
        content: originalContent,
        conent_type: content_type,
        visibility: visibility
      }));
    });
  }

  function removePost (keyspace, user, post, next) {
    getPost(keyspace, user, post, function (err, postItem) {
      if (err) { return next(err); }
      if (postItem.user.user.toString() !== user.toString()) {
        return next(new Error('Unable to remove the post, only author can remove it.'));
      }
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

  function removePostsByUser (keyspace, user, next) {
    client.execute(q(keyspace, 'selectPostsByUser'), [user], function (err, results) {
      if (err) { return next(err); }
      async.each(results, function (post, cb) {
        _removePost(keyspace, post.post, cb);
      }, next);
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

  function moderatePost (keyspace, autoModeratedBy, username, altid, user, group, post, next) {
    api.moderate.isUserModerator(keyspace, autoModeratedBy, altid, user, group, function (err, moderator) {
      if (err) { return next(err); }
      if (moderator && !moderator.isUserModerator) {
        return next(new Error('Unable to moderate the post, only moderator can moderate it.'));
      }
      var moderationData = [autoModeratedBy || username, post];
      client.execute(q(keyspace, 'moderatePost'), moderationData, {cacheKey: 'post:' + post}, function (err, result) {
        /* istanbul ignore if */
        if (err) { return next(err); }
        api.metrics.increment('post.moderate');
        client.get(q(keyspace, 'selectPost'), [post], {cacheKey: 'post:' + post}, function (err, postItem) {
          if (err) { return next(err); }
          postItem.content = api.common.convertContentFromString(postItem.content, postItem.content_type);
          next(null, postItem);
        });
      });
    });
  }

  function unmoderatePost (keyspace, altid, user, group, post, next) {
    api.moderate.isUserModerator(keyspace, null, altid, user, group, function (err, moderator) {
      if (err) { return next(err); }
      if (moderator && !moderator.isUserModerator) {
        return next(new Error('Unable to moderate the post, only moderator can moderate it.'));
      }
      var moderationData = [null, post];
      client.execute(q(keyspace, 'moderatePost'), moderationData, {cacheKey: 'post:' + post}, function (err, result) {
        /* istanbul ignore if */
        if (err) { return next(err); }
        api.metrics.increment('post.unmoderate');
        client.get(q(keyspace, 'selectPost'), [post], {cacheKey: 'post:' + post}, function (err, postItem) {
          if (err) { return next(err); }
          postItem.content = api.common.convertContentFromString(postItem.content, postItem.content_type);
          next(null, postItem);
        });
      });
    });
  }

  function _validatePost (keyspace, liu, post, expandUser, next) {
    post.content = api.common.convertContentFromString(post.content, post.content_type);
    api.friend.userCanSeeItem(keyspace, liu, post, ['user'], function (err) {
      if (err) { return next(err); }

      api.like.checkLike(keyspace, liu, post.post, function (err, likeStatus) {
        if (err) { return next(err); }

        post.userLiked = likeStatus.userLiked;
        post.likedTotal = likeStatus.likedTotal;
        api.comment.getComments(keyspace, liu, post.post, function (err, commentsTimeline) {
          if (err) { return next(err); }

          post.commentsTimeline = commentsTimeline;
          api.user.mapUserIdToUser(keyspace, post, ['user'], expandUser, next);
        });
      });
    });
  }

  function getPostFromObject (keyspace, liu, item, next) {
    var post = api.common.expandEmbeddedObject(item, 'post', 'post');
    post.user = item.user;
    _validatePost(keyspace, liu, post, true, next);
  }

  function getPost (keyspace, liu, post, expandUser, next) {
    if (!next) { next = expandUser; expandUser = true; }
    client.get(q(keyspace, 'selectPost'), [post], {cacheKey: 'post:' + post}, function (err, post) {
      if (err) { return next(err); }
      if (!post) { return next({statusCode: 404, message: 'Post not found'}); }
      _validatePost(keyspace, liu, post, expandUser, next);
    });
  }

  function getPostByAltid (keyspace, liu, altid, next) {
    api.common.get(keyspace, 'selectPostByAltid', [altid], 'one', function (err, post) {
      if (err) { return next(err); }
      _validatePost(keyspace, liu, post, true, next);
    });
  }

  function getPostsByAltid (keyspace, liu, altid, next) {
    api.common.get(keyspace, 'selectPostByAltid', [altid], 'many', function (err, posts) {
      if (err) { return next(err); }
      var userCanSeeItems = [];
      var userCanSeeItemError = null;
      async.map(posts, function (post, cb) {
        _validatePost(keyspace, liu, post, true, function (err2, item) {
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
    removePostsByUser: removePostsByUser,
    getPost: getPost,
    getPostByAltid: getPostByAltid,
    getPostsByAltid: getPostsByAltid,
    getPostFromObject: getPostFromObject,
    updatePost: updatePost,
    updatePostByAltid: updatePostByAltid,
    moderatePost: moderatePost,
    unmoderatePost: unmoderatePost
  };
};
