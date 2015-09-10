/**
 *
 */

var keyspace = 'benchmark_seguir_app_api';
var expect = require('expect.js');
var initialiser = require('../tests/fixtures/initialiser');
var _ = require('lodash');
var async = require('async');
var ss = require('simple-statistics');

// Config
var DATABASE = process.env.DATABASE || 'cassandra-redis';
var TIMES = +process.env.TIMES || 500;
var LIMIT = +process.env.LIMIT || 10;
var FEED = +process.env.FEED || 50;
var ITEMS = +process.env.ITEMS || 500;

var config = _.clone(require('../tests/fixtures/' + DATABASE + '.json'));
config.keyspace = keyspace;

var api, users = {};

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
    if (err) {
      console.log(err);
      process.exit(1);
    }
    users = userMap;
    initialise(function () {
      benchmark();
    });
  });
});

function initialise (next) {
  var actions = [
    {key: 'follow-1', type: 'follow', user: 'cliftonc', user_follower: 'phteven'},
    {key: 'follow-2', type: 'follow', user: 'cliftonc', user_follower: 'ted'},
    {key: 'follow-3', type: 'follow', user: 'bill', user_follower: 'alfred'},
    {key: 'follow-4', type: 'follow', user: 'alfred', user_follower: 'phteven'},
    {key: 'follow-5', type: 'follow', user: 'phteven', user_follower: 'cliftonc'},
    {key: 'follow-6', type: 'follow', user: 'phteven', user_follower: 'bill'},
    {key: 'follow-7', type: 'follow', user: 'phteven', user_follower: 'alfred'},
    {key: 'follow-8', type: 'follow', user: 'phteven', user_follower: 'jenny'},
    {
      key: 'post-old',
      type: 'post',
      user: 'cliftonc',
      content: 'hello',
      contentType: 'text/html',
      timestamp: new Date(1280296860145)
    }
  ];

  var post, post2, like;
  // Intersperse likes and posts
  for (var i = 0; i < ITEMS; i++) {
    post = {key: 'post-public-cc-' + i, type: 'post', user: 'cliftonc', content: 'hello', contentType: 'text/html'};
    post.content = 'Hello there from iteraton number ' + i;
    actions.push(post);
    post2 = {key: 'post-public-alf-' + i, type: 'post', user: 'alfred', content: 'goodbye', contentType: 'text/html'};
    post2.content = 'Goodbye there from iteraton number ' + i;
    actions.push(post2);
    like = {key: 'like-public-' + i, type: 'like', user: 'cliftonc', item: 'http://hello.com/' + i};
    actions.push(like);
  }

  console.log('Initialising feed with ' + actions.length + ' actions');
  var start = process.hrtime();
  initialiser.setupGraph(keyspace, api, users, actions, function (err, results) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    var end = process.hrtime(start);
    console.info('Setup time (hr): %ds %dms', end[0], end[1] / 1000000);

    console.log('\nRedis Cache [SETUP]:');
    redisStats(api);
    api.client.resetStats();

    next();
  });
}

function benchmark () {
  console.log('Starting benchmark with TIMES=' + TIMES + ', CONCURRENCY=' + LIMIT + ', FEED=' + FEED + ' ...\n');
  async.timesLimit(TIMES, LIMIT, function (n, next) {
    setTimeout(function () {
      getFollowers('phteven', function (err, followTime) {
        if (err) {}
        ;
        getFeed('phteven', function (err, feedTime) {
          next(err, followTime + feedTime);
        });
      });
    }, Math.random() * 100 + 50);
  }, function (err, result) {
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
}

function redisStats (api) {
  var rs = api.client.cacheStats();
  if (rs.user) console.log('Hit Ratio [user] out of ' + rs.user.GET + ': ' + Math.floor((rs.user.HIT / rs.user.GET) * 100) + '%');
  if (rs.post) console.log('Hit Ratio [post] out of ' + rs.post.GET + ': ' + Math.floor((rs.post.HIT / rs.post.GET) * 100) + '%');
  if (rs.like) console.log('Hit Ratio [like] out of ' + rs.like.GET + ': ' + Math.floor((rs.like.HIT / rs.like.GET) * 100) + '%');
  if (rs.follow) console.log('Hit Ratio [follow] out of ' + rs.follow.GET + ': ' + Math.floor((rs.follow.HIT / rs.follow.GET) * 100) + '%');
  if (rs.count) console.log('Hit Ratio [count] out of ' + rs.count.GET + ': ' + Math.floor((rs.count.HIT / rs.count.GET) * 100) + '%');
}

function userStats (api) {
  var us = api.client.cacheStats();
  if (us.user) console.log('Hit Ratio [user]: ' + Math.floor((us.user.HIT / us.user.GET) * 100) + '%');
}

function getFeed (user, next) {
  var start = process.hrtime();
  process.stdout.write('.');
  api.feed.getFeed(keyspace, users[user].user, users[user].user, {pageSize: 50}, function (err, feed) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    var end = process.hrtime(start);
    next(null, end[1] / 1000000);
  });
}

function getFollowers (user, next) {
  var start = process.hrtime();
  process.stdout.write('.');
  api.follow.getFollowers(keyspace, users[user].user, users[user].user, function (err, followers) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    var end = process.hrtime(start);
    next(null, end[1] / 1000000);
  });
}

