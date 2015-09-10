/**
 * Friends and Friend Requests
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

  describe('API [Friends] - ' + db, function () {

    this.timeout(10000);
    this.slow(5000);

    var api, users = {}, liu, friendId, otherFriendId, friendRequestId;

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
          liu = users['cliftonc'].user;
          done();
        });
      });
    });

    describe('friend requests', function () {

      it('can create a friend request', function (done) {
        api.friend.addFriendRequest(keyspace, users['cliftonc'].user, users['phteven'].user, 'Please be my friend', api.client.getTimestamp(), function (err, friend_request) {
          expect(err).to.be(null);
          expect(friend_request.user).to.eql(users['cliftonc'].user);
          expect(friend_request.user_friend).to.eql(users['phteven'].user);
          friendRequestId = friend_request.friend_request;
          done();
        });
      });

      it('can see status of outbound friend requests', function (done) {
        api.friend.getOutgoingFriendRequests(keyspace, users['cliftonc'].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can see status of incoming friend requests', function (done) {
        api.friend.getIncomingFriendRequests(keyspace, users['phteven'].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can see status of all friend requests for incoming', function (done) {
        api.friend.getFriendRequests(keyspace, users['phteven'].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests.incoming[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests.incoming[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can see status of all friend requests for outgoing', function (done) {
        api.friend.getFriendRequests(keyspace, users['cliftonc'].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests.outgoing[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests.outgoing[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can accept a friend request and create a reciprocal friendship', function (done) {
        api.friend.acceptFriendRequest(keyspace, users['phteven'].user, friendRequestId, function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['cliftonc']);
          expect(friend.user_friend).to.eql(users['phteven']);
          friendId = friend.friend;
          done();
        });
      });

      it('it deletes the friend request after it is accepted', function (done) {
        api.friend.getFriendRequest(keyspace, users['phteven'].user, friendRequestId, function (err, friend_request) {
          expect(err).to.not.be(null);
          expect(friend_request).to.eql(undefined);
          done();
        });
      });

    });

    describe('friends', function () {

      it('can friend another user', function (done) {
        api.friend.addFriend(keyspace, users['ted'].user, users['bill'].user, api.client.getTimestamp(), function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['ted']);
          expect(friend.user_friend).to.eql(users['bill']);
          otherFriendId = friend.friend;
          done();
        });
      });

      it('can retrieve a friend by id', function (done) {
        api.friend.getFriend(keyspace, liu, friendId, function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['cliftonc']);
          expect(friend.user_friend).to.eql(users['phteven']);
          done();
        });
      });

      it('can not retrieve details of a friendship for someone that you are not friends with', function (done) {
        api.friend.getFriend(keyspace, users['cliftonc'].user, otherFriendId, function (err, friend) {
          expect(err.message).to.be('You are not allowed to see this item.');
          done();
        });
      });

      it('can retrieve a list of friends for a user', function (done) {
        api.friend.getFriends(keyspace, liu, users['cliftonc'].user, function (err, friends) {
          expect(err).to.be(null);
          expect(friends[0].user_friend).to.eql(users['phteven']);
          done();
        });
      });

      it('can not retrieve a list of friends for someone that you are not friends with', function (done) {
        api.friend.getFriends(keyspace, users['cliftonc'].user, users['ted'].user, function (err, friend) {
          expect(err.message).to.be('You are not allowed to see this item.');
          done();
        });
      });

      it('can add and remove a friend', function (done) {
        api.friend.addFriend(keyspace, users['cliftonc'].user, users['harold'].user, api.client.getTimestamp(), function (err, friend) {
          expect(err).to.be(null);
          api.friend.removeFriend(keyspace, users['cliftonc'].user, users['harold'].user, function (err, result) {
            expect(err).to.be(null);
            expect(result.status).to.be('removed');
            api.feed.getRawFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, function (err, feed) {
              expect(err).to.be(null);
              expect(_.pluck(feed, 'item')).to.not.contain(friend.friend);
              done();
            });
          });
        });
      });

    });

  });

});

