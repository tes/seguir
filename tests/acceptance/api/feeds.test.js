/**
 * Acceptance test of the feeds API
 * Please see the fixtures/initialiser for two key methods that help this test be readable
 * and maintainable:
 *
 * - setupGraph = run a series of actions against the other apis to generate a feed.
 * - assertFeed = check that the feed you get is what you expect it to be.
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

  describe(`API [Feeds] - ${db}`, function () {
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
          { username: 'backfill', altid: '9' },
          { username: 'backfill-follower', altid: '10' },
        ], (err, userMap) => {
          expect(err).to.be(null);
          users = userMap;
          done();
        });
      });
    });

    describe('feeds', () => {
      let actionResults = {};

      before((done) => {
        const actions = [
          { key: 'follow-1', type: 'follow', user: 'cliftonc', user_follower: 'phteven' },
          { key: 'follow-2', type: 'follow', user: 'cliftonc', user_follower: 'ted' },
          { key: 'follow-3', type: 'follow', user: 'bill', user_follower: 'alfred' },
          {
            key: 'follow-private',
            type: 'follow',
            user: 'harold',
            user_follower: 'bill',
            visibility: api.visibility.PRIVATE,
          },
          {
            key: 'follow-personal',
            type: 'follow',
            user: 'alfred',
            user_follower: 'jenny',
            visibility: api.visibility.PERSONAL,
          },
          { key: 'post-backfill-1', type: 'post', user: 'backfill', content: 'hello', contentType: 'text/html' },
          { key: 'post-backfill-2', type: 'post', user: 'backfill', content: 'hello', contentType: 'text/html' },
          { key: 'post-backfill-3', type: 'post', user: 'backfill', content: 'hello', contentType: 'text/html' },
          {
            key: 'follow-backfill',
            type: 'follow',
            user: 'backfill',
            user_follower: 'backfill-follower',
            visibility: api.visibility.PUBLIC,
            backfill: 2,
          },
          {
            key: 'friend-1',
            reciprocal: 'reciprocal-friend-1',
            type: 'friend',
            user: 'cliftonc',
            user_friend: 'phteven',
          },
          { key: 'friend-2', reciprocal: 'reciprocal-friend-2', type: 'friend', user: 'cliftonc', user_friend: 'harold' },
          {
            key: 'post-old',
            type: 'post',
            user: 'cliftonc',
            content: 'hello',
            contentType: 'text/html',
            timestamp: new Date(1280296860145),
          },
          { key: 'post-public', type: 'post', user: 'phteven', content: 'hello', contentType: 'text/html' },
          { key: 'post-mention', type: 'post', user: 'bill', content: 'mentioning @json', contentType: 'text/html' },
          {
            key: 'post-mention-follower',
            type: 'post',
            user: 'bill',
            content: 'mentioning @alfred',
            contentType: 'text/html',
          },
          { key: 'like-google', type: 'like', user: 'cliftonc', item: 'http://www.google.com' },
        ];

        initialiser.setupGraph(keyspace, api, users, actions, (err, results) => {
          expect(err).to.be(null);
          actionResults = results;
          done();
        });
      });

      this.timeout(10000);

      it('logged in - can get a feed for yourself that is in the correct order', (done) => {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            // 'like-google',
            'friend-2',
            'friend-1',
            'follow-2',
            'follow-1',
            'post-old',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a feed for yourself that is paginated in the correct order', (done) => {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, { pageSize: 4 }, (err, { feed, nextPageState: pageState1 }) => {
          expect(err).to.be(null);
          const expected = [
            // 'like-google',
            'friend-2',
            'friend-1',
            'follow-2',
            'follow-1',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          expect(pageState1).not.to.be(null);
          const pagination = { pageSize: 4, pageState: pageState1 };
          api.feed.getFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, pagination, (err, { feed: feedItems, nextPageState: pageState2 }) => {
            expect(err).to.be(null);
            const expectedItems = [
              'post-old',
            ];
            initialiser.assertFeed(feedItems, actionResults, expectedItems);
            expect(pageState2).to.be(null);
            done();
          });
        });
      });

      it('logged in - can get a feed for a friend that is in the correct order', (done) => {
        api.feed.getFeed(keyspace, users['phteven'].user, users['cliftonc'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            // 'like-google',
            'friend-2',
            'friend-1',
            'follow-2',
            'follow-1',
            'post-old',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a backfilled feed', (done) => {
        api.feed.getFeed(keyspace, users['backfill-follower'].user, users['backfill-follower'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'follow-backfill',
            'post-backfill-3',
            'post-backfill-2',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a feed for a friend and follower that is in the correct order', (done) => {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['phteven'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            // 'like-google',
            'post-public',
            'reciprocal-friend-1',
            'follow-1',
            'post-old',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a feed for a follower that is not a friend in the correct order', (done) => {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['ted'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            // 'like-google',
            'follow-2',
            'post-old',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('anonymous - can get a feed that is in correct order', (done) => {
        api.feed.getFeed(keyspace, null, users['cliftonc'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            // 'like-google',
            'follow-2',
            'follow-1',
            'post-old',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can see private follows as the user', (done) => {
        api.feed.getFeed(keyspace, users['harold'].user, users['harold'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'reciprocal-friend-2',
            'follow-private',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can not see private follows as the anonymous user', (done) => {
        api.feed.getFeed(keyspace, null, users['harold'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can see personal follows as the user', (done) => {
        api.feed.getFeed(keyspace, users['alfred'].user, users['alfred'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'post-mention-follower',
            'post-mention',
            'follow-personal',
            'follow-3',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('cant see personal follows as another user', (done) => {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['alfred'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'post-mention-follower',
            'post-mention',
            'follow-3',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('cant see personal follows as the anonymous user', (done) => {
        api.feed.getFeed(keyspace, null, users['alfred'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'post-mention-follower',
            'post-mention',
            'follow-3',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can see personal follows as the following user', (done) => {
        api.feed.getFeed(keyspace, users['jenny'].user, users['jenny'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'follow-personal',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can get a feed for yourself contains mentions', (done) => {
        api.feed.getFeed(keyspace, users['bill'].user, users['bill'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'post-mention-follower',
            'post-mention',
            'follow-private',
            'follow-3',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('can get a feed for yourself that contains posts you were mentioned in', (done) => {
        api.feed.getFeed(keyspace, users['json'].user, users['json'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'post-mention',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('cant see follows or mentions on a users personal feed, only direct items', (done) => {
        api.feed.getUserFeed(keyspace, null, users['cliftonc'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            // 'like-google',
            'follow-2',
            'follow-1',
            'post-old',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a users personal feed as the user and see direct actions', (done) => {
        api.feed.getUserFeed(keyspace, users['bill'].user, users['bill'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'post-mention-follower',
            'post-mention',
            'follow-private',
            'follow-3',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('logged in - can get a users personal feed as the user and see direct actions', (done) => {
        api.feed.getUserFeed(keyspace, users['bill'].user, users['bill'].user, { pageSize: 3 }, (err, { feed, nextPageState: pageState1 }) => {
          expect(err).to.be(null);
          const expected = [
            'post-mention-follower',
            'post-mention',
            'follow-private',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          expect(pageState1).not.to.be(null);
          const pagination = { pageSize: 3, pageState: pageState1 };
          api.feed.getUserFeed(keyspace, users['bill'].user, users['bill'].user, pagination, (err, { feed: feedItems, nextPageState: pageState2 }) => {
            expect(err).to.be(null);
            const expectedItems = [
              'follow-3',
            ];
            initialiser.assertFeed(feedItems, actionResults, expectedItems);
            expect(pageState2).to.be(null);
            done();
          });
        });
      });

      it('logged in - can get a users personal feed as a friend and see direct items private or public', (done) => {
        api.feed.getUserFeed(keyspace, users['cliftonc'].user, users['phteven'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'post-public',
            'reciprocal-friend-1',
            'follow-1',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('anonymous - can get a users personal feed anonymously and only see direct, public items', (done) => {
        api.feed.getUserFeed(keyspace, null, users['phteven'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const expected = [
            'post-public',
            'follow-1',
          ];
          initialiser.assertFeed(feed, actionResults, expected);
          done();
        });
      });

      it('if you unfollow someone their items are no longer visible in your feed', (done) => {
        api.follow.removeFollower(keyspace, users['cliftonc'].user, users['phteven'].user, (err) => {
          expect(err).to.be(null);
          api.feed.getFeed(keyspace, users['cliftonc'].user, users['phteven'].user, (err, { feed }) => {
            expect(err).to.be(null);
            const expected = [
              'post-public',
              'reciprocal-friend-1',
            ];
            initialiser.assertFeed(feed, actionResults, expected);
            done();
          });
        });
      });

      it('can remove feed items older than a specific time', (done) => {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, (err, { feed }) => {
          expect(err).to.be(null);
          const feedLength = feed.length;
          api.feed.removeFeedsOlderThan(keyspace, users['cliftonc'].user, new Date(2015, 10, 1), (err) => {
            expect(err).to.be(null);
            api.feed.getFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, (err, { feed: feedItems }) => {
              expect(err).to.be(null);
              expect(feedItems.length).to.be(feedLength - 1);
              done();
            });
          });
        });
      });
    });
  });
});
