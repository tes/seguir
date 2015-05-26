module.exports = Api;

function Api (client, messaging, keyspace) {

  if (!(this instanceof Api)) {
    return new Api(client, messaging, keyspace);
  }

  // TODO: Refactor out into iteration over array of modules

  var auth = require('./auth');
  var common = require('./common');
  var user = require('./user');
  var post = require('./post');
  var like = require('./like');
  var feed = require('./feed');
  var friend = require('./friend');
  var follow = require('./follow');

  this.auth = auth(client, messaging, keyspace, this);
  this.common = common(client, messaging, keyspace, this);
  this.follow = follow(client, messaging, keyspace, this);
  this.feed = feed(client, messaging, keyspace, this);
  this.friend = friend(client, messaging, keyspace, this);
  this.like = like(client, messaging, keyspace, this);
  this.post = post(client, messaging, keyspace, this);
  this.user = user(client, messaging, keyspace, this);

}
