/**
 *
 */

var keyspace = 'benchmark_seguir_app_api';
var expect = require('expect.js');
var initialiser = require('../tests/fixtures/initialiser');
var _ = require('lodash');
var async = require('async');
var config = _.clone(require('../tests/fixtures/cassandra-redis.json'));
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
    {key: 'post-old', type: 'post', user: 'cliftonc', content: 'hello', contentType: 'text/html', timestamp: new Date(1280296860145)}
  ];

  var post = {key: 'post-public', type: 'post', user: 'cliftonc', content: 'hello', contentType: 'text/html'};

  for (var i = 0; i < 1000; i++) {
    post.key = 'post-public-' + i;
    post.content = 'Hello there from iteraton number ' + i;
    actions.push(post);
  }

  console.log('Initialising feed for cliftonc with two followers, and ' + actions.length + ' actions');
  var start = process.hrtime();
  initialiser.setupGraph(keyspace, api, users, actions, function (err, results) {
    var end = process.hrtime(start);
    console.info('Setup time (hr): %ds %dms', end[0], end[1] / 1000000);
    expect(err).to.be(null);
    next();
  });
}

function benchmark () {
  console.log('Starting benchmark ...');
  async.times(10, function (n, next) {
    getFeed('phteven', next);
  }, function (err, result) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    console.dir(result);
    console.log('\nRedis Cache:');
    console.dir(api.client.cacheStats);
    console.log('\nUser Cache:');
    console.dir(api.user.userCacheStats);
    process.exit(0); // TODO shutdown cleanly
  });
}

function getFeed (user, next) {
  var start = process.hrtime();
  api.feed.getFeed(keyspace, users[user].user, users[user].user, null, 50, function (err, feed) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    var end = process.hrtime(start);
    next(null, end[1] / 1000000);
  });
}

