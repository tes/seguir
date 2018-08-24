var _ = require('lodash');
var async = require('async');
var debug = require('debug')('seguir:comment');

module.exports = function (api) {
  var client = api.client;
  var q = client.queries;

  function getComment (keyspace, liu, comment, next) {
    debug('select comment:', 'comments', [comment]);
    client.get(q(keyspace, 'selectComment'), [comment], {cacheKey: 'comment:' + comment}, function (err, result) {
      if (err || !result) { return next(err); }

      api.like.checkLike(keyspace, liu, comment, function (err, likeStatus) {
        if (err) { return next(err); }

        result.userLiked = likeStatus.userLiked;
        result.likedTotal = likeStatus.likedTotal;
        next(null, result);
      });
    });
  }

  function createComment (keyspace, user, post, commented, commentdata, next) {
    var comment = client.generateId();
    var newCommentRow = [comment, user, post, commented, commentdata];

    async.parallel([
      function insertComment (cb) {
        debug('insert into comments:', 'comments', newCommentRow);
        client.execute(q(keyspace, 'insertComment'), newCommentRow, {}, cb);
      },
      function insertCommentsTimeline (cb) {
        var newCommentTimelineRow = [post, client.generateTimeId(commented), comment];
        debug('insert into comments timeline:', 'comments_timeline', newCommentTimelineRow);
        client.execute(q(keyspace, 'insertCommentsTimeline'), newCommentTimelineRow, {}, cb);
      }
    ], function (err, results) {
      if (err) { return next(err); }

      var countUpdate = [1, post.toString()];
      debug('update comment counts:', 'counts', countUpdate);
      client.execute(q(keyspace, 'updateCounter', {TYPE: 'comment'}), countUpdate, {cacheKey: 'count:comment:' + post}, function (err) {
        if (err) { return next(err); }

        api.metrics.increment('comment.add');
        getComment(keyspace, user, comment, function (err, newComment) {
          if (err) { return next(err); }
          api.user.mapUserIdToUser(keyspace, newComment, ['user'], next);
        });
      });
    });
  }

  function updateComment (keyspace, user, comment, commentdata, next) {
    debug('select comment:', 'comments', [comment]);
    client.get(q(keyspace, 'selectComment'), [comment], {cacheKey: 'comment:' + comment}, function (err, commentRecord) {
      if (err) { return next(err); }
      if (commentRecord.user.toString() !== user.toString()) {
        return next(new Error('Unable to update comment created by user ' + commentRecord.user));
      }

      var commentUpdate = [commentdata, comment];
      debug('update comment:', 'comments', commentUpdate);
      client.execute(q(keyspace, 'updateComment'), commentUpdate, {cacheKey: 'comment:' + comment}, function (err) {
        if (err) { return next(err); }

        getComment(keyspace, user, comment, function (err, updatedComment) {
          if (err) { return next(err); }
          api.user.mapUserIdToUser(keyspace, updatedComment, ['user'], next);
        });
      });
    });
  }

  function _deleteComment (keyspace, comment, next) {
    var commentDeletion = [comment.comment];
    debug('delete comment:', 'comments', commentDeletion);
    client.execute(q(keyspace, 'deleteComment'), commentDeletion, {cacheKey: 'comment:' + comment.comment}, function (err) {
      if (err) { return next(err); }

      var countUpdate = [-1, comment.post.toString()];
      debug('update comment counts:', 'counts', countUpdate);
      client.execute(q(keyspace, 'updateCounter', {TYPE: 'comment'}), countUpdate, {cacheKey: 'count:comment:' + comment.post}, next);
    });
  }

  function deleteComment (keyspace, user, comment, next) {
    client.get(q(keyspace, 'selectComment'), [comment], {cacheKey: 'comment:' + comment}, function (err, commentRecord) {
      if (err) { return next(err); }
      if (commentRecord.user.toString() !== user.toString()) {
        return next(new Error('Unable to delete comment created by user ' + commentRecord.user));
      }
      _deleteComment(keyspace, commentRecord, next);
    });
  }

  function deleteCommentsByUser (keyspace, user, next) {
    client.execute(q(keyspace, 'selectCommentsByUser'), [user], function (err, results) {
      if (err) { return next(err); }
      async.each(results, function (comment, cb) {
        _deleteComment(keyspace, comment, cb);
      }, next);
    });
  }

  // returns upto latest 5000 (default fetchSize of cassandra-driver) comments for a post
  function getComments (keyspace, liu, post, next) {
    client.get(q(keyspace, 'selectCount', {TYPE: 'comment'}), [post.toString()], {cacheKey: 'count:comment:' + post}, function (err, result) {
      if (err) { return next(err); }

      if (result && +result.count > 0) {
        api.metrics.increment('comments_timeline.list');
        debug('select comments timeline:', 'comments_timeline', [post]);
        client.execute(q(keyspace, 'selectCommentsTimeline'), [post], {}, function (err, timeline, nextPageState) {
          if (err) { return next(err); }

          async.mapSeries(timeline, function (timelineEntry, cb) {
            getComment(keyspace, liu, timelineEntry.comment, cb);
          }, function (err, comments) {
            if (err) { return next(err); }

            api.user.mapUserIdToUser(keyspace, comments.filter(_.identity), ['user'], function (err, commentsWithUser) {
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
  }

  return {
    createComment: createComment,
    getComments: getComments,
    updateComment: updateComment,
    deleteComment: deleteComment,
    deleteCommentsByUser: deleteCommentsByUser
  };
};
