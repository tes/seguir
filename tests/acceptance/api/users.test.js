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

  describe('API [Users] - ' + db, function () {

    this.timeout(10000);
    this.slow(5000);

    var api, users = {};

    before(function (done) {
      this.timeout(20000);
      initialiser.setupApi(keyspace, config, function (err, seguirApi) {
        expect(err).to.be(null);
        api = seguirApi;
        done();
      });
    });

    describe('users', function () {

      it('can create users', function (done) {
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
          done(err);
        });
      });

      it('can retrieve a user by id', function (done) {
        api.user.getUser(keyspace, users['cliftonc'].user, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.eql(users['cliftonc'].user);
          expect(user.username).to.be('cliftonc');
          done();
        });
      });

      it('can retrieve a user by name', function (done) {
        api.user.getUserByName(keyspace, users['cliftonc'].username, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.eql(users['cliftonc'].user);
          expect(user.username).to.be(users['cliftonc'].username);
          done();
        });
      });

      it('can retrieve a user by alternate id', function (done) {
        api.user.getUserByAltId(keyspace, users['cliftonc'].altid, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.eql(users['cliftonc'].user);
          expect(user.username).to.be(users['cliftonc'].username);
          done();
        });
      });

      it('can update a users data', function (done) {
        api.user.updateUser(keyspace, users['json'].user, 'new_name', 'new_altid', {hello: 'world'}, function (err, user) {
          expect(err).to.be(null);
          api.user.getUser(keyspace, users['json'].user, function (err, user) {
            expect(err).to.be(null);
            expect(user.user).to.eql(users['json'].user);
            expect(user.username).to.be('new_name');
            expect(user.altid).to.be('new_altid');
            expect(user.userdata.hello).to.be('world');
            done();
          });
        });
      });

    });

    describe('initialising users and follows', function () {

      var actions = [
        {key: 'post-public', type: 'post', user: 'cliftonc', content: 'hello', contentType: 'text/html'},
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

      it('can optionally initialise a user with a follow relationship and automatically populate their feed', function (done) {

        var initialise = {
          follow: {
            users: [users['cliftonc'].username, users['phteven'].username],
            backfill: '1d',
            isprivate: false,
            ispersonal: true
          }
        };

        api.user.addUser(keyspace, 'shaun', 'baah', {type: 'sheep'}, initialise, function (err, user) {
          expect(err).to.be(null);
          api.feed.getFeed(keyspace, user.user, user.user, null, 50, function (err, feed) {
            expect(err).to.be(null);
            expect(feed[2].post).to.eql(actionResults['post-public'].post);
            done();
          });
        });

      });

      it('can optionally backfill a follow relationship and automatically populate their feed', function (done) {

        api.user.addUser(keyspace, 'bitzer', 'woof', {type: 'dog'}, function (err, user) {
          expect(err).to.be(null);
          api.follow.addFollower(keyspace, users['cliftonc'].user, user.user, api.client.getTimestamp(), false, false, '1d', function (err, follow) {
            expect(err).to.be(null);
            api.feed.getFeed(keyspace, user.user, user.user, null, 50, function (err, feed) {
              expect(err).to.be(null);
              expect(feed[0].follow).to.eql(follow.follow);
              expect(feed[1].post).to.eql(actionResults['post-public'].post);
              done();
            });
          });
        });

      });

    });

  });

});

