/**
 * Users
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

  describe(`API [Users] - ${db}`, function () {
    this.timeout(20000);
    this.slow(5000);

    let api;
    let users = {};

    before((done) => {
      this.timeout(20000);
      initialiser.setupApi(keyspace, config, (err, seguirApi) => {
        expect(err).to.be(null);
        api = seguirApi;
        done();
      });
    });

    describe('users', () => {
      it('can create users', (done) => {
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
          done(err);
        });
      });

      it('can retrieve a user by id', (done) => {
        api.user.getUser(keyspace, users['cliftonc'].user, (err, user) => {
          expect(err).to.be(null);
          expect(user.user).to.eql(users['cliftonc'].user);
          expect(user.username).to.be('cliftonc');
          done();
        });
      });

      it('can retrieve a user by name', (done) => {
        api.user.getUserByName(keyspace, users['cliftonc'].username, (err, user) => {
          expect(err).to.be(null);
          expect(user.user).to.eql(users['cliftonc'].user);
          expect(user.username).to.be(users['cliftonc'].username);
          done();
        });
      });

      it('can retrieve a user by alternate id', (done) => {
        api.user.getUserByAltId(keyspace, users['cliftonc'].altid, (err, user) => {
          expect(err).to.be(null);
          expect(user.user).to.eql(users['cliftonc'].user);
          expect(user.username).to.be(users['cliftonc'].username);
          done();
        });
      });

      it('can update a users data', (done) => {
        api.user.updateUser(keyspace, users['json'].user, 'new_name', 'new_altid', { hello: 'world' }, (err) => {
          expect(err).to.be(null);
          api.user.getUser(keyspace, users['json'].user, (err, user) => {
            expect(err).to.be(null);
            expect(user.user).to.eql(users['json'].user);
            expect(user.username).to.be('new_name');
            expect(user.altid).to.be('new_altid');
            expect(user.userdata.hello).to.be('world');
            done();
          });
        });
      });

      it('can update a users data and it clears any cache', (done) => {
        api.user.getUserByAltId(keyspace, users['cliftonc'].altid, (err) => {
          expect(err).to.be(null);
          api.user.updateUser(keyspace, users['cliftonc'].user, 'cliftonc', '1', { goodbye: 'world' }, (err) => {
            expect(err).to.be(null);
            api.user.getUserByAltId(keyspace, users['cliftonc'].altid, (err, user) => {
              expect(err).to.be(null);
              expect(user.user).to.eql(users['cliftonc'].user);
              expect(user.username).to.be('cliftonc');
              expect(user.userdata.goodbye).to.be('world');
              expect(user.userdata.hello).to.be(undefined);
              done();
            });
          });
        });
      });

      it('cant create a second user with the same altid', (done) => {
        api.user.addUser(keyspace, 'altido', '1', (err) => {
          expect(err.statusCode).to.be(409);
          done();
        });
      });

      it('can create a user with a non string altid and it will coerce to string', (done) => {
        api.user.addUser(keyspace, 'altido', 999, (err, newuser) => {
          expect(err).to.be(null);
          expect(newuser.altid).to.be('999');
          api.user.getUserByAltId(keyspace, 999, (err, user) => {
            expect(err).to.be(null);
            expect(user.altid).to.be('999');
            done();
          });
        });
      });

      it('can remove a user', (done) => { // test should put something in timeline and check that it is gone
        api.user.addUser(keyspace, 'shortLivedUser', 1234, (err, newuser) => {
          expect(err).to.be(null);
          expect(newuser.altid).to.be('1234');
          api.user.getUserByAltId(keyspace, 1234, (err, user) => {
            expect(err).to.be(null);
            expect(user.altid).to.be('1234');
            api.user.removeUser(keyspace, user.user, (err, status) => {
              expect(err).to.be(null);
              expect(status.status).to.be('removed');
              api.user.getUserByAltId(keyspace, 1234, (err) => {
                expect(err.statusCode).to.be(404);
                done();
              });
            });
          });
        });
      });
    });

    describe('initialising users and follows', () => {
      const actions = [
        { key: 'post-public', type: 'post', user: 'cliftonc', content: 'hello', contentType: 'text/html' },
        { key: 'like-google', type: 'like', user: 'cliftonc', item: 'http://www.google.com' },
      ];
      let actionResults = {};

      before((done) => {
        initialiser.setupGraph(keyspace, api, users, actions, (err, results) => {
          expect(err).to.be(null);
          actionResults = results;
          done();
        });
      });

      it('can optionally initialise a user with a follow relationship and automatically populate their feed', (done) => {
        const initialise = {
          follow: {
            users: [users['cliftonc'].username, users['phteven'].username],
            backfill: '1d',
            isprivate: false,
            ispersonal: true,
          },
        };

        api.user.addUser(keyspace, 'shaun', 'baah', {
          initialise,
          userdata: { type: 'sheep' },
        }, (err, user) => {
          expect(err).to.be(null);
          api.feed.getFeed(keyspace, user.user, user.user, (err, { feed }) => {
            expect(err).to.be(null);
            expect(feed[2].post).to.eql(actionResults['post-public'].post);
            done();
          });
        });
      });

      it('can optionally backfill a follow relationship and automatically populate their feed', (done) => {
        api.user.addUser(keyspace, 'bitzer', 'woof', { userdata: { type: 'dog' } }, (err, user) => {
          expect(err).to.be(null);
          api.follow.addFollower(keyspace, users['cliftonc'].user, user.user, api.client.getTimestamp(), api.visibility.PUBLIC, '1d', (err, follow) => {
            expect(err).to.be(null);
            api.feed.getFeed(keyspace, user.user, user.user, (err, { feed }) => {
              expect(err).to.be(null);
              expect(feed[0].follow).to.eql(follow.follow);
              expect(feed[1].post).to.eql(actionResults['post-public'].post);
              done();
            });
          });
        });
      });

      it('if I unfollow a user who I backfilled I no longer see their items in my feed', (done) => {
        api.follow.addFollower(keyspace, users['cliftonc'].user, users['json'].user, api.client.getTimestamp(), api.visibility.PUBLIC, '1d', (err, follow) => {
          expect(err).to.be(null);
          api.feed.getFeed(keyspace, users['json'].user, users['json'].user, (err, { feed }) => {
            expect(err).to.be(null);
            expect(feed[0].follow).to.eql(follow.follow);
            expect(feed[1].post).to.eql(actionResults['post-public'].post);
            api.follow.removeFollower(keyspace, users['cliftonc'].user, users['json'].user, (err) => {
              expect(err).to.be(null);
              api.feed.getFeed(keyspace, users['json'].user, users['json'].user, (err, { feed: feedItems }) => {
                expect(err).to.be(null);
                expect(feedItems.length).to.eql(0);
                done();
              });
            });
          });
        });
      });
    });
  });
});
