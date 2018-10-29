/**
 * Likes
 */

/* eslint-env node, mocha */

const keyspace = 'test_seguir_app_api';
const expect = require('expect.js');
const initialiser = require('../../fixtures/initialiser');
const databases = process.env.DATABASE ? [process.env.DATABASE] : ['cassandra-redis'];
const _ = require('lodash');

databases.forEach((db) => {
  const config = _.clone(require('../../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe.skip('API [Likes] - ' + db, function () {
    this.timeout(20000);
    this.slow(5000);

    let api;
    let users = {};
    let likeId;

    before((done) => {
      this.timeout(20000);
      initialiser.setupApi(keyspace, config, (err, seguirApi) => {
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
        ], (err, userMap) => {
          expect(err).to.be(null);
          users = userMap;
          done();
        });
      });
    });

    describe('likes', () => {
      it('can like an item from a user', (done) => {
        api.like.addLike(keyspace, users['cliftonc'].user, 'http://github.com', api.client.getTimestamp(), (err, like) => {
          expect(err).to.be(null);
          expect(like.item).to.be('http://github.com');
          likeId = like.like;
          done();
        });
      });

      it('can retrieve a like by id', (done) => {
        api.like.getLike(keyspace, likeId, (err, like) => {
          expect(err).to.be(null);
          expect(like.item).to.be('http://github.com');
          expect(like.user).to.eql(users['cliftonc']);
          done();
        });
      });

      it('can check if a user likes an item', (done) => {
        api.like.checkLike(keyspace, users['cliftonc'].user, 'http://github.com', (err, like) => {
          expect(err).to.be(null);
          expect(like.like).to.eql(likeId);
          expect(like.user).to.eql(users['cliftonc']);
          expect(like.count).to.eql(1);
          done();
        });
      });

      it('can check if a user likes an item if they dont like it', (done) => {
        api.like.checkLike(keyspace, users['jenny'].user, 'http://github.com', (err, like) => {
          expect(err).to.be(null);
          expect(like.like).to.be(undefined);
          expect(like.user).to.eql(users['jenny']);
          expect(like.count).to.eql(1);
          done();
        });
      });

      it('can check if a user likes an item that has never been liked', (done) => {
        api.like.checkLike(keyspace, users['jenny'].user, 'http://google.com', (err, like) => {
          expect(err).to.be(null);
          expect(like.like).to.be(undefined);
          expect(like.user).to.eql(users['jenny']);
          expect(like.count).to.eql(0);
          done();
        });
      });

      it('can add and remove a like', (done) => {
        api.like.addLike(keyspace, users['jenny'].user, 'http://seguir.calip.so', api.client.getTimestamp(), (err, like) => {
          expect(err).to.be(null);
          api.like.removeLike(keyspace, users['jenny'].user, 'http://seguir.calip.so', (err, result) => {
            expect(err).to.be(null);
            api.feed.getRawFeed(keyspace, users['jenny'].user, users['jenny'].user, (err, feed) => {
              expect(err).to.be(null);
              const ids = _.map(_.map(feed, 'item'), (item) => { return item.toString(); });
              expect(ids).to.not.contain(like.like.toString());
              done();
            });
          });
        });
      });
    });
  });
});
