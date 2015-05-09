/**
 * Acceptance test the Cassandra API directly.
 */
'use strict';
var keyspace = 'test_client_seguir';
var dbClient = require('../../api/db/client')();
var messaging = {enabled: false}
var api = require('../../index')(dbClient, messaging, keyspace);
var cassandra = require('cassandra-driver');
var expect = require('expect.js');
var Seguir = require('../../client');
var setupSeguir = require('../../setup/setupSeguir');
var async = require('async');
var _ = require('lodash');
var auth = api.auth;
var startServer = require('../../server');
var credentials = {host: 'http://localhost:3001'};

describe('Seguir Social Server / Client API', function() {

    this.timeout(3000);

    var users = [], liu, postId, privatePostId, followId, notFriendFollowId, followUserId, reciprocalFriendId, friendRequestId, likeId, friendId, seguirServer, client;

    before(function(done) {
      this.timeout(20000);
      setupSeguir(dbClient, keyspace, function() {
        auth.addAccount('test account', false, false, function(err, account) {
          auth.addApplication(account.account, 'test application', null, null, function(err, application) {
            startServer({logging: false}, keyspace, function(err, server) {
                seguirServer = server;
                server.listen(3001, function() {
                  credentials.appid = application.appid;
                  credentials.appsecret = application.appsecret;
                  client = new Seguir(credentials);
                  done();
                });
            });
          });
        })
      });
    });

    after(function() {
      seguirServer.close();
    })

    describe('Users', function () {

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
          client.addUser(null, user.username, user.altid, {avatar:'test.jpg'}, cb);
        }, function(err, results) {
          users = results;
          liu = users[0].user; // clifton is logged in
          done();
        });
      });

      it('can retrieve a user by id', function(done) {
        client.getUser(null, users[0].user, function(err, user) {
          expect(err).to.be(null);
          expect(user.user).to.be(users[0].user);
          expect(user.username).to.be('cliftonc');
          done();
        });
      });

      it('can retrieve a user by name', function(done) {
        client.getUserByName(null, 'cliftonc', function(err, user) {
          expect(err).to.be(null);
          expect(user.user).to.be(users[0].user);
          expect(user.username).to.be(users[0].username);
          done();
        });
      });

    });


    describe('friend requests', function () {

      it('can create a friend request', function(done) {
        client.addFriendRequest(users[0].user, users[1].user, 'Please be my friend', Date.now(), function(err, friend_request) {
          expect(err).to.be(null);
          expect(friend_request.user).to.be(users[0].user);
          expect(friend_request.user_friend).to.be(users[1].user);
          friendRequestId = friend_request.friend_request;
          done();
        });
      });

      it('can see status of friend requests', function(done) {
        client.getFriendRequests(users[0].user, function(err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests.outgoing[0].user.user).to.be(users[0].user);
          expect(friend_requests.outgoing[0].user_friend.user).to.be(users[1].user);
          done();
        });
      });

      it('can accept a friend request and create a reciprocal friendship', function(done) {
        client.acceptFriendRequest(users[1].user, friendRequestId, function(err, friend) {
          expect(friend.user).to.be(users[0].user);
          expect(friend.user_friend).to.be(users[1].user);
          friendId = friend.friend;
          reciprocalFriendId = friend.reciprocal;
          done();
        });
      });

    });

    describe('friends', function () {

      it('can retrieve a friend by id', function(done) {
        client.getFriend(liu, friendId, function(err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.be(users[0].user);
          expect(friend.user_friend).to.be(users[1].user);
          done();
        });
      });

      it('can retrieve a list of friends for a user', function(done) {
        client.getFriends(liu, users[0].user, function(err, friends) {
          expect(err).to.be(null);
          expect(friends[0].user_friend).to.be(users[1].user);
          done();
        });
      });

      it('can add and remove a friend', function(done) {
        client.addFriendRequest(users[3].user, users[4].user, 'Please be my friend', Date.now(), function(err, friend_request) {
          expect(err).to.be(null);
          client.acceptFriendRequest(users[3].user, friend_request.friend_request, function(err, friend) {
            expect(err).to.be(null);
            client.getFriend(users[3].user, friend.friend, function(err, friend) {
              expect(err).to.be(null);
              client.removeFriend(users[3].user, users[4].user, function(err, result) {
                expect(err).to.be(null);
                client.getFriend(users[3].user, friend.friend, function(err, friend) {
                  expect(err.statusCode).to.be(404);
                  done();
                });
              })
            });
          });
        });
      });

     });

    describe('follows', function () {

      it('can add a follower who is a friend', function(done) {
        client.followUser(users[1].user, liu, Date.now(), function(err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.be(users[0].user);
          expect(follow.user_follower).to.be(users[1].user);
          followId = follow.follow;
          done();
        });
      });

      it('can add a follower who is not a friend', function(done) {
        client.followUser(users[2].user, liu,  Date.now(), function(err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.be(users[0].user);
          expect(follow.user_follower).to.be(users[2].user);
          notFriendFollowId = follow.follow;
          done();
        });
      });

       it('can follow a user who is not a friend', function(done) {
        client.followUser(users[3].user, users[2].user, Date.now(), function(err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.be(users[2].user);
          expect(follow.user_follower).to.be(users[3].user);
          followUserId = follow.follow
          done();
        });
      });

      it('can retrieve a follow by id', function(done) {
        client.getFollow(liu, followId, function(err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.be(users[0].user);
          expect(follow.user_follower).to.be(users[1].user);
          done();
        });
      });

      it('can retrieve a list of followers for a user', function(done) {
        client.getFollowers(liu, users[0].user, function(err, followers) {
          expect(err).to.be(null);
          var followerIds = _.pluck(followers, 'user_follower');
          expect(followerIds).to.contain(users[1].user);
          expect(followerIds).to.contain(users[2].user);
          done();
        });
      });

      it('can add and then remove a follower', function(done) {
         client.followUser(users[3].user, users[4].user, Date.now(), function(err, follow) {
          expect(err).to.be(null);
          client.getFollowers(users[4].user, users[4].user, function(err, followers1) {
            expect(_.pluck(followers1,'user_follower')).to.contain(users[3].user);
            client.unFollowUser(users[3].user, users[4].user, function(err, result) {
              expect(result.status).to.be('removed');
              client.getFollowers(users[4].user, users[4].user, function(err, followers2) {
                expect(followers2.length).to.be(0);
                done();
              });
            })
          });
        });
      });

    });

    describe('posts', function () {

      it('can post a message from a user', function(done) {
        client.addPost(liu, 'Hello, this is a post', Date.now(), false, false, function(err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.be(users[0].user);
          postId = post.post;
          done();
        });
      });

      it('can post a private message from a user', function(done) {
        client.addPost(liu, 'Hello, this is a private post', Date.now(), true, false, function(err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.be(users[0].user);
          privatePostId = post.post;
          done();
        });
      });

      it('anyone can retrieve a public post by id', function(done) {
        client.getPost(users[2].user, postId, function(err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.be(users[0].user);
          done();
        });
      });

      it('anyone not a friend cant retrieve a private post by id', function(done) {
        client.getPost(users[2].user, privatePostId, function(err, post) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('anyone who is a friend can retrieve a private post by id', function(done) {
        client.getPost(users[1].user, privatePostId, function(err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.be(users[0].user);
          done();
        });
      });

      it('can remove a post', function(done) {
        client.addPost(liu, 'Why cant I live longer than a few milliseconds for once?', Date.now(), true, false, function(err, post) {
          expect(err).to.be(null);
          client.removePost(liu, post.post, function(err, result) {
            expect(err).to.be(null);
            client.getPost(users[1].user, post.post, function(err, post) {
              expect(err.statusCode).to.be(404);
              done();
            });
          });
        });
      });

      it('can add a personal post', function(done) {
        client.addPost(users[5].user, 'Only you may see me', Date.now(), false, true, function(err, post) {
          expect(err).to.be(null);
          client.getPost(users[5].user, post.post, function(err, post) {
            expect(err).to.be(null);
            client.getPost(users[1].user, post.post, function(err, post) {
              expect(err.statusCode).to.be(403);
              done();
            });
          });
        });
      });

    });

    describe('likes', function () {

      it('can like an item from a user', function(done) {
        client.addLike(liu, 'http://github.com', function(err, like) {
          expect(err).to.be(null);
          expect(like.item).to.be(encodeURIComponent('http://github.com'));
          likeId = like.like;
          done();
        });
      });

      it('can retrieve a like by id', function(done) {
        client.getLike(liu, likeId, function(err, like) {
          expect(err).to.be(null);
          expect(like.item).to.be(encodeURIComponent('http://github.com'));
          expect(like.user).to.be(users[0].user);
          done();
        });
      });

      it('can check if a user likes an item', function(done) {
        client.checkLike(liu, 'http://github.com', function(err, like) {
          expect(err).to.be(null);
          expect(like.like).to.be(likeId);
          expect(like.user).to.be(users[0].user);
          done();
        });
      });

       it('can remove a like', function(done) {
        client.addLike(liu, 'http://seguir.com', function(err, like) {
          expect(err).to.be(null);
          client.removeLike(liu, 'http://seguir.com', function(err, result) {
            expect(err).to.be(null);
            client.checkLike(liu, 'http://seguir.com', function(err, like) {
              expect(err.statusCode).to.be(404);
              done();
            });
          });
        });
      });

    });

    describe('feeds', function () {

      it('logged in - can get a feed for yourself that is in the correct order', function(done) {
        client.getFeedForUser(users[0].user, users[0].user, null, 100, function(err, feed) {
          expect(err).to.be(null);
          expect(feed).to.not.be(undefined);
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
        client.getFeedForUser(users[1].user, users[0].user, null, 100, function(err, feed) {
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
        client.getFeedForUser(users[0].user, users[1].user, null, 100, function(err, feed) {
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
        client.getFeedForUser(users[0].user, users[2].user, null, 100, function(err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.be(likeId);
          expect(feed[1].post).to.be(postId);
          expect(feed[2].follow).to.be(followUserId);
          expect(feed[3].follow).to.be(notFriendFollowId);
          done();
        });
      });

      it('anonymous - can get a feed that is in correct order', function(done) {
        client.getFeedForUser(null, users[0].user, null, 100, function(err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.be(likeId);
          expect(feed[1].post).to.be(postId);
          expect(feed[2].follow).to.be(notFriendFollowId);
          done();
        });
      });

      it('logged in - can get a users personal feed as a friend and see direct items private or public', function(done) {
        client.getUserFeedForUser(users[0].user, users[1].user, null, 100, function(err, feed) {
          expect(err).to.be(null);
          expect(feed[0].friend).to.be(reciprocalFriendId);
          done();
        });
      });

      it('anonymous - can get a users personal feed anonymously and only see direct, public items', function(done) {
        client.getUserFeedForUser(null, users[1].user, null, 100, function(err, feed) {
          expect(err).to.be(null);
          expect(feed.length).to.be(0);
          done();
        });
      });

    });


    describe('relationships', function () {

      it('can query a relationship between a user and themselves', function(done) {
        client.getUserRelationship(users[0].user, users[0].user, function(err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(true);
          done();
        });
      });

      it('can query a relationship between a user and another user', function(done) {
        client.getUserRelationship(users[0].user, users[1].user, function(err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(true);
          done();
        });
      });

      it('can query the inverse relationship between a user and another user', function(done) {
        client.getUserRelationship(users[1].user, users[0].user, function(err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(false);
          done();
        });
      });

      it('can query the relationship between users who have no relationship', function(done) {
        client.getUserRelationship(users[0].user, users[3].user, function(err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(false);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          done();
        });
      });

    });

});
