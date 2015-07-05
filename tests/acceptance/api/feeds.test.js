/**
 * Acceptance test the Cassandra API directly.
 */

/*eslint-env node, mocha */

var keyspace = 'test_seguir_app_api';
var expect = require('expect.js');
var initialiser = require('../../fixtures/initialiser');
var databases = process.env.DATABASE ? [process.env.DATABASE] : ['postgres', 'cassandra'];
var _ = require('lodash');

databases.forEach(function (db) {

  var config = _.clone(require('../../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe('API [Feeds] - ' + db, function () {

    this.timeout(10000);
    this.slow(5000);

    var api, users = {};

    before(function (done) {
      this.timeout(20000);
      initialiser.setupApi(keyspace, config, function (err, seguirApi) {
        expect(err).to.be(null);
        api = seguirApi;
        initialiser.setupUsers(keyspace, api, [
          {username: 'cliftonc', altid: '1'},
          {username: 'phteven', altid: '2'},
          {username: 'ted', altid: '3'},
          {username: 'bill', altid: '4'},
          {username: 'harold', altid: '5'},
          {username: 'jenny', altid: '6'},
          {username: 'alfred', altid: '7'},
          {username: 'json', altid: '8'}
        ], function (err, userMap) {
          expect(err).to.be(null);
          users = userMap;
          done();
        });
      });
    });

    describe('feeds', function () {

      var actions = [
        {key: 'follow-1', type: 'follow', user: 'cliftonc', user_follower: 'phteven'},
        {key: 'follow-2', type: 'follow', user: 'cliftonc', user_follower: 'ted'},
        {key: 'follow-3', type: 'follow', user: 'bill', user_follower: 'alfred'},
        {key: 'follow-private', type: 'follow', user: 'harold', user_follower: 'bill', isprivate: true},
        {key: 'follow-personal', type: 'follow', user: 'alfred', user_follower: 'jenny', ispersonal: true},
        {key: 'friend-1', reciprocal: 'reciprocal-friend-1', type: 'friend', user: 'cliftonc', user_friend: 'phteven'},
        {key: 'friend-2', reciprocal: 'reciprocal-friend-2', type: 'friend', user: 'cliftonc', user_friend: 'harold'},
        {key: 'post-private-old', type: 'post', user: 'cliftonc', content: 'hello', contentType: 'text/html', timestamp: new Date(1280296860145)},
        {key: 'post-public', type: 'post', user: 'phteven', content: 'hello', contentType: 'text/html'},
        {key: 'post-mention', type: 'post', user: 'bill', content: 'mentioning @json', contentType: 'text/html'},
        {key: 'post-mention-follower', type: 'post', user: 'bill', content: 'mentioning @alfred', contentType: 'text/html'},
        {key: 'like-google', type: 'like', user: 'cliftonc', item: 'http://www.google.com'}
      ];
      var actionResults = {};

      before(function (done) {
        initialiser.setupGraph(keyspace, api, users, actions, function (err, results) {
          expect(err).to.be(null);
          actionResults = results;
          done();
        });
      });

      this.timeout(10000);

      it('logged in - can get a feed for yourself that is in the correct order', function (done) {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'like-google',
            'friend-2',
            'friend-1',
            'follow-2',
            'follow-1',
            'post-private-old'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a feed for a friend that is in the correct order', function (done) {
        api.feed.getFeed(keyspace, users['phteven'].user, users['cliftonc'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'like-google',
            'friend-1',
            'follow-2',
            'follow-1',
            'post-private-old'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a feed for a friend and follower that is in the correct order', function (done) {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['phteven'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'like-google',
            'post-public',
            'friend-2',
            'reciprocal-friend-1',
            'follow-2',
            'follow-1',
            'post-private-old'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a feed for a follower that is not a friend in the correct order', function (done) {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['ted'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'like-google',
            'follow-2',
            'post-private-old'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('anonymous - can get a feed that is in correct order', function (done) {
        api.feed.getFeed(keyspace, null, users['cliftonc'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'like-google',
            'follow-2',
            'follow-1',
            'post-private-old'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can see private follows as the user', function (done) {
        api.feed.getFeed(keyspace, users['harold'].user, users['harold'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'reciprocal-friend-2',
            'follow-private'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can not see private follows as the anonymous user', function (done) {
        api.feed.getFeed(keyspace, null, users['harold'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can see personal follows as the user', function (done) {
        api.feed.getFeed(keyspace, users['alfred'].user, users['alfred'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'post-mention-follower',
            'post-mention',
            'follow-personal',
            'follow-3'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('cant see personal follows as another user', function (done) {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['alfred'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'post-mention-follower',
            'post-mention',
            'follow-3'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('cant see personal follows as the anonymous user', function (done) {
        api.feed.getFeed(keyspace, null, users['alfred'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'post-mention-follower',
            'post-mention',
            'follow-3'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can see personal follows as the following user', function (done) {
        api.feed.getFeed(keyspace, users['jenny'].user, users['jenny'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'follow-personal'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can get a feed for yourself contains mentions', function (done) {
        api.feed.getFeed(keyspace, users['bill'].user, users['bill'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'post-mention-follower',
            'post-mention',
            'follow-3'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can get a feed for yourself that contains posts you were mentioned in', function (done) {
        api.feed.getFeed(keyspace, users['json'].user, users['json'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'post-mention'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('cant see follows or mentions on a users personal feed, only direct items', function (done) {
        api.feed.getUserFeed(keyspace, null, users['cliftonc'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'like-google',
            'follow-2',
            'follow-1',
            'post-private-old'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a users personal feed as the user and see direct actions', function (done) {
        api.feed.getUserFeed(keyspace, users['bill'].user, users['bill'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'post-mention-follower',
            'post-mention',
            'follow-3'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a users personal feed as a friend and see direct items private or public', function (done) {
        api.feed.getUserFeed(keyspace, users['cliftonc'].user, users['phteven'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'post-public',
            'reciprocal-friend-1'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('anonymous - can get a users personal feed anonymously and only see direct, public items', function (done) {
        api.feed.getUserFeed(keyspace, null, users['phteven'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          var expected = [
            'post-public'
          ];
          assertFeed(feed, actionResults, expected);
          done();
        });
      });

    });

  });

});

function assertFeed (feed, actionResults, expected) {
  var feedKeys = _.map(feed, function (item) { return {item: item._item, type: item.type}; });
  var expectedFeed = _.map(expected, function (key) {
    var type;
    // This is due to no common identifier and type - we should refactor to add these
    if (actionResults[key].like) { type = 'like'; }
    if (actionResults[key].post) { type = 'post'; }
    if (actionResults[key].friend) { type = 'friend'; }
    if (actionResults[key].follow) { type = 'follow'; }
    return {item: actionResults[key][type], type: type};
  });
  expect(feedKeys).to.eql(expectedFeed);
}

