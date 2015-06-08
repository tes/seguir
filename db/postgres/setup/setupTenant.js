var async = require('async');

function defineTablesAndIndexes (KEYSPACE) {

  var tables = [], indexes = [], tableIndexes = {};

  if (!KEYSPACE) {
    console.log('You must specify a keyspace, abandoning keyspace creation.');
    return;
  }

  /**
   * @apiDefine Data Data Structure
   * This section defines the various table structures used to store the data in Cassandra, as we are using apidoc to generate
   * this documentation, please read the 'parameters' reflects the columns in the tables.
   */

  /**
   * @api {table} Users Users
   * @apiName UserData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores a reference to each user that can have posts, likes, friends and followers.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {String} username The name of the user.
   * @apiUse ExampleCqlUsers
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.users (user varchar(36) PRIMARY KEY, username varchar(500), altid varchar(500), userdata varchar(5000))');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.users(username)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.users(altid)');
  tableIndexes.users = ['altid', 'username'];

  /**
   * @api {table} Posts Posts
   * @apiName PostsData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores posts that a user (or application) make to a users timeline.
   * @apiParam {Guid} post The unique guid for the post.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {String} type Optional sub-type for the post, defaults to 'varchar(500)'.
   * @apiParam {String} content The content of the post.
   * @apiParam {Boolean} isprivate Is the post only for friends.
   * @apiParam {Boolean} ispersonal Is the post only for the user.
   * @apiParam {Timestamp} posted The date the post was made.
   * @apiUse ExampleCqlPosts
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.posts (post varchar(36) PRIMARY KEY, user varchar(36), type varchar(500), content varchar(500), content_type varchar(500), isprivate boolean, ispersonal boolean, posted timestamp)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.posts(user)');
  tableIndexes.posts = ['user'];

  /**
   * @api {table} Friends Friends
   * @apiName FriendData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores a reference to between each user and their friends, this is reciprocal so you get two rows per relationship.
   * @apiParam {Guid} friend The unique guid for the friend relationship.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {Guid} user_friend The unique guid for the user they are friends with.
   * @apiParam {Timestamp} since The date the relationship began.
   * @apiUse ExampleCqlFriends
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.friends (friend varchar(36), user varchar(36), user_friend varchar(36), since timestamp, PRIMARY KEY (user, user_friend))');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.friends(friend)');
  tableIndexes.friends = ['friend'];

  /**
   * @api {table} FriendRequests Friend Requests
   * @apiName FriendRequestData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores pending friend requests, stored in a separate table to simplify the relationship management and newsfeed.
   * @apiParam {Guid} friend_request The unique guid for the friend requyest.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {Guid} user_friend The unique guid for the user they are friends with.
   * @apiParam {String} message The message to send with the request
   * @apiParam {Timestamp} time The date the request was made.
   * @apiUse ExampleCqlFriendRequests
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.friend_request (friend_request varchar(36), user varchar(36), user_friend varchar(36), message varchar(500), since timestamp, PRIMARY KEY (friend_request))');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.friend_request(user_friend)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.friend_request(user)');
  tableIndexes.friend_request = ['user', 'user_friend'];

  /**
   * @api {table} Likes Likes
   * @apiName LikesData
   * @apiGroup Data
   * @apiVersion 1.0.0
   *
   *  @apiDescription Stores items that a user 'likes' on their newsfeed, an item can be anything that is
   * representable by a string (e.g. a canonical URL for a page is a typical example, but it can be anything);
   *
   * @apiParam {Guid} like The unique guid for the like.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {String} item The key of the item liked by the user.
   * @apiParam {Timestamp} since The date the like was made.
   * @apiUse ExampleCqlLikes
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.likes (like varchar(36), user varchar(36), item varchar(500), since timestamp, PRIMARY KEY (user, item))');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.likes(like)');
  tableIndexes.likes = ['like'];

  /**
   * @api {table} Follower Follower
   * @apiName FollowerData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores follower data from one user to another, this is not necessarily reciprocal, and does not require approval.
   * @apiParam {Guid} follow The unique guid for the follower relationship.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {Guid} user_follower The unique guid for the user they are following.
   * @apiParam {Boolean} isprivate Is the follow visible only to friends.
   * @apiParam {Boolean} ispersonal Is the follow visible only for the user and the person being followed.
   * @apiParam {Timestamp} since The date the follow began.
   * @apiUse ExampleCqlFollows
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.followers (follow varchar(36), user varchar(36), user_follower varchar(36), isprivate boolean, ispersonal boolean, since timestamp, PRIMARY KEY (user, user_follower))');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.followers(follow)');
  tableIndexes.followers = ['follow'];

  /**
   * @api {table} Userline Newsfeed
   * @apiName UserLineData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Contains the newsfeed for each user, updated by performing any of the Add actions, not interacted with directly.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {Guid} time The unique timevarchar(36) for the event, this is how the feed is sorted.
   * @apiParam {Guid} item The unique guid for the item in the feed - this can be a post, follow, friend or like event.
   * @apiParam {String} type The string short name for the type of event, valid values are: 'post','follow','friend','like'.
   * @apiParam {Boolean} isprivate Is this event private and only visible if the user is a friend.
   * @apiParam {Boolean} ispersonal Is this event personal and only visible to the user.
   * @apiUse ExampleCqlFeed
   */
  var feedTables = ['feed_timeline', 'user_timeline'];

  feedTables.forEach(function (table) {
    tables.push('CREATE TABLE ' + KEYSPACE + '.' + table + ' (user varchar(36), time varchar(36), item varchar(36), type varchar(500), isprivate boolean, ispersonal boolean, PRIMARY KEY (user, time)) WITH CLUSTERING ORDER BY (time DESC)');
    indexes.push('CREATE INDEX ON ' + KEYSPACE + '.' + table + '(item)');
    tableIndexes[table] = ['item'];
  });

  return {
    tables: tables,
    indexes: indexes,
    tableIndexes: tableIndexes
  };
}

function setup (client, keyspace, next) {

  var options = defineTablesAndIndexes(keyspace);
  options.KEYSPACE = keyspace;

  var helpers = require('./helpers')(client, options);

  async.series([
    helpers.dropKeyspace,
    helpers.createKeyspace,
    helpers.createTables,
    helpers.createSecondaryIndexes
  ], function (err, data) {
    /* istanbul ignore if */
    if (err) return next(err);
    next();
  });
}

module.exports = setup;
