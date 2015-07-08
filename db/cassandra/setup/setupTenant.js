var async = require('async');
var schemaVersion = 1;

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
  tables.push('CREATE TABLE ' + KEYSPACE + '.schema_version (version varint, applied timestamp, description text, PRIMARY KEY (version, applied)) WITH CLUSTERING ORDER BY (applied DESC)');

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
  tables.push('CREATE TABLE ' + KEYSPACE + '.users (user uuid PRIMARY KEY, username text, altid text, userdata map<text,text>)');
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
   * @apiParam {String} type Optional sub-type for the post, defaults to 'text'.
   * @apiParam {String} content The content of the post.
   * @apiParam {String} visibility The visibility of the post
   * @apiParam {Timestamp} posted The date the post was made.
   * @apiUse ExampleCqlPosts
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.posts (post uuid PRIMARY KEY, user uuid, type text, content text, content_type text, visibility text, posted timestamp)');
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
  tables.push('CREATE TABLE ' + KEYSPACE + '.friends (friend uuid, user uuid, user_friend uuid, since timestamp, visibility text, PRIMARY KEY (user, user_friend))');
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
  tables.push('CREATE TABLE ' + KEYSPACE + '.friend_request (friend_request uuid, user uuid, user_friend uuid, message text, since timestamp, visibility text, PRIMARY KEY (friend_request))');
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
  tables.push('CREATE TABLE ' + KEYSPACE + '.likes (like uuid, user uuid, item text, since timestamp, visibility text, PRIMARY KEY (user, item))');
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
   * @apiParam {String} visibility Visibility level of follow
   * @apiParam {Timestamp} since The date the follow began.
   * @apiUse ExampleCqlFollows
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.followers (follow uuid, user uuid, user_follower uuid, visibility text, since timestamp, PRIMARY KEY (user, user_follower))');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.followers(follow)');
  tableIndexes.followers = ['follow'];

  /**
   * Counts are stored in a separate table and incremented / decremented when events occur - this is to avoid counting queries.
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.counts (item text, type text, count counter, PRIMARY KEY (item, type))');

  /**
   * @api {table} Userline Newsfeed
   * @apiName UserLineData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Contains the newsfeed for each user, updated by performing any of the Add actions, not interacted with directly.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {Guid} time The unique timeuuid for the event, this is how the feed is sorted.
   * @apiParam {Guid} item The unique guid for the item in the feed - this can be a post, follow, friend or like event.
   * @apiParam {String} type The string short name for the type of event, valid values are: 'post','follow','friend','like'.
   * @apiParam {String} visibility The visibility level of the item
   * @apiUse ExampleCqlFeed
   */
  var feedTables = ['feed_timeline', 'user_timeline'];

  feedTables.forEach(function (table) {
    tables.push('CREATE TABLE ' + KEYSPACE + '.' + table + ' (user uuid, time timeuuid, item uuid, type text, visibility text, PRIMARY KEY (user, time)) WITH CLUSTERING ORDER BY (time DESC)');
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
    helpers.createSecondaryIndexes,
    async.apply(helpers.initialiseSchemaVersion, schemaVersion),
    async.retry(5, helpers.assertIndexes.bind(helpers.assertIndexes))
  ], function (err, data) {
    /* istanbul ignore if */
    if (err) return next(err);
    next();
  });
}

module.exports = setup;
