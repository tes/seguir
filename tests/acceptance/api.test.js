/**
 * Acceptance test the Cassandra API directly.
 */
'use strict';
var keyspace = 'test_seguir_app';
var expect = require('expect.js');
var client = require('../../api/db/client')();
var messaging = {enabled: false};
var api = require('../../index')(client, messaging, keyspace);
var setupKeyspace = require('../../setup/setupKeyspace');
var async = require('async');
var _ = require('lodash');

describe('Social API', function() {

    var users = [], liu, postId, privatePostId, mentionPostId, followId, notFriendFollowId, likeId, friendId, reciprocalFriendId, otherFriendId, friendRequestId, privateFollowId, personalFollowId;
    var manage = api.manage;
    var query = api.query;
    var auth = api.auth;

    before(function(done) {
      this.timeout(20000);
      setupKeyspace(client, keyspace, done);
    });

    describe('users', function () {

      it('can create users', function(done) {
        async.map([
            {username: 'cliftonc', altid: '1'},
            {username: 'phteven', altid: '2'},
            {username: 'ted', altid: '3'},
            {username: 'bill', altid: '4'},
            {username: 'harold', altid: '5'},
            {username: 'jenny', altid: '6'},
            {username: 'alfred', altid: '7'}
          ], function(user, cb) {
            manage.addUser(keyspace, user.username, user.altid, {'age':15}, cb);
          }, function(err, results) {
            expect(err).to.be(undefined);
            users = results;
            liu = users[1].user; // phteven is logged in
            done(err);
        });
      });

      it('can retrieve a user by id', function(done) {
        query.getUser(keyspace, users[0].user, function(err, user) {
          expect(err).to.be(null);
          expect(user.user).to.be(users[0].user);
          expect(user.username).to.be('cliftonc');
          done();
        });
      });

      it('can retrieve a user by name', function(done) {
        query.getUserByName(keyspace, users[0].username, function(err, user) {
          expect(err).to.be(null);
          expect(user.user).to.be(users[0].user);
          expect(user.username).to.be(users[0].username);
          done();
        });
      });

      it('can retrieve a user by alternate id', function(done) {
        query.getUserByAltId(keyspace, users[0].altid, function(err, user) {
          expect(err).to.be(null);
          expect(user.user).to.be(users[0].user);
          expect(user.username).to.be(users[0].username);
          done();
        });
      });

    });

    describe('friend requests', function () {

      it('can create a friend request', function(done) {
        manage.addFriendRequest(keyspace, users[0].user, users[1].user, 'Please be my friend', Date.now(), function(err, friend_request) {
          expect(err).to.be(null);
          expect(friend_request.user).to.be(users[0].user);
          expect(friend_request.user_friend).to.be(users[1].user);
          friendRequestId = friend_request.friend_request;
          done();
        });
      });

      it('can see status of outbound friend requests', function(done) {
        query.getOutgoingFriendRequests(keyspace, users[0].user, function(err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests[0].user.user).to.be(users[0].user);
          expect(friend_requests[0].user_friend.user).to.be(users[1].user);
          done();
        });
      });

      it('can see status of incoming friend requests', function(done) {
        query.getIncomingFriendRequests(keyspace, users[1].user, function(err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests[0].user.user).to.be(users[0].user);
          expect(friend_requests[0].user_friend.user).to.be(users[1].user);
          done();
        });
      });

      it('can see status of all friend requests for incoming', function(done) {
        query.getFriendRequests(keyspace, users[1].user, function(err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests.incoming[0].user.user).to.be(users[0].user);
          expect(friend_requests.incoming[0].user_friend.user).to.be(users[1].user);
          done();
        });
      });

      it('can see status of all friend requests for outgoing', function(done) {
        query.getFriendRequests(keyspace, users[0].user, function(err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests.outgoing[0].user.user).to.be(users[0].user);
          expect(friend_requests.outgoing[0].user_friend.user).to.be(users[1].user);
          done();
        });
      });

      it('can accept a friend request and create a reciprocal friendship', function(done) {
        manage.acceptFriendRequest(keyspace, users[1].user, friendRequestId, function(err, friend) {
          expect(friend.user).to.be(users[0].user);
          expect(friend.user_friend).to.be(users[1].user);
          friendId = friend.friend;
          reciprocalFriendId = friend.reciprocal;
          done();
        });
      });

      it('it deletes the friend request after it is accepted', function(done) {
        query.getFriendRequest(keyspace, users[1].user, friendRequestId, function(err, friend_request) {
          expect(friend_request).to.be(undefined);
          done();
        });
      });

    });

    describe('friends', function () {

      it('can friend another user', function(done) {
        manage.addFriend(keyspace, users[2].user, users[3].user, Date.now(), function(err, friend) {
          expect(friend.user).to.be(users[2].user);
          expect(friend.user_friend).to.be(users[3].user);
          otherFriendId = friend.friend;
          done();
        });
      });

      it('can retrieve a friend by id', function(done) {
        query.getFriend(keyspace, liu, friendId, function(err, friend) {
          expect(friend.user).to.be(users[0].user);
          expect(friend.user_friend).to.be(users[1].user);
          done();
        });
      });

      it('can not retrieve details of a friendship for someone that you are not friends with', function(done) {
        query.getFriend(keyspace, users[0].user, otherFriendId, function(err, friend) {
          expect(err.message).to.be('You are not allowed to see this item.')
          done();
        });
      });

      it('can retrieve a list of friends for a user', function(done) {
        query.getFriends(keyspace, liu, users[0].user, function(err, friends) {
          expect(friends[0].user_friend).to.be(users[1].user);
          done();
        });
      });

      it('can not retrieve a list of friends for someone that you are not friends with', function(done) {
        query.getFriends(keyspace, users[0].user, users[2].user, function(err, friend) {
          expect(err.message).to.be('You are not allowed to see this item.')
          done();
        });
      });

      it('can add and remove a friend', function(done) {
         manage.addFriend(keyspace, users[0].user, users[4].user, Date.now(), function(err, friend) {
          manage.removeFriend(keyspace, users[0].user, users[4].user, function(err, result) {
            expect(err).to.be(null);
            expect(result.status).to.be('removed');
            query.getRawFeed(keyspace, users[0].user, users[0].user, null, 100, function(err, feed) {
              expect(_.pluck(feed, 'item')).to.not.contain(friend.friend);
              done();
            });
          });
        });
      });

    });

    describe('follows', function () {

      it('can follow a user who is a friend', function(done) {
        manage.addFollower(keyspace, users[0].user, users[1].user, Date.now(), false, false, function(err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.be(users[0].user);
          expect(follow.user_follower).to.be(users[1].user);
          followId = follow.follow;
          done();
        });
      });

      it('can follow a user who is not a friend', function(done) {
        manage.addFollower(keyspace, users[0].user, users[2].user, Date.now(), false, false, function(err, follow) {
          expect(follow.user).to.be(users[0].user);
          expect(follow.user_follower).to.be(users[2].user);
          notFriendFollowId = follow.follow;
          done();
        });
      });

      it('can follow a user privately so only your friends can see', function(done) {
        manage.addFollower(keyspace, users[4].user, users[5].user, Date.now(), true, false, function(err, follow) {
          expect(follow.user).to.be(users[4].user);
          expect(follow.user_follower).to.be(users[5].user);
          expect(follow.isprivate).to.be(true);
          privateFollowId = follow.follow;
          done();
        });
      });

      it('can follow a user personally so only you can see', function(done) {
        manage.addFollower(keyspace, users[6].user, users[5].user, Date.now(), false, true, function(err, follow) {
          expect(follow.user).to.be(users[6].user);
          expect(follow.user_follower).to.be(users[5].user);
          expect(follow.ispersonal).to.be(true);
          personalFollowId = follow.follow;
          done();
        });
      });

      it('can retrieve a follow by id', function(done) {
        query.getFollow(keyspace, users[0].user, followId, function(err, follow) {
          expect(follow.user).to.be(users[0].user);
          expect(follow.user_follower).to.be(users[1].user);
          done();
        });
      });

      it('can not see a private follow if not a friend ', function(done) {
        query.getFollow(keyspace, users[0].user, privateFollowId, function(err, follow) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('can not see a personal follow if not the user', function(done) {
        query.getFollow(keyspace, users[0].user, personalFollowId, function(err, follow) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('can retrieve a list of followers for a user', function(done) {
        query.getFollowers(keyspace, users[0].user, users[0].user, function(err, followers) {
          var followerIds = _.pluck(followers, 'user_follower');
          expect(followerIds).to.contain(users[1].user);
          expect(followerIds).to.contain(users[2].user);
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show private if not a friend', function(done) {
        query.getFollowers(keyspace, users[0].user, users[4].user, function(err, followers) {
          expect(followers.length).to.be(0);
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show personal if not the user', function(done) {
        query.getFollowers(keyspace, users[0].user, users[6].user, function(err, followers) {
          expect(followers.length).to.be(0);
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show personal if one of the two users', function(done) {
        query.getFollowers(keyspace, users[6].user, users[6].user, function(err, followers) {
          var followerIds = _.pluck(followers, 'user_follower');
          expect(followerIds).to.contain(users[5].user);
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show private if one of the two users', function(done) {
        query.getFollowers(keyspace, users[4].user, users[4].user, function(err, followers) {
          var followerIds = _.pluck(followers, 'user_follower');
          expect(followerIds).to.contain(users[5].user);
          done();
        });
      });

      it('can remove a follow', function(done) {
        manage.addFollower(keyspace, users[3].user, users[4].user, Date.now(), false, false, function(err, follow) {
          expect(err).to.be(null);
          manage.removeFollower(keyspace, users[3].user, users[4].user, function(err, result) {
            expect(result.status).to.be('removed');
            query.getRawFeed(keyspace, users[3].user, users[3].user, null, 100, function(err, feed) {
              expect(_.pluck(feed, 'item')).to.not.contain(follow.follow);
              done();
            });
          });
        });
      });

    });

    describe('posts', function () {

      it('can post a message from a user', function(done) {
        manage.addPost(keyspace, users[0].user, 'Hello, this is a post', Date.now(), false, false, function(err, post) {
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.be(users[0].user);
          postId = post.post;
          done();
        });
      });

      it('can post a private message from a user', function(done) {
        manage.addPost(keyspace, users[0].user, 'Hello, this is a private post', Date.now(), true, false, function(err, post) {
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.be(users[0].user);
          privatePostId = post.post;
          done();
        });
      });

      it('anyone can retrieve a public post by id', function(done) {
        query.getPost(keyspace, users[2].user, postId, function(err, post) {
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.be(users[0].user);
          done();
        });
      });

      it('anyone not a friend cant retrieve a private post by id', function(done) {
        query.getPost(keyspace, users[2].user, privatePostId, function(err, post) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('anyone who is a friend can retrieve a private post by id', function(done) {
        query.getPost(keyspace, users[1].user, privatePostId, function(err, post) {
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.be(users[0].user);
          done();
        });
      });

      it('you can mention yourself in a post', function(done) {
        manage.addPost(keyspace, users[4].user, 'Who am I? @harold', Date.now(), false, false, function(err, post) {
          expect(post.content).to.be('Who am I? @harold');
          done();
        });
      });

      it('you can mention someone in a post', function(done) {
        manage.addPost(keyspace, users[3].user, 'Hello, this is a post mentioning @harold', Date.now(), false, false, function(err, post) {
          expect(post.content).to.be('Hello, this is a post mentioning @harold');
          mentionPostId = post.post;
          done();
        });
      });

      it('sanitizes any input by default', function(done) {
        manage.addPost(keyspace, users[5].user, 'Evil hack <IMG SRC=j&#X41vascript:alert(\'test2\')>', Date.now(), false, false, function(err, post) {
          expect(post.content).to.be('Evil hack ');
          expect(post.user).to.be(users[5].user);
          done();
        });
      });

      it('can add and remove a post', function(done) {
        manage.addPost(keyspace, users[5].user, 'I am but a fleeting message in the night', Date.now(), false, false, function(err, post) {
          manage.removePost(keyspace, users[5].user, post.post, function(err, result) {
            expect(err).to.be(null);
            query.getRawFeed(keyspace, users[5].user, users[5].user, null, 100, function(err, feed) {
              expect(_.pluck(feed, 'item')).to.not.contain(post.post);
              done();
            });
          });
        });
      });

      it('you can add a completely personal post that only appears in the users feed', function(done) {
        manage.addPost(keyspace, users[5].user, 'Shh - this is only for me.', Date.now(), false, true, function(err, post) {
          query.getFeed(keyspace, users[4].user, users[5].user, null, 100, function(err, feed) {
              expect(_.pluck(feed, 'item')).to.not.contain(post.post);
              done();
          });
        });
      });

    });

    describe('likes', function () {

      it('can like an item from a user', function(done) {
        manage.addLike(keyspace, users[0].user, 'http://github.com', Date.now(), function(err, like) {
          expect(like.item).to.be('http://github.com');
          likeId = like.like;
          done();
        });
      });

      it('can retrieve a like by id', function(done) {
        query.getLike(keyspace, likeId, function(err, like) {
          expect(like.item).to.be('http://github.com');
          expect(like.user).to.be(users[0].user);
          done();
        });
      });

      it('can check if a user likes an item', function(done) {
        query.checkLike(keyspace, users[0].user,'http://github.com', function(err, like) {
          expect(like.like).to.be(likeId);
          expect(like.user).to.be(users[0].user);
          done();
        });
      });

      it('can add and remove a like', function(done) {
        manage.addLike(keyspace, users[5].user, 'http://seguir.calip.so', Date.now(), function(err, like) {
          manage.removeLike(keyspace, users[5].user, 'http://seguir.calip.so', function(err, result) {
            expect(err).to.be(null);
            query.getRawFeed(keyspace, users[5].user, users[5].user, null, 100, function(err, feed) {
              expect(_.pluck(feed, 'item')).to.not.contain(like.like);
              done();
            });
          });
        });
      });

    });

    describe('feeds', function () {

        this.timeout(10000);

        it('logged in - can get a feed for yourself that is in the correct order', function(done) {
          query.getFeed(keyspace, users[0].user, users[0].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[0].like).to.be(likeId);
            expect(feed[1].post).to.be(privatePostId);
            expect(feed[2].post).to.be(postId);
            expect(feed[3].follow).to.be(notFriendFollowId);
            expect(feed[4].follow).to.be(followId);
            expect(feed[5].friend).to.be(friendId);
            done();
          });
        });

        it('logged in - can get a feed for a friend that is in the correct order', function(done) {
          query.getFeed(keyspace, users[1].user, users[0].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[0].like).to.be(likeId);
            expect(feed[1].post).to.be(privatePostId); //
            expect(feed[2].post).to.be(postId);
            expect(feed[3].follow).to.be(notFriendFollowId);
            expect(feed[4].follow).to.be(followId);
            expect(feed[5].friend).to.be(friendId);
            done();
          });
        });

        it('logged in - can get a feed for a friend and follower that is in the correct order', function(done) {
          query.getFeed(keyspace, users[0].user, users[1].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[0].like).to.be(likeId);
            expect(feed[1].post).to.be(privatePostId);
            expect(feed[2].post).to.be(postId);
            expect(feed[3].follow).to.be(notFriendFollowId);
            expect(feed[4].follow).to.be(followId);
            done();
          });
        });

        it('logged in - can get a feed for a follower that is not a friend in the correct order', function(done) {
          query.getFeed(keyspace, users[0].user, users[2].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[0].like).to.be(likeId);
            expect(feed[1].post).to.be(postId);
            expect(feed[2].follow).to.be(notFriendFollowId);
            done();
          });
        });

        it('anonymous - can get a feed that is in correct order', function(done) {
          query.getFeed(keyspace, '_anonymous_', users[0].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[0].like).to.be(likeId);
            expect(feed[1].post).to.be(postId);
            expect(feed[2].follow).to.be(notFriendFollowId);
            done();
          });
        });

        it('can see private follows as the user', function(done) {
          query.getFeed(keyspace, users[4].user, users[4].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[2].follow).to.be(privateFollowId);
            done();
          });
        });

        it('can see personal follows as the user', function(done) {
          query.getFeed(keyspace, users[6].user, users[6].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[0].follow).to.be(personalFollowId);
            done();
          });
        });

        it('anonymous - cant see personal follows as the anonymous user', function(done) {
          query.getFeed(keyspace, '_anonymous_', users[6].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed.length).to.be(0);
            done();
          });
        });

        it('anonymous - cant see private follows as anonymous user', function(done) {
          query.getFeed(keyspace, '_anonymous_', users[4].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed.length).to.be(2);
            done();
          });
        });

        it('logged in - can get a feed for yourself contains mentions', function(done) {
          query.getFeed(keyspace, users[4].user, users[4].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[0].post).to.be(mentionPostId);
            done();
          });
        });

        it('cant see follows or mentions on a users personal feed, only direct items', function(done) {
          query.getUserFeed(keyspace, '_anonymous_', users[0].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[0].like).to.be(likeId);
            expect(feed[1].post).to.be(postId);
            expect(feed[2].follow).to.be(notFriendFollowId);
            done();
          });
        });

        it('logged in - can get a users personal feed as the user and see direct actions', function(done) {
          query.getUserFeed(keyspace, users[3].user, users[3].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[0].post).to.be(mentionPostId);
            done();
          });
        });

        it('logged in - can get a users personal feed as a friend and see direct items private or public', function(done) {
          query.getUserFeed(keyspace, users[0].user, users[1].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed[0].friend).to.be(reciprocalFriendId);
            done();
          });
        });

        it('anonymus - can get a users personal feed anonymously and only see direct, public items', function(done) {
          query.getUserFeed(keyspace, '_anonymous_', users[1].user, null, 100, function(err, feed) {
            expect(err).to.be(null);
            expect(feed.length).to.be(0);
            done();
          });
        });

    });

    describe('relationships', function () {

      it('can query a relationship between a user and themselves', function(done) {
        query.getUserRelationship(keyspace, users[0].user, users[0].user, function(err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(true);
          done();
        });
      });

      it('can query a relationship between a user and another user', function(done) {
        query.getUserRelationship(keyspace, users[0].user, users[1].user, function(err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(true);
          done();
        });
      });

      it('can query the inverse relationship between a user and another user', function(done) {
        query.getUserRelationship(keyspace, users[1].user, users[0].user, function(err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(false);
          done();
        });
      });

      it('can query the relationship between users who have no relationship', function(done) {
        query.getUserRelationship(keyspace, users[0].user, users[3].user, function(err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(false);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          done();
        });
      });

    });

});

