/**
 * Acceptance test the Cassandra API directly.
 */
'use strict';
var keyspace = 'test_seguir_app';
var expect = require('expect.js');
var config = require('../../server/config');
var client = require('../../api/db/client')();
var messaging = require('../../api/db/messaging')();
var worker = require('../../server/worker');
var api = require('../../index')(client, messaging, keyspace);
var setupKeyspace = require('../../setup/setupKeyspace');
var async = require('async');
var _ = require('lodash');

describe('Worker Processing', function() {

    var users = [], liu, postId, mentionPostId, followId;
    var manage = api.manage;
    var query = api.query;
    var auth = api.auth;

    before(function(done) {
      this.timeout(20000);
      setupKeyspace(client, keyspace, function() {
        worker(config, done);
      });
    });

    describe('users', function () {

      it('can create users', function(done) {
        async.map([
            {username: 'cliftonc', altid: '1'},
            {username: 'phteven', altid: '2'},
            {username: 'ted', altid: '3'}
          ], function(user, cb) {
            manage.addUser(keyspace, user.username, user.altid, {'age':15}, cb);
          }, function(err, results) {
            expect(err).to.be(undefined);
            users = results;
            liu = users[1].user; // phteven is logged in
            done(err);
        });
      });

    });

    describe('follows', function () {

      it('can follow a user who is not a friend', function(done) {
        manage.addFollower(keyspace, users[0].user, users[1].user, Date.now(), false, false, function(err, follow) {
          expect(follow.user).to.be(users[0].user);
          expect(follow.user_follower).to.be(users[1].user);
          followId = follow.follow;
          done();
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

      it('you can mention someone in a post', function(done) {
        manage.addPost(keyspace, users[2].user, 'Hello, this is a post mentioning @cliftonc, not from a follower', Date.now(), false, false, function(err, post) {
          expect(post.content).to.be('Hello, this is a post mentioning @cliftonc, not from a follower');
          mentionPostId = post.post;
          done();
        });
      });

    });

    describe('feeds', function () {

        this.timeout(5000);

        it('logged in - can get a feed for yourself that is in the correct order', function(done) {

          setTimeout(function() {
            query.getFeedForUser(keyspace, users[0].user, users[0].user, null, 100, function(err, feed) {
              expect(err).to.be(null);
              expect(feed[2].follow).to.be(followId);
              expect(feed[1].post).to.be(postId);
              expect(feed[0].post).to.be(mentionPostId);
              done();
            });
          }, 4000);
        });

    });

});

