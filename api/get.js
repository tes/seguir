var cassandra = require('cassandra-driver');
var async = require('async');
var moment = require('moment');

/**
 * @apiDefine Querying Querying Feeds
 *
 * This is a collection of methods that allow you to query and retrieve social items.
 */
module.exports = function(client, keyspace) {

  var q = require('./queries')(keyspace);

  /**
   * @api {get} /api/feed/:username Get a feed for a user
   * @apiName GetFeed
   * @apiGroup Querying
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves a set of feed items for a specific user
   * @apiParam {String} username the username of the user
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    {"status":"OK"}
   */
  function getFeedForUsername(username, from, limit, next) {
    getUserByUsername(username, function(err, user) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _getFeed(user, from, limit, next);
    });
  }

  /**
   * @api {get} /api/post/:post Get a specific post
   * @apiName GetPost
   * @apiGroup Querying
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves details of a specific post
   * @apiParam {Guid} post The guid of the post
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    {"status":"OK"}
   */
  function getPost(post, next) {
    client.execute(q('selectPost'), [post], {prepare:true}, function(err, result) {
       next(err, result.rows && result.rows[0] ? result.rows[0] : undefined);
    });
  }

  /**
   * @api {get} /api/like/:like Get a specific like
   * @apiName GetLike
   * @apiGroup Querying
   * @apiVersion 1.0.0
   *
   * @apiDescription Retrieves details of a specific like
   * @apiParam {Guid} post The guid of the like
   * @apiSuccessExample
   *    HTTP/1.1 200 OK
   *    {"status":"OK"}
   */
  function getLike(like, next) {
    client.execute(q('selectLike'), [like], {prepare:true}, function(err, result) {
       next(err, result.rows && result.rows[0] ? result.rows[0] : undefined);
    });
  }

  function getFriend(friend, next) {
    client.execute(q('selectFriend'), [friend], {prepare:true}, function(err, result) {
       /* istanbul ignore if */
       if(err || !result.rows || result.rows.length == 0) { return next(err); }
       var friend = result.rows[0] ? result.rows[0] : undefined;
       getUser(friend.user_friend, function(err, user) {
         friend.username_friend = user.username;
         next(null, friend);
       });
    });
  }

  function getFollow(follow, next) {
    client.execute(q('selectFollow'), [follow], {prepare:true}, function(err, result) {
       /* istanbul ignore if */
       if(err || !result.rows || result.rows.length == 0) { return next(err); }
       var follower = result.rows[0] ? result.rows[0] : undefined;
       getUser(follower.user_follower, function(err, user) {
         follower.username_follower = user.username;
         next(null, follower);
       });
    });
  }

  function getFriends(user, next) {
    client.execute(q('selectFriends'), [user], {prepare:true}, function(err, result) {
       next(err, result.rows);
    });
  }

  function getFollowers(user, next) {
    client.execute(q('selectFollowers'), [user], {prepare:true}, function(err, result) {
       next(err, result.rows);
    });
  }

  function getUser(user, next) {
    client.execute(q('selectUser'), [user], {prepare:true}, function(err, result) {
       if(err) { return next(err); }
       next(err, result.rows && result.rows[0] ? result.rows[0] : undefined);
    });
  }

  function getUserByUsername(username, next) {
    client.execute(q('selectUserByUsername'), [username], {prepare:true}, function(err, result) {
       /* istanbul ignore if */
       if(err) { return next(err); }
       next(err, result.rows && result.rows[0] ? result.rows[0] : undefined);
    });
  }

  function checkLike(username, item, next) {
    getUserByUsername(username, function(err, user) {
      client.execute(q('checkLike'), [user.user, item], {prepare:true}, function(err, result) {
         next(err, result.rows && result.rows[0] ? result.rows[0] : undefined);
      });
    });
  }

  function _getFeed(user, from, limit, next) {

    var data = [user.user], timeClause = '';

    if(from) {
      timeClause = 'AND time < ' + from;
    }

    var query = q('selectTimeline', {timeClause: timeClause, limit: limit});
    client.execute(query, data, {prepare:true}, function(err, data) {

      if(data.rows.length > 0) {

         var timeline = data.rows;

         async.map(timeline, function(item, cb) {
            if(item.type == 'post') { return getPost(item.item, cb); }
            if(item.type == 'like') { return getLike(item.item, cb); }
            if(item.type == 'friend') { return getFriend(item.item, cb); }
            if(item.type == 'follow') { return getFollow(item.item, cb); }
            return cb();
         }, function(err, results) {

            /* istanbul ignore if */
            if(err || !results) { return next(err); }

            var feed = [], maxTime;
            results.forEach(function(result, index) {

              if(result) {

                var currentResult = result;

                // Copy elements from feed
                currentResult.type = timeline[index].type;
                currentResult.timeuuid = timeline[index].time;
                currentResult.date = timeline[index].date;
                currentResult.fromNow = moment(currentResult.date).fromNow();

                // Calculated fields
                currentResult.fromFollow = currentResult.user !== user.user;
                currentResult.isLike = currentResult.type === 'like';
                currentResult.isPost = currentResult.type === 'post';
                currentResult.isFollow = currentResult.type === 'follow';
                currentResult.isFriend = currentResult.type === 'friend';

                // To page 'more'
                maxTime = currentResult.timeuuid;

                feed.push(currentResult);

              } else {
                console.error('Unable to locate: ' + timeline[index].item + ' of type ' + timeline[index].type);
              }

            });

            // Now, go and get user details for all the non own posts
            async.map(feed, function(feedItem, cb) {
              if(!feedItem.fromFollow) {
                feedItem.user = user;
                cb(null, feedItem)
              } else {
                getUser(feedItem.user, function(err, follower) {
                  feedItem.user = follower;
                  cb(null, feedItem);
                });
              }
            }, function(err, newFeed) {
              next(err, feed, maxTime);
            });

         });

      } else {
        next && next(err);
      }

    });

  }

  return {
    getUser: getUser,
    getFriends: getFriends,
    getFollowers: getFollowers,
    getPost: getPost,
    getLike: getLike,
    getFollow: getFollow,
    getFriend: getFriend,
    getUserByUsername: getUserByUsername,
    getFeedForUsername: getFeedForUsername,
    checkLike: checkLike
  }

}
