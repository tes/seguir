'use strict';
var keyspace = 'test_seguir';
var expect = require('expect.js');
var client = require('../../db/client');
var create = require('../../api/create')(client, keyspace);
var get = require('../../api/get')(client, keyspace);
var setup = require('../../setup');

describe('Social API', function() {

    var userKeys = [], postId, followId, likeId, friendId;

    before(function(done) {
      setup(keyspace, done);
    });

    describe('users', function () {

      it('can create a user', function(done) {
        create.addUser('cliftonc', function(err, user) {
          expect(user.username).to.be('cliftonc');
          userKeys.push(user.user); // For later
          done();
        });
      });

      it('can create another user so we can follow the first', function(done) {
        create.addUser('phteven', function(err, user) {
          expect(user.username).to.be('phteven');
          userKeys.push(user.user); // For later
          done();
        });
      });

      it('can retrieve a user by id', function(done) {
        get.getUser(userKeys[0], function(err, user) {
          expect(user.user).to.be(userKeys[0]);
          expect(user.username).to.be('cliftonc');
          done();
        });
      });

      it('can retrieve a user by name', function(done) {
        get.getUserByUsername('cliftonc', function(err, user) {
          expect(user.user).to.be(userKeys[0]);
          expect(user.username).to.be('cliftonc');
          done();
        });
      });

    });


    describe('follows', function () {

      it('can follow a user', function(done) {
        create.addFollower(userKeys[0], userKeys[1], Date.now(), function(err, follow) {
          expect(follow.user).to.be(userKeys[0]);
          expect(follow.user_follower).to.be(userKeys[1]);
          followId = follow.follow;
          done();
        });
      });

       it('can retrieve a follow by id', function(done) {
        get.getFollow(followId, function(err, follow) {
          expect(follow.user).to.be(userKeys[0]);
          expect(follow.user_follower).to.be(userKeys[1]);
          done();
        });
      });

       it('can retrieve a list of followers for a user', function(done) {
        get.getFollowers(userKeys[0], function(err, followers) {
          expect(followers[0].user_follower).to.be(userKeys[1]);
          done();
        });
      });

    });

    describe('posts', function () {

      it('can post a message from a user', function(done) {
        create.addPost(userKeys[0], 'Hello, this is a post', Date.now(), function(err, post) {
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.be(userKeys[0]);
          postId = post.post;
          done();
        });
      });

      it('can retrieve a post by id', function(done) {
        get.getPost(postId, function(err, post) {
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.be(userKeys[0]);
          done();
        });
      });

    });

    describe('likes', function () {

      it('can like an item from a user', function(done) {
        create.addLike(userKeys[0], 'http://github.com', Date.now(), function(err, like) {
          expect(like.item).to.be('http://github.com');
          likeId = like.like;
          done();
        });
      });

      it('can retrieve a like by id', function(done) {
        get.getLike(likeId, function(err, like) {
          expect(like.item).to.be('http://github.com');
          expect(like.user).to.be(userKeys[0]);
          done();
        });
      });

      it('can check if a user likes an item', function(done) {
        get.checkLike('cliftonc','http://github.com', function(err, like) {
          expect(like.like).to.be(likeId);
          expect(like.user).to.be(userKeys[0]);
          done();
        });
      });

    });

    describe('friends', function () {

      it('can friend a user', function(done) {
        create.addFriend(userKeys[0], userKeys[1], Date.now(), function(err, friend) {
          expect(friend.user).to.be(userKeys[0]);
          expect(friend.user_friend).to.be(userKeys[1]);
          friendId = friend.friend;
          done();
        });
      });

      it('can retrieve a friend by id', function(done) {
        get.getFriend(friendId, function(err, friend) {
          expect(friend.user).to.be(userKeys[0]);
          expect(friend.user_friend).to.be(userKeys[1]);
          done();
        });
      });

      it('can retrieve a list of friends for a user', function(done) {
        get.getFriends(userKeys[0], function(err, friends) {
          expect(friends[0].user_friend).to.be(userKeys[1]);
          done();
        });
      });

    });

    describe('feed', function () {

      it('can get a feed for a user that is in the correct order', function(done) {
        get.getFeedForUsername('cliftonc', null, 100, function(err, feed) {
          expect(feed[0].friend).to.be(friendId);
          expect(feed[1].like).to.be(likeId);
          expect(feed[2].post).to.be(postId);
          expect(feed[3].follow).to.be(followId);
          done();
        });
      });

      it('can get a feed for a follower that is in the correct order', function(done) {
        get.getFeedForUsername('phteven', null, 100, function(err, feed) {
          expect(feed[0].friend).to.be(friendId);
          expect(feed[1].like).to.be(likeId);
          expect(feed[2].post).to.be(postId);
          expect(feed[3].follow).to.be(followId);
          done();
        });
      });

    });

});
