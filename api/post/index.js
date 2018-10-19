const _ = require('lodash');
const async = require('async');

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
module.exports = (api) => {
  const client = api.client;
  const q = client.queries;

  const addPost = (keyspace, user, content, content_type, timestamp, visibility, altid, next) => {
    if (!next) { next = altid; altid = null; }

    const group = null;
    const post = client.generateId();

    const convertedContent = api.common.convertContentToString(content, content_type);
    const originalContent = api.common.convertContentFromString(convertedContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not saved.')); }

    const data = [post, user, group, convertedContent, content_type, timestamp, visibility, altid];
    client.execute(q(keyspace, 'upsertPost'), data, {}, (err) => {
      /* istanbul ignore if */
      if (err) { return next(err); }

      const object = _.zipObject(['post', 'user', 'group', 'convertedContent', 'content_type', 'timestamp', 'visibility', 'altid'], data);
      api.feed.addFeedItem(keyspace, user, object, 'post', (err) => {
        if (err) { return next(err); }
        getPost(keyspace, user, post, true, next);
        api.metrics.increment('post.add');
      });
    });
  };

  const _addPostToGroup = (keyspace, group, user, content, content_type, timestamp, visibility, altid, next) => {
    const post = client.generateId();

    const convertedContent = api.common.convertContentToString(content, content_type);
    const originalContent = api.common.convertContentFromString(convertedContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not saved.')); }

    const data = [post, user, group, convertedContent, content_type, timestamp, visibility, altid];
    client.execute(q(keyspace, 'upsertPost'), data, {}, (err) => {
      /* istanbul ignore if */
      if (err) { return next(err); }

      const object = _.zipObject(['post', 'user', 'group', 'convertedContent', 'content_type', 'timestamp', 'visibility', 'altid'], data);
      api.feed.addFeedItemToGroup(keyspace, group, user, object, 'post', (err) => {
        if (err) { return next(err); }
        getPost(keyspace, user, post, true, next);
        api.metrics.increment('post.toGroup.add');
      });
    });
  };

  const isUserGroupMember = (keyspace, user, group, next) => {
    client.get(q(keyspace, 'selectMemberByUserAndGroup'), [user, group], {}, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'User ' + user + ' is not a member of group ' + group)); }
      next(null, result);
    });
  };

  const addPostToGroup = (keyspace, group, user, content, content_type, timestamp, visibility, altid, next) => {
    if (!next) { next = altid; altid = null; }

    isUserGroupMember(keyspace, user, group, (err) => {
      if (err) { return next(err); }
      _addPostToGroup(keyspace, group, user, content, content_type, timestamp, visibility, altid, next);
    });
  };

  const updatePost = (keyspace, user, post, content, content_type, visibility, next) => {
    getPost(keyspace, user, post, (err, postItem) => {
      if (err) { return next(err); }
      if (postItem.user.user.toString() !== user.toString()) {
        return next(new Error('Unable to update the post, only author can update it.'));
      }
      _updatePost(keyspace, postItem, content, content_type, visibility, next);
    });
  };

  const updatePostByAltid = (keyspace, altid, content, content_type, visibility, next) => {
    api.common.get(keyspace, 'selectPostByAltid', [altid], 'one', (err, postItem) => {
      if (err) { return next(err); }
      _updatePost(keyspace, postItem, content, content_type, visibility, next);
    });
  };

  const _updatePost = (keyspace, post, content, content_type, visibility, next) => {
    const convertedContent = api.common.convertContentToString(content, content_type);
    const originalContent = api.common.convertContentFromString(convertedContent, content_type);
    if (!originalContent) { return next(new Error('Unable to parse input content, post not updated.')); }

    const data = [convertedContent, content_type, visibility, post.post];

    client.execute(q(keyspace, 'updatePost'), data, {cacheKey: 'post:' + post.post}, (err, result) => {
      /* istanbul ignore if */
      if (err) { return next(err); }
      api.metrics.increment('post.update');
      next(null, Object.assign({}, post, {
        content: originalContent,
        conent_type: content_type,
        visibility: visibility
      }));
    });
  };

  const removePost = (keyspace, user, post, next) => {
    getPost(keyspace, user, post, (err, postItem) => {
      if (err) { return next(err); }
      if (postItem.user.user.toString() !== user.toString()) {
        return next(new Error('Unable to remove the post, only author can remove it.'));
      }
      _removePost(keyspace, postItem.post, next);
    });
  };

  const removePostByAltid = (keyspace, user, altid, next) => {
    getPostByAltid(keyspace, user, altid, (err, postItem) => {
      if (err) { return next(err); }
      _removePost(keyspace, postItem.post, next);
    });
  };

  const removePostsByAltid = (keyspace, user, altid, next) => {
    getPostsByAltid(keyspace, user, altid, (errGet, posts) => {
      if (errGet) { return next(errGet); }
      async.map(posts, (postItem, cb) => {
        _removePost(keyspace, postItem.post, cb);
      }, (errRemove, status) => {
        next(errRemove, status && status.length ? status[0] : status);
      });
    });
  };

  const removePostsByUser = (keyspace, user, next) => {
    client.execute(q(keyspace, 'selectPostsByUser'), [user], (err, results) => {
      if (err) { return next(err); }
      async.each(results, (post, cb) => {
        _removePost(keyspace, post.post, cb);
      }, next);
    });
  };

  const _removePost = (keyspace, post, next) => {
    const deleteData = [post];
    client.execute(q(keyspace, 'removePost'), deleteData, {cacheKey: 'post:' + post}, (err, result) => {
      if (err) return next(err);
      api.feed.removeFeedsForItem(keyspace, post, (err) => {
        if (err) return next(err);
        api.metrics.increment('post.remove');
        next(null, {status: 'removed'});
      });
    });
  };

  const _validatePost = (keyspace, liu, post, expandUser, next) => {
    post.content = api.common.convertContentFromString(post.content, post.content_type);
    api.friend.userCanSeeItem(keyspace, liu, post, ['user'], (err) => {
      if (err) { return next(err); }

      api.like.checkLike(keyspace, liu, post.post, (err, likeStatus) => {
        if (err) { return next(err); }

        post.userLiked = likeStatus.userLiked;
        post.likedTotal = likeStatus.likedTotal;
        api.comment.getComments(keyspace, liu, post.post, (err, commentsTimeline) => {
          if (err) { return next(err); }

          post.commentsTimeline = commentsTimeline;
          api.user.mapUserIdToUser(keyspace, post, ['user'], expandUser, next);
        });
      });
    });
  };

  const getPostFromObject = (keyspace, liu, item, next) => {
    const post = api.common.expandEmbeddedObject(item, 'post', 'post');
    post.user = item.user;
    _validatePost(keyspace, liu, post, true, next);
  };

  const getPost = (keyspace, liu, post, expandUser, next) => {
    if (!next) { next = expandUser; expandUser = true; }
    client.get(q(keyspace, 'selectPost'), [post], {cacheKey: 'post:' + post}, (err, post) => {
      if (err) { return next(err); }
      if (!post) { return next({statusCode: 404, message: 'Post not found'}); }
      _validatePost(keyspace, liu, post, expandUser, next);
    });
  };

  const getPostByAltid = (keyspace, liu, altid, next) => {
    api.common.get(keyspace, 'selectPostByAltid', [altid], 'one', (err, post) => {
      if (err) { return next(err); }
      _validatePost(keyspace, liu, post, true, next);
    });
  };

  const getPostsByAltid = (keyspace, liu, altid, next) => {
    api.common.get(keyspace, 'selectPostByAltid', [altid], 'many', (err, posts) => {
      if (err) { return next(err); }
      const userCanSeeItems = [];
      let userCanSeeItemError = null;
      async.map(posts, (post, cb) => {
        _validatePost(keyspace, liu, post, true, (err2, item) => {
          if (err2) {
            userCanSeeItemError = err2;
          } else {
            userCanSeeItems.push(item);
          }
          cb(null);
        });
      }, () => {
        // in the above loop, if _validatePost return error for 1 of item,
        // all the unerrored posts will be ignored in this callback
        // so we need to error only when _validatePost error for all items
        if (userCanSeeItems.length === 0) { return next(userCanSeeItemError); }
        next(null, userCanSeeItems);
      });
    });
  };

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
    updatePostByAltid: updatePostByAltid
  };
};
