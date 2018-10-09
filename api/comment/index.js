const _ = require('lodash');
const async = require('async');
const debug = require('debug')('seguir:comment');

module.exports = (api) => {
  const client = api.client;
  const q = client.queries;

  const getComment = (keyspace, liu, comment, next) => {
    debug('select comment:', 'comments', [comment]);
    client.get(q(keyspace, 'selectComment'), [comment], {cacheKey: 'comment:' + comment}, (err, result) => {
      if (err || !result) { return next(err); }

      api.like.checkLike(keyspace, liu, comment, (err, likeStatus) => {
        if (err) { return next(err); }

        result.userLiked = likeStatus.userLiked;
        result.likedTotal = likeStatus.likedTotal;
        next(null, result);
      });
    });
  };

  const createComment = (keyspace, user, post, commented, commentdata, next) => {
    const comment = client.generateId();
    const newCommentRow = [comment, user, post, commented, commentdata];

    async.parallel([
      (cb) => {
        debug('insert into comments:', 'comments', newCommentRow);
        client.execute(q(keyspace, 'insertComment'), newCommentRow, {}, cb);
      },
      (cb) => {
        const newCommentTimelineRow = [post, client.generateTimeId(commented), comment];
        debug('insert into comments timeline:', 'comments_timeline', newCommentTimelineRow);
        client.execute(q(keyspace, 'insertCommentsTimeline'), newCommentTimelineRow, {}, cb);
      }
    ], (err, results) => {
      if (err) { return next(err); }

      const countUpdate = [1, post.toString()];
      debug('update comment counts:', 'counts', countUpdate);
      client.execute(q(keyspace, 'updateCounter', {TYPE: 'comment'}), countUpdate, {cacheKey: 'count:comment:' + post}, err => {
        if (err) { return next(err); }

        api.metrics.increment('comment.add');
        getComment(keyspace, user, comment, (err, newComment) => {
          if (err) { return next(err); }
          api.user.mapUserIdToUser(keyspace, newComment, ['user'], next);
        });
      });
    });
  };

  const updateComment = (keyspace, user, comment, commentdata, next) => {
    debug('select comment:', 'comments', [comment]);
    client.get(q(keyspace, 'selectComment'), [comment], {cacheKey: 'comment:' + comment}, (err, commentRecord) => {
      if (err) { return next(err); }
      if (commentRecord.user.toString() !== user.toString()) {
        return next(new Error('Unable to update comment created by user ' + commentRecord.user));
      }

      const commentUpdate = [commentdata, comment];
      debug('update comment:', 'comments', commentUpdate);
      client.execute(q(keyspace, 'updateComment'), commentUpdate, {cacheKey: 'comment:' + comment}, err => {
        if (err) { return next(err); }

        getComment(keyspace, user, comment, (err, updatedComment) => {
          if (err) { return next(err); }
          api.user.mapUserIdToUser(keyspace, updatedComment, ['user'], next);
        });
      });
    });
  };

  const _deleteComment = (keyspace, comment, next) => {
    const commentDeletion = [comment.comment];
    debug('delete comment:', 'comments', commentDeletion);
    client.execute(q(keyspace, 'deleteComment'), commentDeletion, {cacheKey: 'comment:' + comment.comment}, err => {
      if (err) { return next(err); }

      const countUpdate = [-1, comment.post.toString()];
      debug('update comment counts:', 'counts', countUpdate);
      client.execute(q(keyspace, 'updateCounter', {TYPE: 'comment'}), countUpdate, {cacheKey: 'count:comment:' + comment.post}, next);
    });
  };

  const deleteComment = (keyspace, user, comment, next) => {
    client.get(q(keyspace, 'selectComment'), [comment], {cacheKey: 'comment:' + comment}, (err, commentRecord) => {
      if (err) { return next(err); }
      if (commentRecord.user.toString() !== user.toString()) {
        return next(new Error('Unable to delete comment created by user ' + commentRecord.user));
      }
      _deleteComment(keyspace, commentRecord, next);
    });
  };

  const deleteCommentsByUser = (keyspace, user, next) => {
    client.execute(q(keyspace, 'selectCommentsByUser'), [user], (err, results) => {
      if (err) { return next(err); }
      async.each(results, (comment, cb) => {
        _deleteComment(keyspace, comment, cb);
      }, next);
    });
  };

  // returns upto latest 5000 (default fetchSize of cassandra-driver) comments for a post
  const getComments = (keyspace, liu, post, next) => {
    client.get(q(keyspace, 'selectCount', {TYPE: 'comment'}), [post.toString()], {cacheKey: 'count:comment:' + post}, (err, result) => {
      if (err) { return next(err); }

      if (result && +result.count > 0) {
        api.metrics.increment('comments_timeline.list');
        debug('select comments timeline:', 'comments_timeline', [post]);
        client.execute(q(keyspace, 'selectCommentsTimeline'), [post], {}, (err, timeline, nextPageState) => {
          if (err) { return next(err); }

          async.mapSeries(timeline, (timelineEntry, cb) => {
            getComment(keyspace, liu, timelineEntry.comment, cb);
          }, (err, comments) => {
            if (err) { return next(err); }

            api.user.mapUserIdToUser(keyspace, comments.filter(_.identity), ['user'], (err, commentsWithUser) => {
              if (err) { return next(err); }

              next(null, {
                total: +result.count,
                comments: commentsWithUser,
                nextPageState: nextPageState
              });
            });
          });
        });
      } else {
        next(null, {
          total: 0,
          comments: [],
          nextPageState: null
        });
      }
    });
  };

  return {
    createComment,
    getComments,
    updateComment,
    deleteComment,
    deleteCommentsByUser
  };
};
