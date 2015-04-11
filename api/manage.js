var cassandra = require('cassandra-driver');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');
var mention = new RegExp('@[a-zA-Z0-9]+','g');
var sanitizeHtml = require('sanitize-html');


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
module.exports = function(client) {

  var q = require('./db/queries');
  var query = require('./query')(client);

  function clean(input) {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }

  function addUser(keyspace, username, userdata, next) {
    userdata = _.mapValues(userdata , function(value) { return value.toString(); }); // Always ensure our userdata is <text,text>
    var userid = cassandra.types.uuid();
    var user = [userid, username, userdata];
    client.execute(q(keyspace, 'upsertUser'), user, {prepare:true, hints:[null, null, 'map']}, function(err, result) {
      if(err) { return next(err); }
      next(null, {user: userid, username: username, userdata: userdata});
    });
  }

  function addPost(keyspace, user, content, timestamp, isprivate, next) {
    var post = cassandra.types.uuid();
    var data = [post, user, clean(content), timestamp, isprivate];
    client.execute(q(keyspace, 'upsertPost'), data, {prepare:true}, function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(keyspace, user, post, 'post', isprivate, function(err, result) {
        if(err) { return next(err); }
        next(null, {post: post, user: user, content: clean(content), timestamp: timestamp, isprivate: isprivate});
      });
    });
  }

  function addPostByName(keyspace, username, content, timestamp, isprivate, next) {
    query.getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      addPost(keyspace, user.user, content, timestamp, isprivate, next);
    });
  }

  function removePost(keyspace, user, post, next) {
    query.getPost(keyspace, user, post, function(err, postItem) {
      if(err) { return next(err); }
      if(postItem.user !== user) { return next({statusCode: 403, message:'You are not allowed to delete other peoples posts.'}); }
      var deleteData = [post];
      client.execute(q(keyspace, 'removePost'), deleteData, {prepare:true},  function(err, result) {
        if(err) return next(err);
        _removeFeedsForItem(keyspace, post, function(err) {
          if(err) return next(err);
          next(null, {status:'removed'});
        });
      });
    });
  }

  function addLike(keyspace, user, item, timestamp, next) {
    var like = cassandra.types.uuid();
    var data = [like, user, clean(item), timestamp];
    client.execute(q(keyspace, 'upsertLike'), data, {prepare:true}, function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(keyspace, user, like, 'like', false, function(err, result) {
        if(err) { return next(err); }
        next(null, {like: like, user: user, item: item, timestamp: timestamp});
      });
    });
  }

  function addLikeByName(keyspace, username, item, timestamp, next) {
    query.getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      addLike(keyspace, user.user, item, timestamp, next);
    });
  }

  function removeLike(keyspace, user, item, next) {
    query.checkLike(keyspace, user, item, function(err, like) {
      if(!like) { return next(); }
      if(like.user !== user) { return next({statusCode: 403, message:'You are not allowed to delete other peoples likes.'}); }
      var deleteData = [user, item];
      client.execute(q(keyspace, 'removeLike'), deleteData, {prepare:true},  function(err, result) {
        if(err) return next(err);
        _removeFeedsForItem(keyspace, like.like, function(err) {
          if(err) return next(err);
          next(null, {status:'removed'});
        });
      });
    });
  }

  function addFriend(keyspace, user, user_friend, timestamp, next) {
    var friend = cassandra.types.uuid();
    addFriendOneWay(keyspace, friend, user, user_friend, timestamp, function(err) {
      if(err) { return next(err); }
      var reciprocalFriend = cassandra.types.uuid();
      addFriendOneWay(keyspace, reciprocalFriend, user_friend, user, timestamp, function(err) {
        if(err) { return next(err); }
        next(null, {friend: friend, reciprocal: reciprocalFriend, user: user, user_friend: user_friend, timestamp: timestamp});
      });
    });
  }

  function addFriendOneWay(keyspace, friend, user, user_friend, timestamp, next) {
    var data = [friend, user, user_friend, timestamp];
    client.execute(q(keyspace, 'upsertFriend'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(keyspace, user, friend, 'friend', true, next);
    });
  }

  function addFriendRequest(keyspace, user, user_friend, message, timestamp, next) {
    var friend_request = cassandra.types.uuid();
    var data = [friend_request, user, user_friend, clean(message), timestamp];
    client.execute(q(keyspace, 'upsertFriendRequest'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      next(null, {friend_request: friend_request, user: user, user_friend: user_friend, message: clean(message), timestamp: timestamp});
    });
  }

  function acceptFriendRequest(keyspace, liu, friend_request_id, next) {
    query.getFriendRequest(keyspace, liu, friend_request_id, function(err, friend_request) {
      if(err) { return next(err); }
      var data = [friend_request_id];
      client.execute(q(keyspace, 'acceptFriendRequest'), data, {prepare:true},  function(err) {
        /* istanbul ignore if */
        if(err) { return next(err); }
        addFriend(keyspace, friend_request.user, friend_request.user_friend, Date.now(), next);
      });
    });
  }

  function removeFriend(keyspace, user, user_friend, next) {
    query.isFriend(keyspace, user, user_friend, function(err, isFriend, isFriendSince, friend) {
      if(!isFriend) { return next(); }
      var deleteData = [user, user_friend];
      var deleteDataReciprocal = [user_friend, user];
      client.execute(q(keyspace, 'removeFriend'), deleteData, {prepare:true},  function(err, result) {
        if(err) return next(err);
        client.execute(q(keyspace, 'removeFriend'), deleteDataReciprocal, {prepare:true},  function(err, result) {
          if(err) return next(err);
          _removeFeedsForItem(keyspace, friend.friend, function(err) {
            if(err) return next(err);
            next(null, {status:'removed'});
          });
        });
      });
    });
  }

  function addFriendByName(keyspace, username, username_friend, timestamp, next) {
    query.getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      query.getUserByName(keyspace, username_friend, function(err, friend) {
        if(err || !friend) { return next(err); }
        addFriend(keyspace, user.user, friend.user, timestamp, next);
      });
    });
  }

  function addFollower(keyspace, user, user_follower, timestamp, next) {
    var follow = cassandra.types.uuid();
    var data = [follow, user, user_follower, timestamp];
    client.execute(q(keyspace, 'upsertFollower'), data, {prepare:true},  function(err) {
      /* istanbul ignore if */
      if(err) { return next(err); }
      _addFeedItem(keyspace, user, follow, 'follow', false, function(err, result) {
        if(err) { return next(err); }
        next(null, {follow: follow, user: user, user_follower: user_follower, timestamp: timestamp});
      });
    });
  }

  function addFollowerByName(username, username_follower, timestamp, next) {
    query.getUserByName(keyspace, username, function(err, user) {
      if(err || !user) { return next(err); }
      query.getUserByName(keyspace, username_follower, function(err, follower) {
        if(err || !follower) { return next(err); }
        addFollower(keyspace, user.user, follower.user, timestamp, next);
      });
    });
  }

  function removeFollower(keyspace, user, user_follower, next) {
    query.isFollower(keyspace, user, user_follower, function(err, isFollower, isFollowerSince, follow) {
      if(!isFollower) { return next(); }
      var deleteData = [user, user_follower];
      client.execute(q(keyspace, 'removeFollower'), deleteData, {prepare:true},  function(err, result) {
        if(err) return next(err);
        _removeFeedsForItem(keyspace, follow.follow, function(err) {
          if(err) return next(err);
          next(null, {status:'removed'});
        });
      });
    });
  }

  function _addFeedItem(keyspace, user, item, type, isprivate, next) {

    var inTimeline = [];

    var insertUserTimeline = function(cb) {
      inTimeline.push(user);
      var data = [user, item, type, cassandra.types.timeuuid(), isprivate];
      client.execute(q(keyspace, 'upsertUserTimeline'), data, {prepare:true}, cb);
    }

    var insertFollowersTimeline = function(cb) {
      client.execute(q(keyspace, 'selectFollowers'), [user], {prepare:true} ,function(err, data) {
        /* istanbul ignore if */
        if(err || data.rows.length == 0) { return cb(err); }
        async.map(data.rows, function(row, cb2) {
          query.isFriend(keyspace, row.user, row.user_follower, function(err, isFriend) {
            if(!isprivate || (isprivate && isFriend)) {
              inTimeline.push(row.user_follower);
              var data = [row.user_follower, item, type, cassandra.types.timeuuid(), isprivate];
              client.execute(q(keyspace, 'upsertUserTimeline'), data, {prepare:true}, cb2);
            } else {
              cb2();
            }
          });
        }, cb);
      });
    }

    var insertMentionedTimeline = function(cb) {
      if(type === 'post') {
        query.getPost(keyspace, user, item, function(err, post) {
          if(err || !post) return cb();
          var users = post.content.match(mention);
          if(users && users.length > 0) {
            users = users.map(function(user) { return user.replace('@',''); });
            async.map(users, function(username, cb2) {
              query.getUserByName(keyspace, username, function(err, mentionedUser) {
                if(err || !mentionedUser) {
                  return cb2();
                }
                if(!_.contains(inTimeline, mentionedUser.user)) {
                  query.isFriend(keyspace, mentionedUser.user, user, function(err, isFriend) {
                    if(!isprivate || (isprivate && isFriend)) {
                      var data = [mentionedUser.user, item, type, cassandra.types.timeuuid(), isprivate];
                      client.execute(q(keyspace, 'upsertUserTimeline'), data, {prepare:true}, cb2);
                    } else {
                      cb2();
                    }
                  });
                } else {
                  cb2();
                }
              });
            }, cb);
          } else {
            return cb();
          }
        });
      } else {
        return cb();
      }
    }

    async.series([
      insertUserTimeline,
      insertFollowersTimeline,
      insertMentionedTimeline
    ], next);

  }

  function _removeFeedsForItem(keyspace, item, next) {
    var queryData = [item];
    client.execute(q(keyspace, 'selectAllItems'), queryData, {prepare:true},  function(err, data) {
      /* istanbul ignore if */
      if(err || data.rows.length == 0) { return next(err); }
      async.map(data.rows, function(row, cb) {
        _removeFeedItem(keyspace, row.user, row.time, cb);
      },function(err, rows) {
        next(err);
      });
    });
  }

  function _removeFeedItem(keyspace, user, time, next) {
    var deleteData = [user, time];
    client.execute(q(keyspace, 'removeFromTimeline'), deleteData, {prepare:true},  function(err, result) {
      if(err) return next(err);
      next(null, {status:'removed'});
    });
  }

  return {
    addUser: addUser,
    addPost: addPost,
    addPostByName: addPostByName,
    removePost: removePost,
    addLike: addLike,
    addLikeByName: addLikeByName,
    removeLike: removeLike,
    addFriend: addFriend,
    addFriendByName: addFriendByName,
    addFriendRequest: addFriendRequest,
    removeFriend: removeFriend,
    acceptFriendRequest: acceptFriendRequest,
    addFollower: addFollower,
    addFollowerByName: addFollowerByName,
    removeFollower: removeFollower
  }

}
