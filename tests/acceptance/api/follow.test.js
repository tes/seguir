/**
 * Follows
 */

/* eslint-env node, mocha */

var keyspace = 'test_seguir_app_api';
var expect = require('expect.js');
var initialiser = require('../../fixtures/initialiser');
var databases = process.env.DATABASE ? [process.env.DATABASE] : ['postgres', 'cassandra-redis'];
var _ = require('lodash');

databases.forEach(function (db) {
  var config = _.clone(require('../../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe('API [Follows] - ' + db, function () {
    this.timeout(20000);
    this.slow(5000);

    var api;
    var users = {};
    var followId;
    var privateFollowId;
    var personalFollowId;

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
          {username: 'json', altid: '8'},
          {username: 'aamir', altid: '9'}
        ], function (err, userMap) {
          expect(err).to.be(null);
          users = userMap;
          done();
        });
      });
    });

    describe('follows', function () {
      it('can follow a user', function (done) {
        api.follow.addFollower(keyspace, users['cliftonc'].user, users['phteven'].user, api.client.getTimestamp(), api.visibility.PUBLIC, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['phteven']);
          followId = follow.follow;
          // Slight delay to ensure we test that followers appear
          // in the correct order in later tests
          setTimeout(done, 100);
        });
      });

      it('can follow another user', function (done) {
        api.follow.addFollower(keyspace, users['cliftonc'].user, users['ted'].user, api.client.getTimestamp(), api.visibility.PUBLIC, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['ted']);
          done();
        });
      });

      it('can not follow yourself if you are aamir', function (done) {
        api.follow.addFollower(keyspace, users['aamir'].user, users['aamir'].user, api.client.getTimestamp(), api.visibility.PUBLIC, function (err, follow) {
          expect(err.statusCode).to.be(500);
          done();
        });
      });

      it('can not unfollow someone you dont follow', function (done) {
        api.follow.removeFollower(keyspace, users['aamir'].user, users['cliftonc'].user, function (err, result) {
          expect(err.statusCode).to.be(404);
          done();
        });
      });

      it('can not follow someone twice', function (done) {
        api.follow.addFollower(keyspace, users['aamir'].user, users['cliftonc'].user, api.client.getTimestamp(), api.visibility.PUBLIC, function (err, follow1) {
          expect(err).to.be(null);
          expect(follow1.user).to.eql(users['aamir']);
          expect(follow1.user_follower).to.eql(users['cliftonc']);
          api.follow.addFollower(keyspace, users['aamir'].user, users['cliftonc'].user, api.client.getTimestamp(), api.visibility.PUBLIC, function (err, follow2) {
            expect(err).to.be(null);
            expect(follow2.user).to.eql(users['aamir']);
            expect(follow2.user_follower).to.eql(users['cliftonc']);
            done();
          });
        });
      });

      it('can follow a user privately so only your friends can see', function (done) {
        api.follow.addFollower(keyspace, users['harold'].user, users['jenny'].user, api.client.getTimestamp(), api.visibility.PRIVATE, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['harold']);
          expect(follow.user_follower).to.eql(users['jenny']);
          expect(follow.visibility).to.be(api.visibility.PRIVATE);
          privateFollowId = follow.follow;
          done();
        });
      });

      it('can follow a user personally so only you can see', function (done) {
        api.follow.addFollower(keyspace, users['alfred'].user, users['jenny'].user, api.client.getTimestamp(), api.visibility.PERSONAL, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['alfred']);
          expect(follow.user_follower).to.eql(users['jenny']);
          expect(follow.visibility).to.be(api.visibility.PERSONAL);
          personalFollowId = follow.follow;
          done();
        });
      });

      it('can retrieve a follow by id', function (done) {
        api.follow.getFollow(keyspace, users['cliftonc'].user, followId, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['phteven']);
          done();
        });
      });

      it('can not see a private follow if not a friend ', function (done) {
        api.follow.getFollow(keyspace, users['cliftonc'].user, privateFollowId, function (err, follow) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('can not see a personal follow if not the user', function (done) {
        api.follow.getFollow(keyspace, users['cliftonc'].user, personalFollowId, function (err, follow) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('can retrieve a list of followers for a user and get it in the right order', function (done) {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.map(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds[0]).to.be(users['ted'].user.toString());
          expect(followerIds[1]).to.be(users['phteven'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user and paginate through it', function (done) {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, { pageSize: 1 }, function (err1, followers1, pageState1) {
          expect(err1).to.be(null);
          expect(followers1.length).to.be(1);
          expect(followers1[0].user_follower.user.toString()).to.be(users['ted'].user.toString());
          expect(pageState1).not.to.be(null);
          api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, { pageSize: 1, pageState: pageState1 }, function (err2, followers2, pageState2) {
            expect(err2).to.be(null);
            expect(followers2.length).to.be(1);
            expect(followers2[0].user_follower.user.toString()).to.be(users['phteven'].user.toString());
            if (pageState2) {
              // Cassandra specific: Cassandra returns a page state unless there are zero results
              api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, { pageSize: 1, pageState: pageState2 }, function (err3, followers3, pageState3) {
                expect(pageState3).to.be(null);
                done();
              });
            } else {
              done();
            }
          });
        });
      });

      it('will not blow up with evil pageState', function (done) {
        var options = { pageSize: 1, pageState: '0;DELETE FROM test_seguir_app_api.followers;' };
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, options, function (err2, followers2, pageState2) {
          expect(err2).not.to.be(null);
          done();
        });
      });

      it('can retrieve a list of followers for a user when not logged in', function (done) {
        api.follow.getFollowers(keyspace, null, users['cliftonc'].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.map(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.contain(users['phteven'].user.toString());
          expect(followerIds).to.contain(users['ted'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show personal if not the user', function (done) {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['alfred'].user, function (err, followers) {
          expect(err).to.be(null);
          expect(followers.length).to.be(0);
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show personal if one of the two users', function (done) {
        api.follow.getFollowers(keyspace, users['alfred'].user, users['alfred'].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.map(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.contain(users['jenny'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show private if one of the two users', function (done) {
        api.follow.getFollowers(keyspace, users['harold'].user, users['harold'].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.map(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.contain(users['jenny'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show private if not a friend', function (done) {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['harold'].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.map(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.not.contain(users['jenny'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show private if not logged in', function (done) {
        api.follow.getFollowers(keyspace, null, users['harold'].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.map(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.not.contain(users['jenny'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show private if a friend', function (done) {
        api.friend.addFriend(keyspace, users['cliftonc'].user, users['harold'].user, api.client.getTimestamp(), function (err, friend) {
          expect(err).to.be(null);
          api.follow.getFollowers(keyspace, users['cliftonc'].user, users['harold'].user, function (err, followers) {
            expect(err).to.be(null);
            var followerIds = _.map(_.map(followers, 'user_follower'), function (item) { return item.user.toString(); });
            expect(followerIds).to.contain(users['jenny'].user.toString());
            done();
          });
        });
      });

      it('can remove a follow', function (done) {
        api.follow.addFollower(keyspace, users['bill'].user, users['harold'].user, api.client.getTimestamp(), api.visibility.PUBLIC, function (err, follow) {
          expect(err).to.be(null);
          api.follow.removeFollower(keyspace, users['bill'].user, users['harold'].user, function (err, result) {
            expect(err).to.be(null);
            expect(result.status).to.be('removed');
            api.feed.getRawFeed(keyspace, users['bill'].user, users['bill'].user, function (err, feed) {
              expect(err).to.be(null);
              var followerIds = _.map(_.map(feed, 'item'), function (item) { return item.toString(); });
              expect(followerIds).to.not.contain(follow.follow.toString());
              done();
            });
          });
        });
      });

      it('can see new follows of people you follow in your feed', function (done) {
        api.follow.addFollower(keyspace, users['jenny'].user, users['cliftonc'].user, api.client.getTimestamp(), api.visibility.PUBLIC, function (err, follow) {
          expect(err).to.be(null);
          api.feed.getRawFeed(keyspace, users['ted'].user, users['ted'].user, function (err, feed) {
            expect(err).to.be(null);
            var followerIds = _.map(_.map(feed, 'item'), function (item) { return item.toString(); });
            expect(followerIds).to.contain(follow.follow.toString());
            done();
          });
        });
      });

      it('can not see when others follow people you follow in your feed, it only appears in their feed', function (done) {
        api.follow.addFollower(keyspace, users['cliftonc'].user, users['jenny'].user, api.client.getTimestamp(), api.visibility.PUBLIC, function (err, follow) {
          expect(err).to.be(null);
          api.feed.getRawFeed(keyspace, users['ted'].user, users['ted'].user, function (err, feed) {
            expect(err).to.be(null);
            var followerIds = _.map(_.map(feed, 'item'), function (item) { return item.toString(); });
            expect(followerIds).to.not.contain(follow.follow.toString());
            done();
          });
        });
      });

      it('can see the status of your relationship with another users followers', function (done) {
        api.follow.addFollower(keyspace, users['jenny'].user, users['phteven'].user, api.client.getTimestamp(), api.visibility.PUBLIC, function (err, follow) {
          expect(err).to.be(null);
          api.follow.getFollowers(keyspace, users['phteven'].user, users['cliftonc'].user, function (err, followers) {
            expect(err).to.be(null);
            expect(followers[0].liuIsFollowing).to.be(true);
            expect(followers[0].followerCount).to.be(2);
            expect(followers[1].liuIsFollowing).to.be(false);
            expect(followers[1].followerCount).to.be(0);
            expect(followers[2].liuIsFollowing).to.be(true);
            expect(followers[2].liuIsUser).to.be(true);
            expect(followers[2].followerCount).to.be(0);
            done();
          });
        });
      });

      it('can see the followerCounts for non-logged in users', function (done) {
        api.follow.getFollowers(keyspace, null, users['cliftonc'].user, function (err, followers) {
          expect(err).to.be(null);
          expect(followers[0].followerCount).to.be(2);
          expect(followers[1].followerCount).to.be(0);
          expect(followers[2].followerCount).to.be(0);
          done();
        });
      });
    });
  });
});
