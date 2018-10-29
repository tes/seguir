/**
 * Friends and Friend Requests
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

  describe('API [Friends] - ' + db, function () {
    this.timeout(20000);
    this.slow(5000);

    let api;
    let users = {};
    let liu;
    let friendId;
    let otherFriendId;
    let friendRequestId;

    before(function (done) {
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
          liu = users['cliftonc'].user;
          done();
        });
      });
    });

    describe('friend requests', () => {
      it('can create a friend request', (done) => {
        api.friend.addFriendRequest(keyspace, users['cliftonc'].user, users['phteven'].user, 'Please be my friend', api.client.getTimestamp(), (err, friend_request) => {
          expect(err).to.be(null);
          expect(friend_request.user).to.eql(users['cliftonc'].user);
          expect(friend_request.user_friend).to.eql(users['phteven'].user);
          friendRequestId = friend_request.friend_request;
          done();
        });
      });

      it('can see status of outbound friend requests', (done) => {
        api.friend.getOutgoingFriendRequests(keyspace, users['cliftonc'].user, (err, friend_requests) => {
          expect(err).to.be(null);
          expect(friend_requests[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can see status of incoming friend requests', (done) => {
        api.friend.getIncomingFriendRequests(keyspace, users['phteven'].user, (err, friend_requests) => {
          expect(err).to.be(null);
          expect(friend_requests[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can see status of all friend requests for incoming', (done) => {
        api.friend.getFriendRequests(keyspace, users['phteven'].user, (err, friend_requests) => {
          expect(err).to.be(null);
          expect(friend_requests.incoming[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests.incoming[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can see status of all friend requests for outgoing', (done) => {
        api.friend.getFriendRequests(keyspace, users['cliftonc'].user, (err, friend_requests) => {
          expect(err).to.be(null);
          expect(friend_requests.outgoing[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests.outgoing[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can accept a friend request and create a reciprocal friendship', (done) => {
        api.friend.acceptFriendRequest(keyspace, users['phteven'].user, friendRequestId, (err, friend) => {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['cliftonc']);
          expect(friend.user_friend).to.eql(users['phteven']);
          friendId = friend.friend;
          done();
        });
      });

      it('it deletes the friend request after it is accepted', (done) => {
        api.friend.getFriendRequest(keyspace, users['phteven'].user, friendRequestId, (err, friend_request) => {
          expect(err).to.not.be(null);
          expect(friend_request).to.eql(undefined);
          done();
        });
      });
    });

    describe('friends', () => {
      it('can friend another user', (done) => {
        api.friend.addFriend(keyspace, users['ted'].user, users['bill'].user, api.client.getTimestamp(), (err, friend) => {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['ted']);
          expect(friend.user_friend).to.eql(users['bill']);
          otherFriendId = friend.friend;
          done();
        });
      });

      it('can retrieve a friend by id', (done) => {
        api.friend.getFriend(keyspace, liu, friendId, (err, friend) => {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['cliftonc']);
          expect(friend.user_friend).to.eql(users['phteven']);
          done();
        });
      });

      it('can not retrieve details of a friendship for someone that you are not friends with', (done) => {
        api.friend.getFriend(keyspace, users['cliftonc'].user, otherFriendId, (err, friend) => {
          expect(err.message).to.be('You are not allowed to see this item.');
          done();
        });
      });

      it('can retrieve a list of friends for a user', (done) => {
        api.friend.getFriends(keyspace, liu, users['cliftonc'].user, (err, friends) => {
          expect(err).to.be(null);
          expect(friends[0].user_friend).to.eql(users['phteven']);
          done();
        });
      });

      it('can not retrieve a list of friends for someone that you are not friends with', (done) => {
        api.friend.getFriends(keyspace, users['cliftonc'].user, users['ted'].user, (err, friend) => {
          expect(err.message).to.be('You are not allowed to see this item.');
          done();
        });
      });

      it('can add and remove a friend', (done) => {
        api.friend.addFriend(keyspace, users['cliftonc'].user, users['harold'].user, api.client.getTimestamp(), (err, friend) => {
          expect(err).to.be(null);
          api.friend.removeFriend(keyspace, users['cliftonc'].user, users['harold'].user, (err, result) => {
            expect(err).to.be(null);
            expect(result.status).to.be('removed');
            api.feed.getRawFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, (err, feed) => {
              expect(err).to.be(null);
              expect(_.map(feed, 'item')).to.not.contain(friend.friend);
              done();
            });
          });
        });
      });

      describe('removing all', () => {
        let removeAllUsers = {};
        let dennis;

        before(function (done) {
          this.timeout(20000);

          const allUsers = [{username: 'dennis', altid: '20'}];
          for (let i = 0; i < 175; i++) {
            allUsers.push({username: 'user' + i, altid: '' + i * 100});
          }

          initialiser.setupUsers(keyspace, api, allUsers, (err, userMap) => {
            expect(err).to.be(null);
            removeAllUsers = userMap;
            dennis = userMap['dennis'].user;

            const actions = [];
            _.map(Object.keys(removeAllUsers), (user) => {
              const username = removeAllUsers[user].username;
              if (username !== 'dennis') {
                actions.push({ type: 'friend', user: 'dennis', user_friend: username });
              }
            });

            initialiser.setupGraph(keyspace, api, removeAllUsers, actions, (err) => {
              expect(err).to.be(null);
              done();
            });
          });
        });

        it('can remove all friends and friend requests for a user', (done) => {
          api.friend.getFriends(keyspace, dennis, dennis, (err, result) => {
            expect(err).to.be(null);
            expect(result.length).to.be(175);

            api.friend.removeAllFriendsByUser(keyspace, dennis, (err) => {
              expect(err).to.be(null);

              api.friend.getFriends(keyspace, dennis, dennis, (err, result) => {
                expect(err).to.be(null);
                expect(result.length).to.be(0);

                done();
              });
            });
          });
        });
      });
    });
  });
});
