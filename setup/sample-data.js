var client = require('../db/client')();
var api = require('../index');
var cassandra = require('cassandra-driver');
var async = require('async');
var casual = require('casual');
var numUsers = 10;
var KEYSPACE = 'seguir';
var users = [];

function createUsers(next) {
  // 0 is known for testing
  for(var i=0; i < numUsers; i++) {
    users.push(casual.username)
  }
  users.push('cliftonc');
  next();
}

function deleteData(next) {
  console.log('Truncating all existing data ...');
  var tables = [
    'users', 'friends', 'followers', 'posts', 'likes', 'userline'
  ]
  async.map(tables, function(table, cb) {
    client.execute('TRUNCATE ' + KEYSPACE + '.' + table, cb);
  }, next);
}

function addUsers(next) {
  console.log('Creating users ...');
  async.map(users, function(user, cb) {
    api.create.addUser(user, cb);
  }, function(err, results) {
    // User array now has ids
    users = results;
    next();
  });
}

function addFriends(next) {
  console.log('Creating friends ...');
  var pairs = getUserPairs(numUsers*2);
  async.map(pairs, function(pair, cb) {
     api.create.addFriend(pair[0], pair[1], casual.moment.toDate(), cb);
  }, next);
}

function addFollowers(next) {
  console.log('Creating followers ...');
  var pairs = getUserPairs(numUsers*2);
  async.map(pairs, function(pair, cb) {
     api.create.addFollower(pair[0], pair[1], casual.moment.toDate(), cb);
  }, next);
}

function addPosts(next) {
  console.log('Creating posts ...');
  var posts = getUsers(numUsers*2);
  async.map(posts, function(post, cb) {
     api.create.addPost(post.user, casual.text, casual.moment.toDate(), cb);
  }, next);
}

function addLikes(next) {
  console.log('Creating likes ...');
  var likes = getUsers(numUsers*2);
  async.map(likes, function(like, cb) {
     api.create.addLike(like.user, casual.domain, casual.moment.toDate(), cb);
  }, next);
}

function getUserPairs(n) {
  var pairs = [];
  for(var i=0; i < n; i++) {
    pairs.push(getUserPair());
  }
  return pairs;
}

function getUserPair() {
  var user1 = getUser();
  var user2 = getUser();
  while(user2.user === user1.user) {
    var user2 = getUser();
  }
  return [
    user1.user,
    user2.user
  ];
}

function getUsers(n) {
  var users = [];
  for(var i=0; i < n; i++) {
    users.push(getUser());
  }
  return users;
}

function getUser() {
  return users[Math.floor(Math.random()*numUsers + 1)];
}

async.series([
  createUsers,
  deleteData,
  addUsers,
  addFriends,
  addFollowers,
  addPosts,
  addLikes
], function(err, data) {
  if(err) console.dir(err);
  client.shutdown();
  console.dir('Sample data creation complete!');
})
