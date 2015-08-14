/**
 * Relationships
 */

/*eslint-env node, mocha */

var keyspace = 'test_seguir_app_api';
var expect = require('expect.js');
var initialiser = require('../../fixtures/initialiser');
var databases = process.env.DATABASE ? [process.env.DATABASE] : ['postgres', 'cassandra', 'cassandra-redis'];
var _ = require('lodash');

databases.forEach(function (db) {

  var config = _.clone(require('../../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe('API [Relationships] - ' + db, function () {

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

    describe('relationships', function () {

      var actions = [
        {type: 'follow', user: 'cliftonc', user_follower: 'phteven'},
        {type: 'follow', user: 'cliftonc', user_follower: 'ted'},
        {type: 'friend', user: 'cliftonc', user_friend: 'phteven'},
        {type: 'friend', user: 'cliftonc', user_friend: 'harold'}
      ];

      before(function (done) {
        initialiser.setupGraph(keyspace, api, users, actions, done);
      });

      it('can query a relationship between a user and themselves', function (done) {
        api.user.getUserRelationship(keyspace, users['cliftonc'].user, users['cliftonc'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(2);
          done();
        });
      });

      it('can query a relationship between a user and another user', function (done) {
        api.user.getUserRelationship(keyspace, users['cliftonc'].user, users['phteven'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(true);
          expect(relationship.followerCount).to.be(0);
          done();
        });
      });

      it('can query the inverse relationship between a user and another user', function (done) {
        api.user.getUserRelationship(keyspace, users['phteven'].user, users['cliftonc'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(2);
          done();
        });
      });

      it('can query the relationship between users who have no relationship', function (done) {
        api.user.getUserRelationship(keyspace, users['cliftonc'].user, users['bill'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(false);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(0);
          done();
        });
      });

      it('can query a relationship between the anonymous user and a user', function (done) {
        api.user.getUserRelationship(keyspace, null, users['cliftonc'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(false);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(2);
          done();
        });
      });

    });

  });

});

