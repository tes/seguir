/**
 * Helpers for initialising acceptance tests
 */
var Api = require('../../api');
var expect = require('expect.js');
var async = require('async');
var _ = require('lodash');

var cleaned = false;

function setupApi (keyspace, config, next) {

  Api(config, function (err, api) {
    if (err) { return next(err); }
    console.log('   Setting up keyspace in ' + api.client.type + '...');
    api.migrations.getMigrationsToApplyToKeyspace(keyspace, 'tenant', function (err, migrations) {
      if (err) { return next(err); }
      var truncate = migrations.length === 0 && !process.env.CLEAN && !(process.env.CLEAN_ONCE && !cleaned);
      api.client.truncate = truncate;
      api.client.setup.setupTenant(api.client, keyspace, truncate, function (err) {
        if (err) { return next(err); }
        if (!truncate) { cleaned = true; }
        next(null, api);
      });
    });
  });
}

function setupUsers (keyspace, api, users, next) {
  var userMap = {};
  async.map(users, function (user, cb) {
    api.user.addUser(keyspace, user.username, user.altid, {userdata: {'age': 15}}, cb);
  }, function (err, results) {
    if (err) { return next(err); }
    results.forEach(function (user) {
      userMap[user.username] = user;
    });
    next(null, userMap);
  });
}

function setupGraph (keyspace, api, users, actions, next) {

  function addFollow (follow, cb) {
    api.follow.addFollower(keyspace, users[follow.user].user, users[follow.user_follower].user, api.client.getTimestamp(), follow.visibility || api.visibility.PUBLIC, cb);
  }

  function addFriend (friend, cb) {
    api.friend.addFriend(keyspace, users[friend.user].user, users[friend.user_friend].user, api.client.getTimestamp(), cb);
  }

  function addPost (post, cb) {
    api.post.addPost(keyspace, users[post.user].user, post.content, post.contentType, post.timestamp || api.client.getTimestamp(), post.visibility || api.visibility.PUBLIC, cb);
  }

  function addLike (like, cb) {
    api.like.addLike(keyspace, users[like.user].user, like.item, api.client.getTimestamp(), cb);
  }

  async.mapSeries(actions, function (action, cb) {
    if (action.type === 'follow') { return addFollow(action, cb); }
    if (action.type === 'friend') { return addFriend(action, cb); }
    if (action.type === 'post') { return addPost(action, cb); }
    if (action.type === 'like') { return addLike(action, cb); }
    return cb(null);
  }, function (err, results) {
    if (err) return next(err);
    var actionResults = _.zipObject(_.pluck(actions, 'key'), results);
    // We need to add pseudo items for reciprocal friendships
    _.mapKeys(actions, function (result, key) {
      if (result.reciprocal) {
        var reciprocal = actionResults[result.key].reciprocal,
          reciprocalKey = result.reciprocal;
        actionResults[reciprocalKey] = {friend: reciprocal};
      }
    });
    next(null, actionResults);
  });

}

function assertFeed (feed, actionResults, expected) {
  var feedKeys = _.map(feed, function (item) { return {item: item._item, type: item.type}; });
  var expectedFeed = _.map(expected, function (key) {
    var type;
    // This is due to no common identifier and type - we should refactor to add these
    if (!actionResults[key]) { return; }
    if (actionResults[key].like) { type = 'like'; }
    if (actionResults[key].post) { type = 'post'; }
    if (actionResults[key].friend) { type = 'friend'; }
    if (actionResults[key].follow) { type = 'follow'; }
    return {item: actionResults[key][type], type: type};
  });
  expect(feedKeys).to.eql(expectedFeed);
}

module.exports = {
  setupApi: setupApi,
  setupUsers: setupUsers,
  setupGraph: setupGraph,
  assertFeed: assertFeed
};
