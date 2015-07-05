/**
 * Acceptance test the Cassandra API directly.
 */

/*eslint-env node, mocha */

var keyspace = 'test_seguir_app_worker';
var expect = require('expect.js');
var Api = require('../../../api');
var config = require('../../../server/config')();
config.keyspace = keyspace;
var worker = require('../../../server/worker');
var async = require('async');

describe('Worker Processing', function () {

  var api, users = [], postId, mentionPostId, followId;

  this.timeout(10000);
  this.slow(5000);

  before(function (done) {
    Api(config, function (err, seguirApi) {
      expect(err).to.be(null);
      api = seguirApi;
      api.client.setup.setupTenant(api.client, keyspace, function () {
        worker(api, done);
      });
    });
  });

  describe('users', function () {

    it('can create users', function (done) {
      async.map([
          {username: 'cliftonc', altid: '1'},
          {username: 'phteven', altid: '2'},
          {username: 'ted', altid: '3'}
        ], function (user, cb) {
          api.user.addUser(keyspace, user.username, user.altid, {'age': 15}, cb);
        }, function (err, results) {
          expect(err).to.be(null);
          users = results;
          done(err);
        });
    });

  });

  describe('follows', function () {

    it('can follow a user who is not a friend', function (done) {
      api.follow.addFollower(keyspace, users[0].user, users[1].user, Date.now(), api.visibility.PUBLIC, function (err, follow) {
        expect(err).to.be(null);
        expect(follow.user).to.eql(users[0]);
        expect(follow.user_follower).to.eql(users[1]);
        followId = follow.follow;
        done();
      });
    });

  });

  describe('posts', function () {

    it('can post a message from a user', function (done) {
      api.post.addPost(keyspace, users[0].user, 'Hello, this is a post', 'text/html', Date.now(), api.visibility.PUBLIC, function (err, post) {
        expect(err).to.be(null);
        expect(post.content).to.be('Hello, this is a post');
        expect(post.user).to.eql(users[0]);
        postId = post.post;
        done();
      });
    });

    it('you can mention someone in a post', function (done) {
      api.post.addPost(keyspace, users[2].user, 'Hello, this is a post mentioning @cliftonc, not from a follower', 'text/html', Date.now(), api.visibility.PUBLIC, function (err, post) {
        expect(err).to.be(null);
        expect(post.content).to.be('Hello, this is a post mentioning @cliftonc, not from a follower');
        mentionPostId = post.post;
        done();
      });
    });

  });

  describe('feeds', function () {

    it('logged in - can get a feed for yourself that is in the correct order', function (done) {

      setTimeout(function () {
        api.feed.getFeed(keyspace, users[0].user, users[0].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[2].follow).to.eql(followId);
          expect(feed[1].post).to.eql(postId);
          expect(feed[0].post).to.eql(mentionPostId);
          done();
        });
      }, 500);
    });

  });

});

