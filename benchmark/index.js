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
    {key: 'follow-1', type: 'follow', user: 'alfred', user_follower: 'phteven'},
    {key: 'follow-1', type: 'follow', user: 'phteven', user_follower: 'cliftonc'},
    {key: 'post-old', type: 'post', user: 'cliftonc', content: 'hello', contentType: 'text/html', timestamp: new Date(1280296860145)}
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
    var end = process.hrtime(start);
    console.info('Setup time (hr): %ds %dms', end[0], end[1] / 1000000);
    expect(err).to.be(null);
    next();
  });
}

function benchmark () {
  console.log('Starting benchmark with TIMES=' + TIMES + ', CONCURRENCY=' + LIMIT + ', FEED=' + FEED + ' ...\n');
  async.timesLimit(TIMES, LIMIT, function (n, next) {
    setTimeout(function () {
      getFeed('phteven', next);
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

    var rs = api.client.cacheStats;
    console.log('Hit Ratio [user]: ' + Math.floor((rs.user.HIT / rs.user.GET) * 100) + '%');
    console.log('Hit Ratio [post]: ' + Math.floor((rs.post.HIT / rs.post.GET) * 100) + '%');
    console.log('Hit Ratio [like]: ' + Math.floor((rs.like.HIT / rs.like.GET) * 100) + '%');
    console.log('Hit Ratio [follow]: ' + Math.floor((rs.follow.HIT / rs.follow.GET) * 100) + '%');
    console.log('\nUser Cache:');

    var us = api.client.cacheStats;
    console.log('Hit Ratio [user]: ' + Math.floor((us.user.HIT / us.user.GET) * 100) + '%');
    process.exit(0); // TODO shutdown cleanly
  });
}

function getFeed (user, next) {
  var start = process.hrtime();
  process.stdout.write('.');
  api.feed.getFeed(keyspace, users[user].user, users[user].user, null, +FEED, function (err, feed) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    if (feed.length !== +FEED) {
      console.log('Invalid feed length: ' + feed.length);
      process.exit(1);
    }
    var end = process.hrtime(start);
    next(null, end[1] / 1000000);
  });
}

