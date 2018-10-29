const async = require('async');
const _ = require('lodash');
const schemaVersion = 8;

const defineTablesAndIndexes = (KEYSPACE) => {
  const tables = [];
  const indexes = [];
  let tableIndexes = [];

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
  tableIndexes = _.concat(tableIndexes, ['schema_version.description', 'schema_version.version', 'schema_version.applied']);

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
  tableIndexes = _.concat(tableIndexes, ['users.altid', 'users.userdata', 'users.user', 'users.username', 'users.username']);

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
   * @apiParam {String} altid Optional altid for the post
   * @apiUse ExampleCqlPosts
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.posts (post uuid PRIMARY KEY, user uuid, type text, content text, content_type text, visibility text, posted timestamp, altid text)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.posts(user)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.posts(altid)');
  tableIndexes = _.concat(tableIndexes, ['posts.content', 'posts.content_type', 'posts.posted', 'posts.type', 'posts.visibility', 'posts.post', 'posts.user', 'posts.altid']);

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
  tableIndexes = _.concat(tableIndexes, ['friends.since', 'friends.visibility', 'friends.user', 'friends.user_friend', 'friends.friend']);

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
  tableIndexes = _.concat(tableIndexes, ['friend_request.message', 'friend_request.since', 'friend_request.visibility', 'friend_request.friend_request', 'friend_request.user', 'friend_request.user_friend']);

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
  tableIndexes = _.concat(tableIndexes, ['likes.since', 'likes.visibility', 'likes.like', 'likes.user', 'likes.item']);

  /**
   * @api {table} Follower Follower
   * @apiName FollowerData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores follower data from one user to another, this is not necessarily reciprocal, and does not require approval.
   * @apiParam {Guid} follow The unique guid for the follower relationship.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {Guid} user_follower The unique guid for the user following.
   * @apiParam {String} visibility Visibility level of follow
   * @apiParam {Timestamp} since The date the follow began.
   * @apiUse ExampleCqlFollows
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.followers (follow uuid, user uuid, user_follower uuid, visibility text, since timestamp, PRIMARY KEY (user, user_follower))');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.followers(follow)');
  tableIndexes = _.concat(tableIndexes, ['followers.follow', 'followers.since', 'followers.visibility', 'followers.followers', 'followers.user', 'followers.user_follower']);

  /**
   * @api {table} Follower Timeline
   * @apiName FollowerData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores follower data from one user to another, this is not necessarily reciprocal, and does not require approval.
   * @apiParam {Guid} follow The unique guid for the follower relationship.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {Guid} user_follower The unique guid for the user following.
   * @apiParam {String} visibility Visibility level of follow
   * @apiParam {Timeuuid} since The date the follow began.
   * @apiUse ExampleCqlFollows
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.followers_timeline (follow uuid, user uuid, user_follower uuid, is_private boolean, is_personal boolean, is_public boolean, time timeuuid, since timestamp, PRIMARY KEY (user, time)) WITH CLUSTERING ORDER BY (time DESC)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.followers_timeline(follow)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.followers_timeline(user_follower)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.followers_timeline(is_private)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.followers_timeline(is_public)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.followers_timeline(is_personal)');
  tableIndexes = _.concat(tableIndexes, ['followers_timeline.since', 'followers_timeline.user', 'followers_timeline.time', 'followers_timeline.follow', 'followers_timeline.user_follower', 'followers_timeline.is_private', 'followers_timeline.is_public', 'followers_timeline.is_personal']);

  /**
   * @api {table} Following Timeline
   * @apiName FollowingData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores following data from one user to another, this is not necessarily reciprocal, and does not require approval.
   * @apiParam {Guid} follow The unique guid for the following relationship.
   * @apiParam {Guid} user_follower The unique guid for the user following.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {String} visibility Visibility level of follow
   * @apiParam {Timeuuid} since The date the follow began.
   * @apiUse ExampleCqlFollows
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.following_timeline (follow uuid, user_follower uuid, user uuid, is_private boolean, is_personal boolean, is_public boolean, time timeuuid, since timestamp, PRIMARY KEY (user_follower, time)) WITH CLUSTERING ORDER BY (time DESC)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.following_timeline(follow)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.following_timeline(user)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.following_timeline(is_private)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.following_timeline(is_public)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.following_timeline(is_personal)');
  tableIndexes = _.concat(tableIndexes, ['following_timeline.since', 'following_timeline.user', 'following_timeline.time', 'following_timeline.follow', 'following_timeline.user_follower', 'following_timeline.is_private', 'following_timeline.is_public', 'following_timeline.is_personal']);

  /**
   * Counts are stored in a separate table and incremented / decremented when events occur - this is to avoid counting queries.
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.counts (item text, type text, count counter, PRIMARY KEY (item, type))');
  tableIndexes = _.concat(tableIndexes, ['counts.item', 'counts.type', 'counts.count']);

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
  const feedTables = ['feed_timeline', 'user_timeline'];

  feedTables.forEach(table => {
    tables.push('CREATE TABLE ' + KEYSPACE + '.' + table + ' (user uuid, time timeuuid, item uuid, type text, visibility text, from_follow uuid, PRIMARY KEY (user, time)) WITH CLUSTERING ORDER BY (time DESC)');
    indexes.push('CREATE INDEX ON ' + KEYSPACE + '.' + table + '(item)');
    indexes.push('CREATE INDEX ON ' + KEYSPACE + '.' + table + '(from_follow)');
    indexes.push('CREATE INDEX ON ' + KEYSPACE + '.' + table + '(type)');
    tableIndexes = _.concat(tableIndexes, [table + '.item', table + '.type', table + '.from_follow', table + '.visibility', table + '.user', table + '.time']);
  });

  return {
    tables,
    indexes,
    tableIndexes,
  };
};

const setup = (client, keyspace, truncateIfExists, next) => {
  if (!next) { next = truncateIfExists; truncateIfExists = false; }

  const options = defineTablesAndIndexes(keyspace);
  options.KEYSPACE = keyspace;

  const helpers = require('./helpers')(client, options);

  if (truncateIfExists) {
    return helpers.truncate(next);
  }

  async.series([
    helpers.dropKeyspace,
    helpers.createKeyspace,
    helpers.createTables,
    helpers.createSecondaryIndexes,
    helpers.flushCache,
    helpers.waitForIndexes,
    async.apply(helpers.initialiseSchemaVersion, schemaVersion),
  ], (err, data) => {
    /* istanbul ignore if */
    if (err) return next(err);
    next();
  });
};

module.exports = setup;
