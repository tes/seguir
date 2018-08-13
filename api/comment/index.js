var _ = require('lodash');
var async = require('async');
var debug = require('debug')('seguir:comment');

module.exports = function (api) {
  var client = api.client;
  var q = client.queries;

  function createComment (keyspace, user, post, commented, commentdata, next) {
    var newCommentRow = [client.generateId(), user, post, commented, commentdata];
    var newComment = _.zipObject(['comment', 'user', 'post', 'commented', 'commentdata'], newCommentRow);

    async.parallel([
      function getNewComment (cb) {
        api.user.mapUserIdToUser(keyspace, newComment, ['user'], cb);
      },
      function insertComment (cb) {
        debug('insert into comments:', 'comments', newCommentRow);
        client.execute(q(keyspace, 'insertComment'), newCommentRow, {}, cb);
      },
      function insertCommentsTimeline (cb) {
        var newCommentTimelineRow = [post, client.generateTimeId(commented), newComment.comment];
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
        next(null, results[0]);
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

      commentRecord.commentdata = commentdata;
      async.parallel([
        function (cb) {
          api.user.mapUserIdToUser(keyspace, commentRecord, ['user'], cb);
        },
        function (cb) {
          var commentUpdate = [commentdata, comment];
          debug('update comment:', 'comments', commentUpdate);
          client.execute(q(keyspace, 'updateComment'), commentUpdate, {cacheKey: 'comment:' + comment}, cb);
        }
      ], function (err, results) {
        if (err) { return next(err); }

        next(null, results[0]);
      });
    });
  }

  function deleteComment (keyspace, user, comment, next) {
    client.get(q(keyspace, 'selectComment'), [comment], {cacheKey: 'comment:' + comment}, function (err, commentRecord) {
      if (err) { return next(err); }
      if (commentRecord.user.toString() !== user.toString()) {
        return next(new Error('Unable to delete comment created by user ' + commentRecord.user));
      }

      var commentDeletion = [comment];
      debug('delete comment:', 'comments', commentDeletion);
      client.execute(q(keyspace, 'deleteComment'), commentDeletion, {cacheKey: 'comment:' + comment}, function (err) {
        if (err) { return next(err); }

        var countUpdate = [-1, commentRecord.post.toString()];
        debug('update comment counts:', 'counts', countUpdate);
        client.execute(q(keyspace, 'updateCounter', {TYPE: 'comment'}), countUpdate, {cacheKey: 'count:comment:' + commentRecord.post}, next);
      });
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
            debug('select comment:', 'comments', [timelineEntry.comment]);
            client.get(q(keyspace, 'selectComment'), [timelineEntry.comment], {cacheKey: 'comment:' + timelineEntry.comment}, function (err, comment) {
              if (err || !comment) { return cb(err); }

              api.like.checkLike(keyspace, liu, comment.comment, function (err, likeStatus) {
                if (err) { return cb(err); }

                comment.userLiked = likeStatus.userLiked;
                comment.likedTotal = likeStatus.likedTotal;
                cb(null, comment);
              });
            });
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
    deleteComment: deleteComment
  };
};
