var KEYSPACE = 'seguir';
var client = require('../db/client')();
var api = require('../index')(client, KEYSPACE);
var cassandra = require('cassandra-driver');
var async = require('async');
var casual = require('casual');
var numUsers = 10;
var users = [];

function createApplication(next) {
  // 0 is known for testing
  next();
}

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

function addApplication(next) {
  console.log('Creating application ...');
  api.auth.addApplication('sample-application', '247455fe-0e8e-4e3f-af4d-458ac13508b8', next);
}

function addUsers(next) {
  console.log('Creating users ...');
  async.map(users, function(user, cb) {
    api.manage.addUser(user, cb);
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
     api.manage.addFriend(pair[0], pair[1], casual.moment.toDate(), cb);
  }, next);
}

function addFollowers(next) {
  console.log('Creating followers ...');
  var pairs = getUserPairs(numUsers*2);
  async.map(pairs, function(pair, cb) {
     api.manage.addFollower(pair[0], pair[1], casual.moment.toDate(), cb);
  }, next);
}

function addPosts(next) {
  console.log('Creating posts ...');
  var posts = getUsers(numUsers*2);
  async.map(posts, function(post, cb) {
     api.manage.addPost(post.user, casual.text, casual.moment.toDate(), false, cb);
  }, next);
}

function addLikes(next) {
  console.log('Creating likes ...');
  var likes = getUsers(numUsers*2);
  async.map(likes, function(like, cb) {
     api.manage.addLike(like.user, casual.domain, casual.moment.toDate(), cb);
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
  addApplication,
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
