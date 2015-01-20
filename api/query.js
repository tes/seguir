var cassandra = require('cassandra-driver');
var async = require('async');
var moment = require('moment');

/**
 * This is a collection of methods that allow you to query and retrieve social items.
 *
 * The 'liu' is a key that is passed in by the client, to identify who the user
 * accessing the API is (as this in many instances will not be the user to who the
 * social items and feed belongs to).  It stands for 'logged in user'.
 *
 * So user / username always refers to the property of the item - e.g. the post is by a user with a username.
 *
 * Public elements (so no liu passed in):
 *
 *  - getUser
 *  - getUserByname
 *  - getFollow
 *  - getFollowers
 *  - getLike
 *
 * Possible private elements (so liu passed in):
 *
 *  - getFeed
 *  - getFeedByName
 *  - getFriend
 *  - getFriends
 *  - getFriendsByName
 *  - getPost
 *
 */
module.exports = function(client, keyspace) {

  var q = require('../db/queries')(keyspace);

  function getFeedForUser(liu, username, from, limit, next) {
    getUserByName(username, function(err, user) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _getFeed(liu, user, from, limit, next);
    });
  }

  function canSeePrivate(liu, user, next) {
     if(liu == user) { return next(null, true); }
     isFriend(liu, user, next);
  }

  function getPost(liu, post, next) {
    client.execute(q('selectPost'), [post], {prepare:true}, function(err, result) {
       if(err) { return next(err); }
       if(result.rows.length === 0) { return next(); }
       var post = result.rows[0];
       if(post.isprivate) {
         canSeePrivate(liu, post.user, function(err, canSee) {
           if(err) { return next(err); }
           if(!canSee) { return next({statusCode: 403, message:'You are not allowed to see this item.'}); }
           next(null, post);
         });
       } else {
         next(null, post);
       }
    });
  }

  function isFriend(user, user_friend, next) {
    var data = [user, user_friend];
    client.execute(q('isFriend'), data, {prepare:true},  function(err, result) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      var isFriend = result.rows.length > 0;
      return next(err, isFriend);
    });
  }

  function getLike(like, next) {
    client.execute(q('selectLike'), [like], {prepare:true}, function(err, result) {
       next(err, result.rows && result.rows[0] ? result.rows[0] : undefined);
    });
  }

  function getFriend(liu, friend, next) {
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

  function getFriends(liu, user, next) {
    client.execute(q('selectFriends'), [user], {prepare:true}, function(err, result) {
       next(err, result.rows);
    });
  }

  function getFriendsByName(liu, username, next) {
    getUserByName(username, function(err, user) {
      if(err || !user) { return next(err); }
      getFriends(user.user, function(err, friends) {
        _mapGetUser(friends, ['user_friend'], user, next);
      });
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
        _mapGetUser(followers, ['user_follower'], user, next);
      });
    });
  }

  function getFollowersInCommon(liu, user, next) {
    next();
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

  function _mapGetUser(items, fields, currentUser, next) {

    async.map(items, function(item, mapCb) {
      async.each(fields, function(field, eachCb) {
        if(!item[field]) { return eachCb(null); }
        if(item[field] === currentUser.user) {
          item[field] = currentUser;
          eachCb(null);
        } else {
          getUser(item[field], function(err, user) {
            item[field] = user;
            eachCb(err);
          });
        }
      }, function(err) {
        mapCb(err, item);
      });
    }, next);

  }

  function _getFeed(liu, user, from, limit, next) {

    var data = [user.user], timeClause = '';

    if(from) {
      timeClause = 'AND time < ' + from;
    }

    var query = q('selectTimeline', {timeClause: timeClause, privateClause: null, limit: limit});
    client.execute(query, data, {prepare:true}, function(err, data) {

      if(err) { return next(err); }

      if(data.rows && data.rows.length > 0) {

         var timeline = data.rows;

         async.map(timeline, function(item, cb) {

            if(item.type == 'post') {
              return getPost(liu, item.item, function(err, post) {
                 if(err && err.statusCode === 403) {
                   cb(); // Silently drop posts from the feed
                 } else {
                   cb(err, post);
                 }
              });
            }
            if(item.type == 'like') { return getLike(item.item, cb); }
            if(item.type == 'friend') {
              return getFriend(liu, item.item, function(err, friend) {
                 if(err && err.statusCode === 403) {
                   cb(); // Silently drop these from the feed
                 } else {
                   cb(err, friend);
                 }
              });
            }
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

              }

            });

            // Now, go and get user details for all the non own posts
            _mapGetUser(feed, ['user','user_follower','user_friend'], user, function(err, mappedFeed) {
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
    isFriend: isFriend,
    getFriendsByName: getFriendsByName,
    getUserByName: getUserByName,
    getFeedForUser: getFeedForUser,
    checkLike: checkLike
  }

}
