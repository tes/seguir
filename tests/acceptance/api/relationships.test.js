/**
 * Relationships
 */

/* eslint-env node, mocha */

const keyspace = 'test_seguir_app_api';
const expect = require('expect.js');
const initialiser = require('../../fixtures/initialiser');
const databases = process.env.DATABASE ? [process.env.DATABASE] : ['cassandra-redis'];
const _ = require('lodash');

databases.forEach((db) => {
  const config = _.clone(require(`../../fixtures/${db}.json`));
  config.keyspace = keyspace;

  describe(`API [Relationships] - ${db}`, function () {
    this.timeout(20000);
    this.slow(5000);

    let api;
    let users = {};

    before((done) => {
      this.timeout(20000);
      initialiser.setupApi(keyspace, config, (err, seguirApi) => {
        expect(err).to.be(null);
        api = seguirApi;
        initialiser.setupUsers(keyspace, api, [
          { username: 'cliftonc', altid: '1' },
          { username: 'phteven', altid: '2' },
          { username: 'ted', altid: '3' },
          { username: 'bill', altid: '4' },
          { username: 'harold', altid: '5' },
          { username: 'jenny', altid: '6' },
          { username: 'alfred', altid: '7' },
          { username: 'json', altid: '8' },
        ], (err, userMap) => {
          expect(err).to.be(null);
          users = userMap;
          done();
        });
      });
    });

    describe('relationships', () => {
      const actions = [
        { type: 'follow', user: 'cliftonc', user_follower: 'phteven' },
        { type: 'follow', user: 'cliftonc', user_follower: 'ted' },
        { type: 'friend', user: 'cliftonc', user_friend: 'phteven' },
        { type: 'friend', user: 'cliftonc', user_friend: 'harold' },
      ];

      before((done) => {
        initialiser.setupGraph(keyspace, api, users, actions, done);
      });

      it('can query a relationship between a user and themselves', (done) => {
        api.user.getUserRelationship(keyspace, users['cliftonc'].user, users['cliftonc'].user, (err, relationship) => {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(2);
          expect(relationship.followingCount).to.be(0);
          done();
        });
      });

      it('can query a relationship between a user and another user', (done) => {
        api.user.getUserRelationship(keyspace, users['cliftonc'].user, users['phteven'].user, (err, relationship) => {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(true);
          expect(relationship.followerCount).to.be(0);
          expect(relationship.followingCount).to.be(1);
          done();
        });
      });

      it('can query the inverse relationship between a user and another user', (done) => {
        api.user.getUserRelationship(keyspace, users['phteven'].user, users['cliftonc'].user, (err, relationship) => {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(2);
          expect(relationship.followingCount).to.be(0);
          done();
        });
      });

      it('can query the relationship between users who have no relationship', (done) => {
        api.user.getUserRelationship(keyspace, users['cliftonc'].user, users['bill'].user, (err, relationship) => {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(false);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(0);
          expect(relationship.followingCount).to.be(0);
          done();
        });
      });

      it('can query a relationship between the anonymous user and a user', (done) => {
        api.user.getUserRelationship(keyspace, null, users['cliftonc'].user, (err, relationship) => {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(false);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(2);
          expect(relationship.followingCount).to.be(0);
          done();
        });
      });
    });
  });
});
