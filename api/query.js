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
 */
module.exports = function(client, redis) {

  var q = require('./db/queries');

  function _error(code, message) {
    var error = new Error(message);
    error.statusCode = code;
    return error;
  }

  function _get(keyspace, query, data, many, next) {
    client.execute(q(keyspace, query), data, {prepare:true}, _response(query, data, many, next));
  }

  function _response(query, data, many, next) {
    return function(err, result) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      if(!result.rows || (many !== 'many' && result.rows.length !== 1)) {
        return next(_error(404,'Item not found: "' + query + '"" for "' + data.join(", ") + '"'));
      }
      next(null, many === 'many' ? result.rows : result.rows[0]);
    };
  }

  function getUser(keyspace, user, next) {
    _get(keyspace, 'selectUser', [user], 'one', next);
  }

  function getUserByName(keyspace, username, next) {
    _get(keyspace, 'selectUserByUsername', [username], 'one', next);
  }

  function getUserByAltId(keyspace, altid, next) {
    _get(keyspace, 'selectUserByAltId', [altid], 'one', next);
  }

  function getUserFeedForUser(keyspace, liu, user, from, limit, next) {
    _getFeed(keyspace, liu, 'user_timeline', user, from, limit, next);
  }

  function getFeedForUser(keyspace, liu, user, from, limit, next) {
    _getFeed(keyspace, liu, 'feed_timeline', user, from, limit, next);
  }

  function getRawFeedForUser(keyspace, liu, user, from, limit, next) {
    var raw = true;
    _getFeed(keyspace, liu, 'feed_timeline', user, from, limit, raw, next);
  }

  function canSeePrivate(keyspace, liu, user, next) {
     if(liu == user) { return next(null, true); }
     isFriend(keyspace, liu, user, next);
  }

  function getPost(keyspace, liu, post, next) {
    _get(keyspace, 'selectPost', [post], 'one', function(err, post) {
       if(err) { return next(err); }
       if(post.ispersonal) {
        if(liu !== post.user) { return next(_error(403, 'You are not allowed to see this item.')); }
        return next(null, post);
       }
       if(post.isprivate) {
         canSeePrivate(keyspace, liu, post.user, function(err, canSee) {
           if(err) { return next(err); }
           if(!canSee) { return next(_error(403, 'You are not allowed to see this item.')); }
           return next(null, post);
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
      _get(keyspace, 'selectFriends', [user], 'many', function(err, friends) {
        if(err) { return next(err); }
        next(null, friends);
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
    _get(keyspace, 'selectFriendRequest', [friend_request], 'one', function(err, friendRequest) {
      if(err) { return next(err); }
      next(null, friendRequest);
    });
  }

  function getIncomingFriendRequests(keyspace, liu, next) {
    _get(keyspace, 'selectIncomingFriendRequests', [liu], 'many', function(err, friendRequests) {
      if(err) { return next(err); }
      // Now, go and get user details for all the non own posts
      _mapGetUser(keyspace, friendRequests, ['user','user_friend'], liu, function(err, mappedFriendRequests) {
          if(err) { return next(err); }
          next(null, mappedFriendRequests);
      });
    });
  }

  function getOutgoingFriendRequests(keyspace, liu, next) {
    _get(keyspace, 'selectOutgoingFriendRequests', [liu], 'many', function(err, friendRequests) {
      if(err) { return next(err); }
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
    _get(keyspace, 'isFriend', [user, user_friend], 'one', function(err, friend) {
      var isFriend = err && err.statusCode === 404 ? false : true;
      var isFriendSince = isFriend ? friend.since : null;
      return next(null, isFriend, isFriendSince, friend ? friend : null);
    });
  }

  function isFollower(keyspace, user, user_follower, next) {
    if(user === user_follower) { return next(null, true, null, {isprivate: false, ispersonal: false}); }
    _get(keyspace, 'isFollower', [user, user_follower], 'one', function(err, follow) {
      var isFollower = err && err.statusCode === 404 ? false : true;
      var isFollowerSince = isFollower ? follow.since : null;
      return next(null, isFollower, isFollowerSince, follow ? follow : null);
    });
  }

  function isFriendRequestPending(keyspace, user, user_friend, next) {
    if(user === user_friend) { return next(null, false, null); }
    _get(keyspace, 'selectOutgoingFriendRequests', [user], 'many', function(err, friendRequests) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      var friendRequest = _.filter(friendRequests, function(row) {
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
    _get(keyspace, 'selectLike', [like], 'one', function(err, result) {
       if(err) { return next(err); }
       next(null, result);
    });
  }

  function checkLike(keyspace, user, item, next) {
    _get(keyspace, 'checkLike', [user, item], 'one', function(err, like) {
       if(err) { return next(err); }
       next(null, like);
    });
  }

  function getFriend(keyspace, liu, friend, next) {
    _get(keyspace, 'selectFriend', [friend], 'one', function(err, friendship) {
       /* istanbul ignore if */
       if(err) { return next(err); }
       isFriend(keyspace, friendship.user_friend, liu, function(err, ok) {
        if(err) { return next(err); }
        if(!ok) { return next({statusCode: 403, message:'You are not allowed to see this item.'}); }
         getUser(keyspace, friendship.user_friend, function(err, user) {
           friendship.username_friend = user.username;
           next(null, friendship);
         });
       });
    });
  }

  function getFollow(keyspace, liu, follow, next) {

    _get(keyspace, 'selectFollow', [follow], 'one', function(err, follower) {

       /* istanbul ignore if */
       if(err) { return next(err); }

       var userIsInFollow = liu === follower.user || liu === follower.user_follower;

       var returnUser = function() {
          getUser(keyspace, follower.user_follower, function(err, user) {
             follower.username_follower = user.username;
             next(null, follower);
          });
       }

       // If the relationship is personal, the user must be one of the two parties.
       if(follower.ispersonal && !userIsInFollow) {
        return next({statusCode: 403, message:'You are not allowed to see this item.'});
       }

       // If the relationship is private, the user must be friends with one of the two parties.
       if(follower.isprivate) {
        async.parallel({
          user: async.apply(isFriend, keyspace, liu, follower.user),
          follower: async.apply(isFriend, keyspace, liu, follower.user_follower)
        }, function(err, result) {
          if(!result.user[0] && !result.follower[0]) {
            return next({statusCode: 403, message:'You are not allowed to see this item.'});
          }
          returnUser();
        });
       } else {
         returnUser();
       }

    });
  }

  function getFollowers(keyspace, liu, user, next) {
    var isUser = liu === user;
    isFriend(keyspace, liu, user, function(err, isFriend) {
      _get(keyspace, 'selectFollowers', [user], 'many', function(err, followers) {
         if(err) { return next(err); }
         var filteredFollowers = _.filter(followers, function(item) {
           if(item.ispersonal && !isUser) { return false; }
           if(item.isprivate && !isFriend) { return false; }
           return true;
         });
         next(null, filteredFollowers);
      });
    });
  }

  function getFollowersByName(keyspace, liu, username, next) {
    getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      getFollowers(keyspace, liu, user.user, function(err, followers) {
        _mapGetUser(keyspace, followers, ['user_follower'], user, next);
      });
    });
  }

  function getFollowersInCommon(keyspace, user, other_user, next) {
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
        youFollowPrivate: result.follow[2] ? result.follow[2].isprivate : null,
        youFollowPersonal: result.follow[2] ? result.follow[2].ispersonal : null,
        theyFollow: result.followBack[0],
        theyFollowSince: result.followBack[1],
        theyFollowPrivate: result.followBack[2] ? result.followBack[2].isprivate : null,
        theyFollowPersonal: result.followBack[2] ? result.followBack[2].ispersonal : null,
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

  function _getFeed(keyspace, liu, timeline, user, from, limit, raw, next) {

    if(!next) { next = raw; raw = false; }

    var data = [user], timeClause = '';

    if(from) {
      timeClause = 'AND time < ' + from;
    }

    var query = q(keyspace, 'selectTimeline', {timeClause: timeClause, privateClause: null, limit: limit, TIMELINE: timeline});
    client.execute(query, data, {prepare:true}, function(err, data) {

      if(err) { return next(err); }

      if(data.rows && data.rows.length > 0) {

         if(raw) { return next(null, data.rows); }

         var timeline = data.rows;

         async.map(timeline, function(item, cb) {

            if(item.type == 'post') {
              return getPost(keyspace, liu, item.item, function(err, post) {
                if(err && (err.statusCode === 403 || err.statusCode === 404)) {
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
                if(err && (err.statusCode === 403 || err.statusCode === 404)) {
                   cb(); // Silently drop these from the feed
                 } else {
                   if(err) { return cb(err); }
                   cb(null, friend);
                 }
              });
            }
            if(item.type == 'follow') {
              return getFollow(keyspace, liu, item.item, function(err, follow) {
                if(err && (err.statusCode === 403 || err.statusCode === 404)) {
                   cb(); // Silently drop private items from the feed
                 } else {
                   if(err) { return cb(err); }
                   cb(null, follow);
                 }
              });
            }

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
                currentResult.isprivate = timeline[index].isprivate;
                currentResult.ispersonal = timeline[index].ispersonal;

                // Calculated fields to make rendering easier
                currentResult.fromFollower = currentResult.user !== user.user;
                currentResult.isLike = currentResult.type === 'like';
                currentResult.isPost = currentResult.type === 'post';
                currentResult.isFollow = currentResult.type === 'follow';
                currentResult.isFriend = currentResult.type === 'friend';
                currentResult.isUsersItem = currentResult.user === liu;

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
    getUserByAltId: getUserByAltId,
    getFeedForUser: getFeedForUser,
    getUserFeedForUser: getUserFeedForUser,
    getRawFeedForUser: getRawFeedForUser,
    checkLike: checkLike
  }

}
