'use strict';
var keyspace = 'test_seguir';
var expect = require('expect.js');
var client = require('../../db/client')();
var create = require('../../api/create')(client, keyspace);
var get = require('../../api/get')(client, keyspace);
var setup = require('../../setup');
var async = require('async');

describe('Social API', function() {

    var users = [], postId, followId, likeId, friendId;

    before(function(done) {
      this.timeout(20000);
      setup(keyspace, done);
    });

    describe('users', function () {

      it('can create users', function(done) {
        async.map(['cliftonc','phteven','ted'], create.addUser, function(err, results) {
          users = results;
          done()
        });
      });

      it('can retrieve a user by id', function(done) {
        get.getUser(users[0].user, function(err, user) {
          expect(user.user).to.be(users[0].user);
          expect(user.username).to.be('cliftonc');
          done();
        });
      });

      it('can retrieve a user by name', function(done) {
        get.getUserByName(users[0].username, function(err, user) {
          expect(user.user).to.be(users[0].user);
          expect(user.username).to.be(users[0].username);
          done();
        });
      });

    });


    describe('follows', function () {

      it('can follow a user', function(done) {
        create.addFollower(users[0].user, users[1].user, Date.now(), function(err, follow) {
          expect(follow.user).to.be(users[0].user);
          expect(follow.user_follower).to.be(users[1].user);
          followId = follow.follow;
          done();
        });
      });

      it('can retrieve a follow by id', function(done) {
        get.getFollow(followId, function(err, follow) {
          expect(follow.user).to.be(users[0].user);
          expect(follow.user_follower).to.be(users[1].user);
          done();
        });
      });

       it('can retrieve a list of followers for a user', function(done) {
        get.getFollowers(users[0].user, function(err, followers) {
          expect(followers[0].user_follower).to.be(users[1].user);
          done();
        });
      });

    });

    describe('posts', function () {

      it('can post a message from a user', function(done) {
        create.addPost(users[0].user, 'Hello, this is a post', Date.now(), function(err, post) {
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.be(users[0].user);
          postId = post.post;
          done();
        });
      });

      it('can retrieve a post by id', function(done) {
        get.getPost(postId, function(err, post) {
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.be(users[0].user);
          done();
        });
      });

    });

    describe('likes', function () {

      it('can like an item from a user', function(done) {
        create.addLike(users[0].user, 'http://github.com', Date.now(), function(err, like) {
          expect(like.item).to.be('http://github.com');
          likeId = like.like;
          done();
        });
      });

      it('can retrieve a like by id', function(done) {
        get.getLike(likeId, function(err, like) {
          expect(like.item).to.be('http://github.com');
          expect(like.user).to.be(users[0].user);
          done();
        });
      });

      it('can check if a user likes an item', function(done) {
        get.checkLike('cliftonc','http://github.com', function(err, like) {
          expect(like.like).to.be(likeId);
          expect(like.user).to.be(users[0].user);
          done();
        });
      });

    });

    describe('friends', function () {

      it('can friend a user', function(done) {
        create.addFriend(users[0].user, users[1].user, Date.now(), function(err, friend) {
          expect(friend.user).to.be(users[0].user);
          expect(friend.user_friend).to.be(users[1].user);
          friendId = friend.friend;
          done();
        });
      });

      it('can retrieve a friend by id', function(done) {
        get.getFriend(friendId, function(err, friend) {
          expect(friend.user).to.be(users[0].user);
          expect(friend.user_friend).to.be(users[1].user);
          done();
        });
      });

      it('can retrieve a list of friends for a user', function(done) {
        get.getFriends(users[0].user, function(err, friends) {
          expect(friends[0].user_friend).to.be(users[1].user);
          done();
        });
      });

    });

    describe('feed', function () {

      it('can get a feed for a user that is in the correct order', function(done) {
        get.getFeedForUser('cliftonc', null, 100, function(err, feed) {
          expect(feed[0].friend).to.be(friendId);
          expect(feed[1].like).to.be(likeId);
          expect(feed[2].post).to.be(postId);
          expect(feed[3].follow).to.be(followId);
          done();
        });
      });

      it('can get a feed for a follower that is in the correct order', function(done) {
        get.getFeedForUser('phteven', null, 100, function(err, feed) {
          expect(feed[0].friend).to.be(friendId);
          expect(feed[1].like).to.be(likeId);
          expect(feed[2].post).to.be(postId);
          expect(feed[3].follow).to.be(followId);
          done();
        });
      });

    });

});
