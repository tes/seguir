var _ = require('lodash');
var async = require('async');
var debug = require('debug')('seguir:comment');

module.exports = function (api) {
  var client = api.client;
  var q = client.queries;

  function createComment (keyspace, user, post, commented, commentdata, next) {
    var comment = client.generateId();
    var newCommentRow = [comment, user, post, commented, commentdata];

    debug('insert into comments:', 'comments', newCommentRow);
    client.execute(q(keyspace, 'insertComment'), newCommentRow, {}, function (err, result) {
      if (err) { return next(err); }

      var newCommentTimelineRow = [post, client.generateTimeId(commented), comment];
      debug('insert into comments timeline:', 'comments_timeline', newCommentTimelineRow);
      client.execute(q(keyspace, 'insertCommentsTimeline'), newCommentTimelineRow, {}, function (err, result) {
        if (err) { return next(err); }

        var countUpdate = [1, post.toString()];
        debug('update comment counts:', 'counts', countUpdate);
        client.execute(q(keyspace, 'updateCounter', {TYPE: 'comment'}), countUpdate, {cacheKey: 'count:comment:' + post}, function (err, result) {
          if (err) { return next(err); }

          var newComment = _.zipObject(['comment', 'user', 'post', 'commented', 'commentdata'], newCommentRow);
          api.metrics.increment('comment.add');
          api.user.mapUserIdToUser(keyspace, newComment, ['user'], null, next);
        });
      });
    });
  }

  function updateComment (keyspace, comment, commentdata, next) {
    var commentUpdate = [commentdata, comment];
    debug('update comment:', 'comments', commentUpdate);
    client.execute(q(keyspace, 'updateComment'), commentUpdate, {cacheKey: 'comment:' + comment}, function (err, result) {
      if (err) { return next(err); }

      debug('select comment:', 'comments', [comment]);
      client.get(q(keyspace, 'selectComment'), [comment], {cacheKey: 'comment:' + comment}, function (err, comment) {
        if (err) { return next(err); }

        api.user.mapUserIdToUser(keyspace, comment, ['user'], null, next);
      });
    });
  }

  function deleteComment (keyspace, comment, next) {
    client.get(q(keyspace, 'selectComment'), [comment], {cacheKey: 'comment:' + comment}, function (err, result) {
      if (err) { return next(err); }

      var countUpdate = [-1, result.post.toString()];
      debug('update comment counts:', 'counts', countUpdate);
      client.execute(q(keyspace, 'updateCounter', {TYPE: 'comment'}), countUpdate, {cacheKey: 'count:comment:' + result.post}, function (err, result) {
        if (err) { return next(err); }

        var commentDeletion = [comment];
        debug('delete comment:', 'comments', commentDeletion);
        client.execute(q(keyspace, 'deleteComment'), commentDeletion, {cacheKey: 'comment:' + comment}, function (err, result) {
          if (err) { return next(err); }

          next();
        });
      });
    });
  }

  // returns upto latest 5000 (default fetchSize of cassandra-driver) comments for a post
  function getComments (keyspace, post, options, next) {
    if (!next) {
      next = options;
      options = {};
    }

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
              if (err) { return cb(err); }
              cb(null, comment);
            });
          }, function (err, comments) {
            if (err) { return next(err); }

            api.user.mapUserIdToUser(keyspace, comments.filter(_.identity), ['user'], null, true, {}, function (err, commentsWithUser) {
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
