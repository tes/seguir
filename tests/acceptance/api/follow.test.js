/**
 * Follows
 */

/* eslint-env node, mocha */

const async = require('async');
const keyspace = 'test_seguir_app_api';
const expect = require('expect.js');
const initialiser = require('../../fixtures/initialiser');
const databases = process.env.DATABASE ? [process.env.DATABASE] : ['cassandra-redis'];
const _ = require('lodash');

databases.forEach((db) => {
  const config = _.clone(require(`../../fixtures/${db}.json`));
  config.keyspace = keyspace;

  describe(`API [Follows] - ${db}`, function () {
    this.timeout(20000);
    this.slow(5000);

    let api;
    let users = {};
    let followId;
    let privateFollowId;
    let personalFollowId;

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
          { username: 'aamir', altid: '9' },
          { username: 'paul', altid: '10' },
        ], (err, userMap) => {
          expect(err).to.be(null);
          users = userMap;

          const actions = [
            { type: 'follow', user: 'json', user_follower: 'aamir' },
            { type: 'follow', user: 'bill', user_follower: 'aamir' },
            { type: 'follow', user: 'bill', user_follower: 'paul', visibility: api.visibility.PERSONAL },
            { type: 'follow', user: 'json', user_follower: 'paul', visibility: api.visibility.PRIVATE },
          ];
          initialiser.setupGraph(keyspace, api, users, actions, (err) => {
            expect(err).to.be(null);
            done();
          });
        });
      });
    });

    describe('follows', () => {
      it('can follow a user', (done) => {
        api.follow.addFollower(keyspace, users['cliftonc'].user, users['phteven'].user, api.client.getTimestamp(), api.visibility.PUBLIC, (err, follow) => {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['phteven']);
          followId = follow.follow;
          // Slight delay to ensure we test that followers appear
          // in the correct order in later tests
          setTimeout(done, 100);
        });
      });

      it('can follow another user', (done) => {
        api.follow.addFollower(keyspace, users['cliftonc'].user, users['ted'].user, api.client.getTimestamp(), api.visibility.PUBLIC, (err, follow) => {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['ted']);
          done();
        });
      });

      it('can not follow yourself if you are aamir', (done) => {
        api.follow.addFollower(keyspace, users['aamir'].user, users['aamir'].user, api.client.getTimestamp(), api.visibility.PUBLIC, (err) => {
          expect(err.statusCode).to.be(500);
          done();
        });
      });

      it('can not unfollow someone you dont follow', (done) => {
        api.follow.removeFollower(keyspace, users['aamir'].user, users['cliftonc'].user, (err) => {
          expect(err.statusCode).to.be(404);
          done();
        });
      });

      it('can not follow someone twice', (done) => {
        api.follow.addFollower(keyspace, users['aamir'].user, users['cliftonc'].user, api.client.getTimestamp(), api.visibility.PUBLIC, (err, follow1) => {
          expect(err).to.be(null);
          expect(follow1.user).to.eql(users['aamir']);
          expect(follow1.user_follower).to.eql(users['cliftonc']);
          api.follow.addFollower(keyspace, users['aamir'].user, users['cliftonc'].user, api.client.getTimestamp(), api.visibility.PUBLIC, (err, follow2) => {
            expect(err).to.be(null);
            expect(follow2.user).to.eql(users['aamir']);
            expect(follow2.user_follower).to.eql(users['cliftonc']);
            done();
          });
        });
      });

      it('can follow a user privately so only your friends can see', (done) => {
        api.follow.addFollower(keyspace, users['harold'].user, users['jenny'].user, api.client.getTimestamp(), api.visibility.PRIVATE, (err, follow) => {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['harold']);
          expect(follow.user_follower).to.eql(users['jenny']);
          expect(follow.visibility).to.be(api.visibility.PRIVATE);
          privateFollowId = follow.follow;
          done();
        });
      });

      it('can follow a user personally so only you can see', (done) => {
        api.follow.addFollower(keyspace, users['alfred'].user, users['jenny'].user, api.client.getTimestamp(), api.visibility.PERSONAL, (err, follow) => {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['alfred']);
          expect(follow.user_follower).to.eql(users['jenny']);
          expect(follow.visibility).to.be(api.visibility.PERSONAL);
          personalFollowId = follow.follow;
          done();
        });
      });

      it('can retrieve a follow by id', (done) => {
        api.follow.getFollow(keyspace, users['cliftonc'].user, followId, (err, follow) => {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['phteven']);
          done();
        });
      });

      it('can not see a private follow if not a friend ', (done) => {
        api.follow.getFollow(keyspace, users['cliftonc'].user, privateFollowId, (err) => {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('can not see a personal follow if not the user', (done) => {
        api.follow.getFollow(keyspace, users['cliftonc'].user, personalFollowId, (err) => {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('can retrieve a list of followers for a user and get it in the right order', (done) => {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, (err, followers) => {
          expect(err).to.be(null);
          const followerIds = _.map(_.map(followers, 'user_follower'), (item) => item.user.toString());
          expect(followerIds[0]).to.be(users['ted'].user.toString());
          expect(followerIds[1]).to.be(users['phteven'].user.toString());
          done();
        });
      });

      it('can retrieve a list of following for a user and get it in the right order', (done) => {
        api.follow.getFollowing(keyspace, users['aamir'].user, users['aamir'].user, (err, following) => {
          expect(err).to.be(null);
          const followingIds = _.map(_.map(following, 'user'), (item) => item.user.toString());
          expect(followingIds[0]).to.be(users['bill'].user.toString());
          expect(followingIds[1]).to.be(users['json'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user and paginate through it', (done) => {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, { pageSize: 1 }, (err1, followers1, pageState1) => {
          expect(err1).to.be(null);
          expect(followers1.length).to.be(1);
          expect(followers1[0].user_follower.user.toString()).to.be(users['ted'].user.toString());
          expect(pageState1).not.to.be(null);
          api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, { pageSize: 1, pageState: pageState1 }, (err2, followers2, pageState2) => {
            expect(err2).to.be(null);
            expect(followers2.length).to.be(1);
            expect(followers2[0].user_follower.user.toString()).to.be(users['phteven'].user.toString());
            if (pageState2) {
              // Cassandra specific: Cassandra returns a page state unless there are zero results
              api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, { pageSize: 1, pageState: pageState2 }, (err3, followers3, pageState3) => {
                expect(pageState3).to.be(null);
                done();
              });
            } else {
              done();
            }
          });
        });
      });

      it('can retrieve a list of following for a user and paginate through it', (done) => {
        api.follow.getFollowing(keyspace, users['aamir'].user, users['aamir'].user, { pageSize: 1 }, (err1, following1, pageState1) => {
          expect(err1).to.be(null);
          expect(following1.length).to.be(1);
          expect(following1[0].user.username.toString()).to.be(users['bill'].username.toString());
          expect(pageState1).not.to.be(null);
          api.follow.getFollowing(keyspace, users['aamir'].user, users['aamir'].user, {
            pageSize: 2,
            pageState: pageState1,
          }, (err2, following2, pageState2) => {
            expect(err2).to.be(null);
            expect(following2.length).to.be(1);
            expect(following2[0].user.username.toString()).to.be(users['json'].username.toString());
            expect(pageState2).to.be(null);
            done();
          });
        });
      });

      it('will not blow up with evil pageState when getting list of followers', (done) => {
        const options = { pageSize: 1, pageState: '0;DELETE FROM test_seguir_app_api.followers;' };
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, options, (err2) => {
          expect(err2).not.to.be(null);
          done();
        });
      });

      it('will not blow up with evil pageState when getting list of following', (done) => {
        const options = { pageSize: 1, pageState: '0;DELETE FROM test_seguir_app_api.followers;' };
        api.follow.getFollowing(keyspace, users['ted'].user, users['ted'].user, options, (err2) => {
          expect(err2).not.to.be(null);
          done();
        });
      });

      it('can retrieve a list of followers for a user when not logged in', (done) => {
        api.follow.getFollowers(keyspace, null, users['cliftonc'].user, (err, followers) => {
          expect(err).to.be(null);
          const followerIds = _.map(_.map(followers, 'user_follower'), (item) => item.user.toString());
          expect(followerIds).to.contain(users['phteven'].user.toString());
          expect(followerIds).to.contain(users['ted'].user.toString());
          done();
        });
      });

      it('can retrieve a list of following for a user when not logged in', (done) => {
        api.follow.getFollowing(keyspace, null, users['aamir'].user, (err, following) => {
          expect(err).to.be(null);
          const followingIds = _.map(_.map(following, 'user'), (item) => item.user.toString());
          expect(followingIds).to.contain(users['json'].user.toString());
          expect(followingIds).to.contain(users['bill'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show personal if not the user', (done) => {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['alfred'].user, (err, followers) => {
          expect(err).to.be(null);
          expect(followers.length).to.be(0);
          done();
        });
      });

      it('can retrieve a list of following for a user but will not show personal if not the user', (done) => {
        api.follow.getFollowing(keyspace, users['cliftonc'].user, users['paul'].user, (err, following) => {
          expect(err).to.be(null);
          const followingIds = _.map(_.map(following, 'user'), (item) => item.user.toString());
          expect(followingIds).to.not.contain(users['bill'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show personal if one of the two users', (done) => {
        api.follow.getFollowers(keyspace, users['alfred'].user, users['alfred'].user, (err, followers) => {
          expect(err).to.be(null);
          const followerIds = _.map(_.map(followers, 'user_follower'), (item) => item.user.toString());
          expect(followerIds).to.contain(users['jenny'].user.toString());
          done();
        });
      });

      it('can retrieve a list of following for a user but will show personal if one of the two users', (done) => {
        api.follow.getFollowing(keyspace, users['paul'].user, users['paul'].user, (err, following) => {
          expect(err).to.be(null);
          const followingIds = _.map(_.map(following, 'user'), (item) => item.user.toString());
          expect(followingIds).to.contain(users['bill'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show private if one of the two users', (done) => {
        api.follow.getFollowers(keyspace, users['harold'].user, users['harold'].user, (err, followers) => {
          expect(err).to.be(null);
          const followerIds = _.map(_.map(followers, 'user_follower'), (item) => item.user.toString());
          expect(followerIds).to.contain(users['jenny'].user.toString());
          done();
        });
      });

      it('can retrieve a list of following for a user but will show private if one of the two users', (done) => {
        api.follow.getFollowing(keyspace, users['paul'].user, users['paul'].user, (err, following) => {
          expect(err).to.be(null);
          const followingIds = _.map(_.map(following, 'user'), (item) => item.user.toString());
          expect(followingIds).to.contain(users['json'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show private if not a friend', (done) => {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['harold'].user, (err, followers) => {
          expect(err).to.be(null);
          const followerIds = _.map(_.map(followers, 'user_follower'), (item) => item.user.toString());
          expect(followerIds).to.not.contain(users['jenny'].user.toString());
          done();
        });
      });

      it('can retrieve a list of following for a user but will not show private if not a friend', (done) => {
        api.follow.getFollowing(keyspace, users['cliftonc'].user, users['paul'].user, (err, following) => {
          expect(err).to.be(null);
          const followingIds = _.map(_.map(following, 'user'), (item) => item.user.toString());
          expect(followingIds).to.not.contain(users['json'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show private if not logged in', (done) => {
        api.follow.getFollowers(keyspace, null, users['harold'].user, (err, followers) => {
          expect(err).to.be(null);
          const followerIds = _.map(_.map(followers, 'user_follower'), (item) => item.user.toString());
          expect(followerIds).to.not.contain(users['jenny'].user.toString());
          done();
        });
      });

      it('can retrieve a list of following for a user but will not show private if not logged in', (done) => {
        api.follow.getFollowing(keyspace, null, users['paul'].user, (err, following) => {
          expect(err).to.be(null);
          const followingIds = _.map(_.map(following, 'user'), (item) => item.user.toString());
          expect(followingIds).to.not.contain(users['json'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show private if a friend', (done) => {
        api.friend.addFriend(keyspace, users['cliftonc'].user, users['harold'].user, api.client.getTimestamp(), (err) => {
          expect(err).to.be(null);
          api.follow.getFollowers(keyspace, users['cliftonc'].user, users['harold'].user, (err, followers) => {
            expect(err).to.be(null);
            const followerIds = _.map(_.map(followers, 'user_follower'), (item) => item.user.toString());
            expect(followerIds).to.contain(users['jenny'].user.toString());
            done();
          });
        });
      });

      it('can retrieve a list of following for a user but will show private if a friend', (done) => {
        api.friend.addFriend(keyspace, users['cliftonc'].user, users['jenny'].user, api.client.getTimestamp(), (err) => {
          expect(err).to.be(null);
          api.follow.getFollowing(keyspace, users['cliftonc'].user, users['jenny'].user, (err, following) => {
            expect(err).to.be(null);
            const followingIds = _.map(_.map(following, 'user'), (item) => item.user.toString());
            expect(followingIds).to.contain(users['harold'].user.toString());
            done();
          });
        });
      });

      it('can remove a follow', (done) => {
        api.follow.addFollower(keyspace, users['bill'].user, users['harold'].user, api.client.getTimestamp(), api.visibility.PUBLIC, (err, follow) => {
          expect(err).to.be(null);
          api.follow.removeFollower(keyspace, users['bill'].user, users['harold'].user, (err, result) => {
            expect(err).to.be(null);
            expect(result.status).to.be('removed');
            api.feed.getRawFeed(keyspace, users['bill'].user, users['bill'].user, (err, feed) => {
              expect(err).to.be(null);
              const followerIds = _.map(_.map(feed, 'item'), (item) => item.toString());
              expect(followerIds).to.not.contain(follow.follow.toString());
              done();
            });

            api.follow.getFollowing(keyspace, users['harold'].user, users['harold'].user, (err, following) => {
              expect(err).to.be(null);
              const followingIds = _.map(_.map(following, 'user'), (item) => item.user.toString());
              expect(followingIds).to.not.contain(users['bill'].user.toString());
            });
          });
        });
      });

      it('can see new follows of people you follow in your feed', (done) => {
        api.follow.addFollower(keyspace, users['jenny'].user, users['cliftonc'].user, api.client.getTimestamp(), api.visibility.PUBLIC, (err, follow) => {
          expect(err).to.be(null);
          api.feed.getRawFeed(keyspace, users['ted'].user, users['ted'].user, (err, feed) => {
            expect(err).to.be(null);
            const followerIds = _.map(_.map(feed, 'item'), (item) => item.toString());
            expect(followerIds).to.contain(follow.follow.toString());
            done();
          });
        });
      });

      it('can not see when others follow people you follow in your feed, it only appears in their feed', (done) => {
        api.follow.addFollower(keyspace, users['cliftonc'].user, users['jenny'].user, api.client.getTimestamp(), api.visibility.PUBLIC, (err, follow) => {
          expect(err).to.be(null);
          api.feed.getRawFeed(keyspace, users['ted'].user, users['ted'].user, (err, feed) => {
            expect(err).to.be(null);
            const followerIds = _.map(_.map(feed, 'item'), (item) => item.toString());
            expect(followerIds).to.not.contain(follow.follow.toString());
            done();
          });
        });
      });

      it('can see the status of your relationship with another users followers', (done) => {
        api.follow.addFollower(keyspace, users['jenny'].user, users['phteven'].user, api.client.getTimestamp(), api.visibility.PUBLIC, (err) => {
          expect(err).to.be(null);
          api.follow.getFollowers(keyspace, users['phteven'].user, users['cliftonc'].user, (err, followers) => {
            expect(err).to.be(null);
            expect(followers[0].liuIsFollowing).to.be(true);
            expect(followers[0].liuIsUser).to.be(false);
            expect(followers[0].followerCount).to.be(2);
            expect(followers[0].followingCount).to.be(3);
            expect(followers[1].liuIsFollowing).to.be(false);
            expect(followers[1].liuIsUser).to.be(false);
            expect(followers[1].followerCount).to.be(0);
            expect(followers[1].followingCount).to.be(1);
            expect(followers[2].liuIsFollowing).to.be(true);
            expect(followers[2].liuIsUser).to.be(true);
            expect(followers[2].followerCount).to.be(0);
            expect(followers[2].followingCount).to.be(2);
            done();
          });
        });
      });

      it('can see the follower and following Counts for non-logged in followers', (done) => {
        api.follow.getFollowers(keyspace, null, users['cliftonc'].user, (err, followers) => {
          expect(err).to.be(null);
          expect(followers[0].followerCount).to.be(2);
          expect(followers[0].followingCount).to.be(3);
          expect(followers[1].followerCount).to.be(0);
          expect(followers[1].followingCount).to.be(1);
          expect(followers[2].followerCount).to.be(0);
          expect(followers[2].followingCount).to.be(2);
          done();
        });
      });

      it('can see the follower and following Counts for non-logged in following', (done) => {
        api.follow.getFollowing(keyspace, null, users['cliftonc'].user, (err, following) => {
          expect(err).to.be(null);
          expect(following[0].followerCount).to.be(2);
          expect(following[0].followingCount).to.be(3);
          expect(following[1].followerCount).to.be(1);
          expect(following[1].followingCount).to.be(2);
          done();
        });
      });

      describe('removing all', () => {
        let removeAllUsers = {};
        let dennis;

        before(function (done) {
          this.timeout(30000);

          const allUsers = [{ username: 'dennis', altid: '20' }];
          for (let i = 0; i < 175; i++) {
            allUsers.push({ username: `user${i}`, altid: `${i * 100}` });
          }

          initialiser.setupUsers(keyspace, api, allUsers, (err, userMap) => {
            expect(err).to.be(null);
            removeAllUsers = userMap;
            dennis = userMap['dennis'].user;

            const getVisibility = (index) => [api.visibility.PUBLIC, api.visibility.PRIVATE, api.visibility.PERSONAL][index % 3];

            const actions = [];
            let j = 0;
            _.map(Object.keys(removeAllUsers), (user) => {
              const username = removeAllUsers[user].username;
              if (username !== 'dennis') {
                actions.push({ type: 'follow', user: 'dennis', user_follower: username, visibility: getVisibility(j++) });
                actions.push({ type: 'follow', user: username, user_follower: 'dennis', visibility: getVisibility(j++) });
              }
            });

            initialiser.setupGraph(keyspace, api, removeAllUsers, actions, (err) => {
              expect(err).to.be(null);
              done();
            });
          });
        });

        it('can remove all followers and following (of all visibilities) for a user', (done) => {
          async.parallel({
            followerCount: async.apply(api.follow.followerCount, keyspace, dennis),
            followingCount: async.apply(api.follow.followingCount, keyspace, dennis),
          }, (err, follows) => {
            expect(err).to.be(null);
            expect(follows.followerCount.count.toString()).to.be('175');
            expect(follows.followingCount.count.toString()).to.be('175');

            api.follow.removeAllFollowersByUser(keyspace, dennis, (err) => {
              expect(err).to.be(null);

              async.parallel({
                followerCount: async.apply(api.follow.followerCount, keyspace, dennis),
                followingCount: async.apply(api.follow.followingCount, keyspace, dennis),
              }, (err, followCounts) => {
                expect(err).to.be(null);
                expect(followCounts.followerCount.count.toString()).to.be('0');
                expect(followCounts.followingCount.count.toString()).to.be('175');

                api.follow.removeAllFollowingByUser(keyspace, dennis, (err) => {
                  expect(err).to.be(null);

                  async.parallel({
                    followerCount: async.apply(api.follow.followerCount, keyspace, dennis),
                    followingCount: async.apply(api.follow.followingCount, keyspace, dennis),
                  }, (err, result) => {
                    expect(err).to.be(null);
                    expect(result.followerCount.count.toString()).to.be('0');
                    expect(result.followingCount.count.toString()).to.be('0');

                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
