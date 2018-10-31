/**
 * Helpers for initialising acceptance tests
 */
const apiInit = require('../../api');
const expect = require('expect.js');
const async = require('async');
const _ = require('lodash');

let cleaned = false;

const setupApi = (keyspace, config, next) => {
  apiInit(config, (err, api) => {
    if (err) { return next(err); }
    const truncate = !process.env.CLEAN && !(process.env.CLEAN_ONCE && !cleaned);
    api.client.truncate = truncate;
    api.client.setup.setupTenant(api.client, keyspace, truncate, (err) => {
      if (err) { return next(err); }
      if (!truncate) { cleaned = true; }
      api.migrations.getMigrationsToApplyToKeyspace(keyspace, 'tenant', (err, migrations) => {
        if (err) { return next(err); }
        api.migrations.applyMigrations(migrations, (err) => {
          if (err) { return next(err); }
          next(null, api);
        });
      });
    });
  });
};

const setupUsers = (keyspace, api, users, next) => {
  const userMap = {};
  async.map(users, (user, cb) => {
    api.user.addUser(keyspace, user.username, user.altid, { userdata: { age: 15 } }, cb);
  }, (err, results) => {
    if (err) { return next(err); }
    results.forEach((user) => {
      userMap[user.username] = user;
    });
    next(null, userMap);
  });
};

const setupGraph = (keyspace, api, users, actions, next) => {
  const addFollow = (follow, cb) => {
    api.follow.addFollower(keyspace, users[follow.user].user, users[follow.user_follower].user, api.client.getTimestamp(), follow.visibility || api.visibility.PUBLIC, follow.backfill, cb);
  };

  const addFriend = (friend, cb) => {
    api.friend.addFriend(keyspace, users[friend.user].user, users[friend.user_friend].user, api.client.getTimestamp(), cb);
  };

  const addPost = (post, cb) => {
    api.post.addPost(keyspace, users[post.user].user, post.content, post.contentType, post.timestamp || api.client.getTimestamp(), post.visibility || api.visibility.PUBLIC, cb);
  };

  const addLike = (like, cb) => {
    cb();
    // api.like.createLike(keyspace, users[like.user].user, like.item, api.client.getTimestamp(), cb);
  };

  async.mapSeries(actions, (action, cb) => {
    if (action.type === 'follow') { return addFollow(action, cb); }
    if (action.type === 'friend') { return addFriend(action, cb); }
    if (action.type === 'post') { return addPost(action, cb); }
    if (action.type === 'like') { return addLike(action, cb); }
    return cb(null);
  }, (err, results) => {
    if (err) return next(err);
    const actionResults = _.zipObject(_.map(actions, 'key'), results);
    // We need to add pseudo items for reciprocal friendships
    _.mapKeys(actions, (result, key) => { // eslint-disable-line no-unused-vars
      if (result.reciprocal) {
        const reciprocal = actionResults[result.key].reciprocal;
        const reciprocalKey = result.reciprocal;
        actionResults[reciprocalKey] = { friend: reciprocal };
      }
    });
    next(null, actionResults);
  });
};

const assertFeed = (feed, actionResults, expected) => {
  const feedKeys = _.map(feed, (item) => ({ item: item._item, type: item.type }));
  const expectedFeed = _.map(expected, (key) => {
    let type;
    // This is due to no common identifier and type - we should refactor to add these
    if (!actionResults[key]) { return; }
    if (actionResults[key].like) { type = 'like'; }
    if (actionResults[key].post) { type = 'post'; }
    if (actionResults[key].friend) { type = 'friend'; }
    if (actionResults[key].follow) { type = 'follow'; }
    return { item: actionResults[key][type], type };
  });
  expect(feedKeys).to.eql(expectedFeed);
};

module.exports = {
  setupApi,
  setupUsers,
  setupGraph,
  assertFeed,
};
