var cassandra = require('cassandra-driver');
var async = require('async');
var _ = require('lodash');
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

  var q = require('./db/queries');

  function getUser(keyspace, user, next) {
    client.execute(q(keyspace, 'selectUser'), [user], {prepare:true}, function(err, result) {
       if(err) { return next(err); }
       next(null, result.rows && result.rows[0] ? result.rows[0] : undefined);
    });
  }

  function getUserByName(keyspace, username, next) {
    client.execute(q(keyspace, 'selectUserByUsername'), [username], {prepare:true}, function(err, result) {
       /* istanbul ignore if */
       if(err) { return next(err); }
       var user = result && result.rows && result.rows[0] ? result.rows[0] : undefined;
       next(null, user);
    });
  }

  function getFeedForUser(keyspace, liu, user, from, limit, next) {
      _getFeed(keyspace, liu, user, from, limit, next);
  }

  function getRawFeedForUser(keyspace, liu, user, from, limit, next) {
    var raw = true;
    _getFeed(keyspace, liu, user, from, limit, raw, next);
  }

  function canSeePrivate(keyspace, liu, user, next) {
     if(liu == user) { return next(null, true); }
     isFriend(keyspace, liu, user, next);
  }

  function getPost(keyspace, liu, post, next) {
    client.execute(q(keyspace, 'selectPost'), [post], {prepare:true}, function(err, result) {
       if(err) { return next(err); }
       if(result.rows.length === 0) { return next(); }
       var post = result.rows[0];
       if(post.isprivate) {
         canSeePrivate(keyspace, liu, post.user, function(err, canSee) {
           if(err) { return next(err); }
           if(!canSee) { return next({statusCode: 403, message:'You are not allowed to see this item.'}); }
           next(null, post);
         });
       } else {
         next(null, post);
       }
    });
  }

  function getFriends(keyspace, liu, user, next) {
    isFriend(keyspace, user, liu, function(err, ok) {
      if(err) { return next(err); }
      if(!ok) { return next({statusCode: 403, message:'You are not allowed to see this item.'}); }
      client.execute(q(keyspace, 'selectFriends'), [user], {prepare:true}, function(err, result) {
        if(err) { return next(err); }
        next(null, result ? result.rows : undefined);
      });
    });
  }

  function friendsInCommon(keyspace, liu, user, next) {
    if(liu === user) return next();
    async.parallel([
      function(cb) {
        client.execute(q(keyspace, 'selectFriends'), [liu], {prepare:true}, function(err, result) {
          if(err) return cb(err);
          cb(null, _.pluck(result.rows, 'user_friend'));
        });
      },
      function(cb) {
        client.execute(q(keyspace, 'selectFriends'), [user], {prepare:true}, function(err, result) {
          if(err) return cb(err);
          cb(null, _.pluck(result.rows, 'user_friend'));
        });
      }
    ], function(err, results) {
        var inCommon = _.uniq(_.filter(_.intersection(results[0],results[1]), function(item) { return (item === liu || item === user) ? null : item; }));
        async.map(inCommon, function(id, cb) {
          getUser(keyspace, id, cb);
        }, next);
    });

  }

  function getFriendRequest(keyspace, liu, friend_request, next) {
    client.execute(q(keyspace, 'selectFriendRequest'), [friend_request], {prepare:true}, function(err, result) {
      if(err) { return next(err); }
      next(null, result ? result.rows[0] : undefined);
    });
  }

  function getIncomingFriendRequests(keyspace, liu, next) {
    client.execute(q(keyspace, 'selectIncomingFriendRequests'), [liu], {prepare:true}, function(err, result) {
      if(err) { return next(err); }
      var friendRequests = result.rows;
      // Now, go and get user details for all the non own posts
      _mapGetUser(keyspace, friendRequests, ['user','user_friend'], liu, function(err, mappedFriendRequests) {
          if(err) { return next(err); }
          next(null, mappedFriendRequests);
      });
    });
  }

  function getOutgoingFriendRequests(keyspace, liu, next) {
    client.execute(q(keyspace, 'selectOutgoingFriendRequests'), [liu], {prepare:true}, function(err, result) {
      if(err) { return next(err); }
      var friendRequests = result.rows;
      // Now, go and get user details for all the non own posts
      _mapGetUser(keyspace, friendRequests, ['user','user_friend'], liu, function(err, mappedFriendRequests) {
          if(err) { return next(err); }
          next(null, mappedFriendRequests);
      });
    });
  }

  function getFriendRequests(keyspace, liu, next) {
      getIncomingFriendRequests(keyspace, liu, function(err, incoming) {
        if(err) { return next(err); }
        getOutgoingFriendRequests(keyspace, liu, function(err, outgoing) {
            if(err) { return next(err); }
            next(null, {incoming: incoming, outgoing: outgoing});
        });
      });
  }

  function getFriendsByName(keyspace, liu, username, next) {
    getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      getFriends(keyspace, liu, user.user, function(err, friends) {
        if(err || !friends) { return next(err); }
        _mapGetUser(keyspace, friends, ['user_friend'], user, next);
      });
    });
  }

  function isFriend(keyspace, user, user_friend, next) {
    if(user === user_friend) { return next(null, true, null); }
    var data = [user, user_friend];
    client.execute(q(keyspace, 'isFriend'), data, {prepare:true},  function(err, result) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      var isFriend = result.rows.length > 0 ? true : false;
      var isFriendSince = isFriend ? result.rows[0].since : null;
      var friend = isFriend ? result.rows[0].friend : null;
      return next(null, isFriend, isFriendSince, friend);
    });
  }

  function isFollower(keyspace, user, user_follower, next) {
    if(user === user_follower) { return next(null, true, null); }
    var data = [user, user_follower];
    client.execute(q(keyspace, 'isFollower'), data, {prepare:true},  function(err, result) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      var isFollower = result.rows.length > 0 ? true : false;
      var isFollowerSince = isFollower ? result.rows[0].since : null;
      var follow = isFollower ? result.rows[0].follow : null;
      return next(null, isFollower, isFollowerSince, follow);
    });
  }

  function isFriendRequestPending(keyspace, user, user_friend, next) {
    if(user === user_friend) { return next(null, false, null); }
    var data = [user];
    client.execute(q(keyspace, 'selectOutgoingFriendRequests'), data, {prepare:true},  function(err, result) {
      /* istanbul ignore if */
      if(err) { return next(err); }

      // TODO: Figure out how to do this via CQL!
      // We have to actually filter the results to look for the given user
      var friendRequest = _.filter(result.rows, function(row) {
        if(row.user_friend.toString() === user_friend) {
          return row;
        }
      });
      var isFriendRequestPending = friendRequest.length > 0 ? true : false;
      var isFriendRequestSince = isFriendRequestPending ? friendRequest[0].since : null;

      return next(null, isFriendRequestPending, isFriendRequestSince);
    });
  }

  function getLike(keyspace, like, next) {
    client.execute(q(keyspace, 'selectLike'), [like], {prepare:true}, function(err, result) {
       if(err) { return next(err); }
       next(null, result.rows && result.rows[0] ? result.rows[0] : null);
    });
  }

  function checkLike(keyspace, user, item, next) {
    client.execute(q(keyspace, 'checkLike'), [user, item], {prepare:true}, function(err, result) {
       if(err) { return next(err); }
       next(null, result.rows && result.rows[0] ? result.rows[0] : null, result.rows[0]);
    });
  }

  function getFriend(keyspace, liu, friend, next) {
    client.execute(q(keyspace, 'selectFriend'), [friend], {prepare:true}, function(err, result) {
       /* istanbul ignore if */
       if(err || !result.rows || result.rows.length == 0) { return next(err); }
       var friend = result.rows[0] ? result.rows[0] : null;
       isFriend(keyspace, friend.user_friend, liu, function(err, ok) {
        if(err) { return next(err); }
        if(!ok) { return next({statusCode: 403, message:'You are not allowed to see this item.'}); }
         getUser(keyspace, friend.user_friend, function(err, user) {
           friend.username_friend = user.username;
           next(null, friend);
         });
       });
    });
  }

  function getFollow(keyspace, follow, next) {
    client.execute(q(keyspace, 'selectFollow'), [follow], {prepare:true}, function(err, result) {
       /* istanbul ignore if */
       if(err || !result.rows || result.rows.length == 0) { return next(err); }
       var follower = result.rows[0] ? result.rows[0] : null;
       getUser(keyspace, follower.user_follower, function(err, user) {
         follower.username_follower = user.username;
         next(null, follower);
       });
    });
  }

  function getFollowers(keyspace, user, next) {
    client.execute(q(keyspace, 'selectFollowers'), [user], {prepare:true}, function(err, result) {
       if(err) { return next(err); }
       next(null, result ? result.rows : null);
    });
  }

  function getFollowersByName(keyspace, username, next) {
    getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      getFollowers(keyspace, user.user, function(err, followers) {
        _mapGetUser(keyspace, followers, ['user_follower'], user, next);
      });
    });
  }

  function getFollowersInCommon(keyspace, liu, user, next) {
    next();
  }

  function getUserRelationship(keyspace, user, other_user, next) {

    async.parallel({
      friend: async.apply(isFriend, keyspace, user, other_user),
      friendRequest: async.apply(isFriendRequestPending, keyspace, user, other_user),
      follow: async.apply(isFollower, keyspace, other_user, user),
      followBack: async.apply(isFollower, keyspace, user, other_user),
      inCommon: async.apply(friendsInCommon, keyspace, user, other_user)
    },function(err, result) {

      if(err) { return next(err); }

      var relationship = {
        isFriend: result.friend[0],
        isFriendSince: result.friend[1],
        isFriendRequestPending: result.friendRequest[0],
        isFriendRequestSince: result.friendRequest[1],
        youFollow: result.follow[0],
        youFollowSince: result.follow[1],
        theyFollow: result.followBack[0],
        theyFollowSince: result.followBack[1],
        inCommon: result.inCommon
      };

      next(null,relationship);

    });

  }

  function _mapGetUser(keyspace, items, fields, currentUser, next) {

    async.map(items, function(item, mapCb) {
      async.each(fields, function(field, eachCb) {
        if(!item[field]) { return eachCb(null); }
        if(item[field] === currentUser.user) {
          item[field] = currentUser;
          eachCb(null);
        } else {
          getUser(keyspace, item[field], function(err, user) {
            item[field] = user;
            eachCb(err);
          });
        }
      }, function(err) {
        mapCb(err, item);
      });
    }, next);

  }

  function _getFeed(keyspace, liu, user, from, limit, raw, next) {

    if(!next) { next = raw; raw = false; }

    var data = [user], timeClause = '';

    if(from) {
      timeClause = 'AND time < ' + from;
    }

    var query = q(keyspace, 'selectTimeline', {timeClause: timeClause, privateClause: null, limit: limit});
    client.execute(query, data, {prepare:true}, function(err, data) {

      if(err) { return next(err); }

      if(data.rows && data.rows.length > 0) {

         if(raw) { return next(null, data.rows); }

         var timeline = data.rows;

         async.map(timeline, function(item, cb) {

            if(item.type == 'post') {
              return getPost(keyspace, liu, item.item, function(err, post) {
                 if(err && err.statusCode === 403) {
                   cb(); // Silently drop posts from the feed
                 } else {
                   if(err) { return cb(err); }
                   cb(null, post);
                 }
              });
            }
            if(item.type == 'like') { return getLike(keyspace, item.item, cb); }
            if(item.type == 'friend') {
              return getFriend(keyspace, liu, item.item, function(err, friend) {
                 if(err && err.statusCode === 403) {
                   cb(); // Silently drop these from the feed
                 } else {
                   if(err) { return cb(err); }
                   cb(null, friend);
                 }
              });
            }
            if(item.type == 'follow') { return getFollow(keyspace, item.item, cb); }
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
                currentResult.isdeleted = timeline[index].isdeleted;

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
            _mapGetUser(keyspace, feed, ['user','user_follower','user_friend'], user, function(err, mappedFeed) {
                if(err) { return next(err); }
                next(null, mappedFeed, maxTime);
            });

         });

      } else {
        if(err) { return next(err); }
        next();
      }

    });

  }

  return {
    getUser: getUser,
    getUserRelationship: getUserRelationship,
    getFriends: getFriends,
    getFriendRequest: getFriendRequest,
    getFriendRequests: getFriendRequests,
    getIncomingFriendRequests: getIncomingFriendRequests,
    getOutgoingFriendRequests: getOutgoingFriendRequests,
    getFollowers: getFollowers,
    getPost: getPost,
    getLike: getLike,
    getFollow: getFollow,
    getFollowersByName: getFollowersByName,
    getFriend: getFriend,
    isFriend: isFriend,
    isFollower: isFollower,
    getFriendsByName: getFriendsByName,
    getUserByName: getUserByName,
    getFeedForUser: getFeedForUser,
    getRawFeedForUser: getRawFeedForUser,
    checkLike: checkLike
  }

}
