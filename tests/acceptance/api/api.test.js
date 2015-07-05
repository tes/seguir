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

  describe('Social API - ' + db, function () {

    this.timeout(10000);
    this.slow(5000);

    var api, users = {}, postId;

    before(function (done) {
      this.timeout(20000);
      initialiser.setupApi(keyspace, config, function (err, seguirApi) {
        expect(err).to.be(null);
        api = seguirApi;
        done();
      });
    });

    describe('initialising users and follows', function () {

      xit('can optionally initialise a user with a follow relationship and automatically populate their feed', function (done) {

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
            expect(_.last(feed).post).to.eql(postId);
            done();
          });
        });

      });

      xit('can optionally backfill a follow relationship and automatically populate their feed', function (done) {

        api.user.addUser(keyspace, 'bitzer', 'woof', {type: 'dog'}, function (err, user) {
          expect(err).to.be(null);
          api.follow.addFollower(keyspace, users['cliftonc'].user, user.user, api.client.getTimestamp(), false, false, '1d', function (err, follow) {
            expect(err).to.be(null);
            api.feed.getFeed(keyspace, user.user, user.user, null, 50, function (err, feed) {
              expect(err).to.be(null);
              expect(feed[0].follow).to.eql(follow.follow);
              expect(feed[1].post).to.eql(postId);
              done();
            });
          });
        });

      });

    });

  });

});

