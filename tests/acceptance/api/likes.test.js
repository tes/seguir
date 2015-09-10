/**
 * Likes
 */

/*eslint-env node, mocha */

var keyspace = 'test_seguir_app_api';
var expect = require('expect.js');
var initialiser = require('../../fixtures/initialiser');
var databases = process.env.DATABASE ? [process.env.DATABASE] : ['postgres', 'cassandra-redis'];
var _ = require('lodash');

databases.forEach(function (db) {

  var config = _.clone(require('../../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe('API [Likes] - ' + db, function () {

    this.timeout(10000);
    this.slow(5000);

    var api, users = {}, likeId;

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

    describe('likes', function () {

      it('can like an item from a user', function (done) {
        api.like.addLike(keyspace, users['cliftonc'].user, 'http://github.com', api.client.getTimestamp(), function (err, like) {
          expect(err).to.be(null);
          expect(like.item).to.be('http://github.com');
          likeId = like.like;
          done();
        });
      });

      it('can retrieve a like by id', function (done) {
        api.like.getLike(keyspace, likeId, function (err, like) {
          expect(err).to.be(null);
          expect(like.item).to.be('http://github.com');
          expect(like.user).to.eql(users['cliftonc']);
          done();
        });
      });

      it('can check if a user likes an item', function (done) {
        api.like.checkLike(keyspace, users['cliftonc'].user, 'http://github.com', function (err, like) {
          expect(err).to.be(null);
          expect(like.like).to.eql(likeId);
          expect(like.user).to.eql(users['cliftonc']);
          expect(like.count).to.eql(1);
          done();
        });
      });

      it('can check if a user likes an item if they dont like it', function (done) {
        api.like.checkLike(keyspace, users['jenny'].user, 'http://github.com', function (err, like) {
          expect(err).to.be(null);
          expect(like.like).to.be(undefined);
          expect(like.user).to.eql(users['jenny']);
          expect(like.count).to.eql(1);
          done();
        });
      });

      it('can check if a user likes an item that has never been liked', function (done) {
        api.like.checkLike(keyspace, users['jenny'].user, 'http://google.com', function (err, like) {
          expect(err).to.be(null);
          expect(like.like).to.be(undefined);
          expect(like.user).to.eql(users['jenny']);
          expect(like.count).to.eql(0);
          done();
        });
      });

      it('can add and remove a like', function (done) {
        api.like.addLike(keyspace, users['jenny'].user, 'http://seguir.calip.so', api.client.getTimestamp(), function (err, like) {
          expect(err).to.be(null);
          api.like.removeLike(keyspace, users['jenny'].user, 'http://seguir.calip.so', function (err, result) {
            expect(err).to.be(null);
            api.feed.getRawFeed(keyspace, users['jenny'].user, users['jenny'].user, function (err, feed) {
              expect(err).to.be(null);
              var ids = _.map(_.pluck(feed, 'item'), function (item) { return item.toString(); });
              expect(ids).to.not.contain(like.like.toString());
              done();
            });
          });
        });
      });

    });

  });

});

