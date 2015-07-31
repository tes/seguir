var async = require('async');
var schemaVersion = 3;

function defineTablesAndIndexes (KEYSPACE) {

  var tables = [], indexes = [];

  if (!KEYSPACE) {
    console.log('You must specify a keyspace, abandoning keyspace creation.');
    return;
  }

  /**
   * @apiDefine Data Data Structure
   * This section defines the various table structures used to store the data in Cassandra, as we are using apidoc to generate
   * this documentation, please read the 'parameters' reflects the columns in the tables.
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.schema_version (version smallint, applied timestamp, description varchar(500))');

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
  tables.push('CREATE TABLE ' + KEYSPACE + '.users ("user" varchar(36) NOT NULL PRIMARY KEY, username varchar(500) NOT NULL, altid varchar(500), userdata json)');
  indexes.push('CREATE INDEX users_username_idx ON ' + KEYSPACE + '.users ("username")');
  indexes.push('CREATE INDEX users_altid_idx ON ' + KEYSPACE + '.users ("altid")');

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
   * @apiParam {String} visibility Visibility level
   * @apiParam {Timestamp} posted The date the post was made.
   * @apiUse ExampleCqlPosts
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.posts (post varchar(36) NOT NULL PRIMARY KEY, "user" varchar(36) NOT NULL, type varchar(500), content varchar(500), content_type varchar(500), visibility varchar(50), posted timestamptz(3), altid varchar(36))');
  indexes.push('CREATE INDEX posts_user_idx ON ' + KEYSPACE + '.posts ("user")');
  indexes.push('CREATE INDEX posts_altid_idx ON ' + KEYSPACE + '.posts ("altid")');

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
  tables.push('CREATE TABLE ' + KEYSPACE + '.friends (friend varchar(36) NOT NULL PRIMARY KEY, "user" varchar(36) NOT NULL, user_friend varchar(36) NOT NULL, since timestamptz(3), visibility varchar(50))');
  indexes.push('CREATE INDEX friends_user_idx ON ' + KEYSPACE + '.friends ("user")');
  indexes.push('CREATE INDEX friends_user_friend_idx ON ' + KEYSPACE + '.friends ("user_friend")');

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
  tables.push('CREATE TABLE ' + KEYSPACE + '.friend_request (friend_request varchar(36) NOT NULL PRIMARY KEY, "user" varchar(36) NOT NULL, user_friend varchar(36) NOT NULL, message varchar(1000), since timestamptz(3), visibility varchar(50))');
  indexes.push('CREATE INDEX friendreqs_user_friend_idx ON ' + KEYSPACE + '.friend_request ("user_friend")');
  indexes.push('CREATE INDEX friendreqs_user_idx ON ' + KEYSPACE + '.friend_request ("user")');

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
  tables.push('CREATE TABLE ' + KEYSPACE + '.likes ("like" varchar(36) NOT NULL PRIMARY KEY, "user" varchar(36) NOT NULL, item varchar(256) NOT NULL, since timestamptz(3), visibility varchar(50))');
  indexes.push('CREATE INDEX like_user_idx ON ' + KEYSPACE + '.likes ("user")');
  indexes.push('CREATE INDEX like_item_idx ON ' + KEYSPACE + '.likes ("item")');

  /**
   * @api {table} Follower Follower
   * @apiName FollowerData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores follower data from one user to another, this is not necessarily reciprocal, and does not require approval.
   * @apiParam {Guid} follow The unique guid for the follower relationship.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {Guid} user_follower The unique guid for the user they are following.
   * @apiParam {String} visibility Visibility level
   * @apiParam {Timestamp} since The date the follow began.
   * @apiUse ExampleCqlFollows
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.followers (follow varchar(36) NOT NULL PRIMARY KEY, "user" varchar(36) NOT NULL, user_follower varchar(36) NOT NULL, visibility varchar(50), since timestamptz(3))');
  indexes.push('CREATE INDEX followers_follow_idx ON ' + KEYSPACE + '.followers ("follow")');
  indexes.push('CREATE INDEX followers_user_idx ON ' + KEYSPACE + '.followers ("user")');
  indexes.push('CREATE INDEX followers_user_follower_idx ON ' + KEYSPACE + '.followers ("user_follower")');

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
   * @apiParam {String} visibility Visibility level
   * @apiUse ExampleCqlFeed
   */
  var feedTables = ['feed_timeline', 'user_timeline'];

  feedTables.forEach(function (table) {
    tables.push('CREATE TABLE ' + KEYSPACE + '.' + table + ' ("user" varchar(36) NOT NULL, time timestamptz(3) NOT NULL, item varchar(36) NOT NULL, type varchar(500) NOT NULL, visibility varchar(50), from_follow varchar(36))');
    indexes.push('CREATE INDEX ' + table + '_user_idx ON ' + KEYSPACE + '.' + table + ' ("user")');
    indexes.push('CREATE INDEX ' + table + '_item_idx ON ' + KEYSPACE + '.' + table + ' ("item")');
    indexes.push('CREATE INDEX ' + table + '_time_idx ON ' + KEYSPACE + '.' + table + ' ("time")');
    indexes.push('CREATE INDEX ' + table + '_from_follow_idx ON ' + KEYSPACE + '.' + table + ' ("from_follow")');
  });

  return {
    tables: tables,
    indexes: indexes
  };
}

function setup (client, keyspace, truncateIfExists, next) {

  if (!next) { next = truncateIfExists; truncateIfExists = false; }

  var options = defineTablesAndIndexes(keyspace);
  options.KEYSPACE = keyspace;

  var helpers = require('./helpers')(client, options);

  async.series([
    helpers.dropKeyspace,
    helpers.createKeyspace,
    helpers.createTables,
    helpers.createSecondaryIndexes,
    async.apply(helpers.initialiseSchemaVersion, schemaVersion)
  ], function (err, data) {
    /* istanbul ignore if */
    if (err) return next(err);
    next();
  });
}

module.exports = setup;
