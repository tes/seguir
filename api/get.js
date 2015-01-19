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

  function getFeedForUser(username, from, limit, next) {
    getUserByName(username, function(err, user) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _getFeed(user, from, limit, next);
    });
  }

  function getPost(post, next) {
    client.execute(q('selectPost'), [post], {prepare:true}, function(err, result) {
       next(err, result.rows && result.rows[0] ? result.rows[0] : undefined);
    });
  }

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

  function getFriendsByName(username, next) {
    getUserByName(username, function(err, user) {
      if(err || !user) { return next(err); }
      getFriends(user.user, function(err, friends) {
        _mapGetUser(friends, 'user_friend', user, next);
      });
    });
  }

  function getFollowers(user, next) {
    client.execute(q('selectFollowers'), [user], {prepare:true}, function(err, result) {
       next(err, result.rows);
    });
  }

  function getFollowers(user, next) {
    client.execute(q('selectFollowers'), [user], {prepare:true}, function(err, result) {
       next(err, result.rows);
    });
  }

  function getFollowersByName(username, next) {
    getUserByName(username, function(err, user) {
      if(err || !user) { return next(err); }
      getFollowers(user.user, function(err, followers) {
        _mapGetUser(followers, 'user_follower', user, next);
      });
    });
  }

  function getUser(user, next) {
    client.execute(q('selectUser'), [user], {prepare:true}, function(err, result) {
       if(err) { return next(err); }
       next(err, result.rows && result.rows[0] ? result.rows[0] : undefined);
    });
  }

  function getUserByName(username, next) {
    client.execute(q('selectUserByUsername'), [username], {prepare:true}, function(err, result) {
       /* istanbul ignore if */
       if(err) { return next(err); }
       next(err, result.rows && result.rows[0] ? result.rows[0] : undefined);
    });
  }

  function checkLike(username, item, next) {
    getUserByName(username, function(err, user) {
      if(!user) { return next(err); }
      client.execute(q('checkLike'), [user.user, item], {prepare:true}, function(err, result) {
         next(err, result.rows && result.rows[0] ? result.rows[0] : undefined);
      });
    });
  }

  function _mapGetUser(items, field, currentUser, next) {
    async.map(items, function(item, cb) {
      if(item[field] === currentUser.user) {
        item[field] = currentUser;
        cb(null, item);
      } else {
        getUser(item[field], function(err, user) {
          item[field] = user;
          cb(err, item);
        });
      }
    }, next);
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

                // Calculated fields to make rendering easier
                currentResult.fromFollower = currentResult.user !== user.user;
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
            _mapGetUser(feed, 'user', user, function(err, mappedFeed) {
                next(err, mappedFeed, maxTime);
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
    getFollowersByName: getFollowersByName,
    getFriend: getFriend,
    getFriendsByName: getFriendsByName,
    getUserByName: getUserByName,
    getFeedForUser: getFeedForUser,
    checkLike: checkLike
  }

}
