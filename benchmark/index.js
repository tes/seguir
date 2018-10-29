/**
 *
 */

const keyspace = 'benchmark_seguir_app_api';
const expect = require('expect.js');
const initialiser = require('../tests/fixtures/initialiser');
const _ = require('lodash');
const async = require('async');
const ss = require('simple-statistics');

// Config
const DATABASE = process.env.DATABASE || 'cassandra-redis';
const TIMES = +process.env.TIMES || 500;
const LIMIT = +process.env.LIMIT || 10;
const FEED = +process.env.FEED || 50;
const ITEMS = +process.env.ITEMS || 500;

const config = _.clone(require('../tests/fixtures/' + DATABASE + '.json'));
config.keyspace = keyspace;

let api;
let users = {};

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
    if (err) {
      console.log(err);
      process.exit(1);
    }
    users = userMap;
    initialise(() => {
      benchmark();
    });
  });
});

const initialise = (next) => {
  const actions = [
    { key: 'follow-1', type: 'follow', user: 'cliftonc', user_follower: 'phteven' },
    { key: 'follow-2', type: 'follow', user: 'cliftonc', user_follower: 'ted' },
    { key: 'follow-3', type: 'follow', user: 'bill', user_follower: 'alfred' },
    { key: 'follow-4', type: 'follow', user: 'alfred', user_follower: 'phteven' },
    { key: 'follow-5', type: 'follow', user: 'phteven', user_follower: 'cliftonc' },
    { key: 'follow-6', type: 'follow', user: 'phteven', user_follower: 'bill' },
    { key: 'follow-7', type: 'follow', user: 'phteven', user_follower: 'alfred' },
    { key: 'follow-8', type: 'follow', user: 'phteven', user_follower: 'jenny' },
    {
      key: 'post-old',
      type: 'post',
      user: 'cliftonc',
      content: 'hello',
      contentType: 'text/html',
      timestamp: new Date(1280296860145),
    },
  ];

  let post, post2, like;
  // Intersperse likes and posts
  for (let i = 0; i < ITEMS; i++) {
    post = { key: 'post-public-cc-' + i, type: 'post', user: 'cliftonc', content: 'hello', contentType: 'text/html' };
    post.content = 'Hello there from iteraton number ' + i;
    actions.push(post);
    post2 = { key: 'post-public-alf-' + i, type: 'post', user: 'alfred', content: 'goodbye', contentType: 'text/html' };
    post2.content = 'Goodbye there from iteraton number ' + i;
    actions.push(post2);
    like = { key: 'like-public-' + i, type: 'like', user: 'cliftonc', item: 'http://hello.com/' + i };
    actions.push(like);
  }

  console.log('Initialising feed with ' + actions.length + ' actions');
  const start = process.hrtime();
  initialiser.setupGraph(keyspace, api, users, actions, (err, results) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    const end = process.hrtime(start);
    console.info('Setup time (hr): %ds %dms', end[0], end[1] / 1000000);

    console.log('\nRedis Cache [SETUP]:');
    redisStats(api);
    api.client.resetStats();

    next();
  });
};

const benchmark = () => {
  console.log('Starting benchmark with TIMES=' + TIMES + ', CONCURRENCY=' + LIMIT + ', FEED=' + FEED + ' ...\n');
  async.timesLimit(TIMES, LIMIT, (n, next) => {
    setTimeout(() => {
      getFollowers('phteven', (err, followTime) => {
        if (err) {}
        getFeed('phteven', (err, feedTime) => {
          next(err, followTime + feedTime);
        });
      });
    }, Math.random() * 100 + 50);
  }, (err, result) => {
    process.stdout.write(' DONE!\n\n');
    if (err) {
      console.log(err);
      process.exit(1);
    }

    console.log('Response Times:');
    console.log('Min: ' + Math.floor(ss.min(result)) + 'ms');
    console.log('Max: ' + Math.floor(ss.max(result)) + 'ms');
    console.log('95th: ' + Math.floor(ss.quantile(result, 0.95)) + 'ms');
    console.log('Std Dev: ' + Math.floor(ss.standardDeviation(result)) + 'ms');

    console.log('\nRedis Cache:');
    redisStats(api);

    console.log('\nUser Cache:');
    userStats(api);

    process.exit(0); // TODO shutdown cleanly

    api.client._client.shutdown();
  });
};

const redisStats = (api) => {
  const rs = api.client.cacheStats();
  if (rs.user) console.log('Hit Ratio [user] out of ' + rs.user.GET + ': ' + Math.floor((rs.user.HIT / rs.user.GET) * 100) + '%');
  if (rs.post) console.log('Hit Ratio [post] out of ' + rs.post.GET + ': ' + Math.floor((rs.post.HIT / rs.post.GET) * 100) + '%');
  if (rs.like) console.log('Hit Ratio [like] out of ' + rs.like.GET + ': ' + Math.floor((rs.like.HIT / rs.like.GET) * 100) + '%');
  if (rs.follow) console.log('Hit Ratio [follow] out of ' + rs.follow.GET + ': ' + Math.floor((rs.follow.HIT / rs.follow.GET) * 100) + '%');
  if (rs.count) console.log('Hit Ratio [count] out of ' + rs.count.GET + ': ' + Math.floor((rs.count.HIT / rs.count.GET) * 100) + '%');
};

const userStats = (api) => {
  const us = api.client.cacheStats();
  if (us.user) console.log('Hit Ratio [user]: ' + Math.floor((us.user.HIT / us.user.GET) * 100) + '%');
};

const getFeed = (user, next) => {
  const start = process.hrtime();
  process.stdout.write('.');
  api.feed.getFeed(keyspace, users[user].user, users[user].user, { pageSize: 50 }, (err, feed) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    const end = process.hrtime(start);
    next(null, end[1] / 1000000);
  });
};

const getFollowers = (user, next) => {
  const start = process.hrtime();
  process.stdout.write('.');
  api.follow.getFollowers(keyspace, users[user].user, users[user].user, (err, followers) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    const end = process.hrtime(start);
    next(null, end[1] / 1000000);
  });
};
