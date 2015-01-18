'use strict';
var keyspace = 'test_seguir';
var expect = require('expect.js');
var client = require('../../db/client');
var create = require('../../api/create')(client, keyspace);
var setup = require('../../setup');

describe('Create API', function() {

    var userKeys = [];

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

    });

    describe('posts', function () {

      it('can post a message from a user', function(done) {
        create.addPost(userKeys[0], 'Hello, this is a post', Date.now(), function(err, post) {
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
          done();
        });
      });

    });

    describe('friends', function () {

      it('can friend a user', function(done) {
        create.addFriend(userKeys[0], userKeys[1], Date.now(), function(err, friend) {
          expect(friend.user).to.be(userKeys[0]);
          expect(friend.user_friend).to.be(userKeys[1]);
          done();
        });
      });
    });

    describe('follows', function () {

      it('can follow a user', function(done) {
        create.addFollower(userKeys[0], userKeys[1], Date.now(), function(err, follow) {
          expect(follow.user).to.be(userKeys[0]);
          expect(follow.user_follower).to.be(userKeys[1]);
          done();
        });
      });

    });

});
