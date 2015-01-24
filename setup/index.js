var client = require('../api/db/client')();
var async = require('async');
var KEYSPACE = 'seguir';
var verbose = false;
var tables = [], indexes = [];

function createTablesAndIndexes() {
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
  tables.push('CREATE TABLE ' + KEYSPACE + '.users (user uuid PRIMARY KEY, username text)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.users(username)');

  /**
   * @api {table} Applications Applications
   * @apiName ApplicationData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores an application name and token to allow / disallow a client application access to seguir.
   * @apiParam {String} apptoken The key used to gain access.
   * @apiParam {String} name The name of the application (for reference).
   * @apiParam {String} PK Primary key is compound on application + key.
   * @apiUse ExampleCqlApplications
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.applications (name text, apptoken uuid, PRIMARY KEY (name, apptoken))');

  /**
   * @api {table} Posts Posts
   * @apiName PostsData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores posts that a user (or application) make to a users timeline.
   * @apiParam {Guid} post The unique guid for the post.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {String} content The content of the post.
   * @apiParam {Boolean} isprivate Is the post only for friends.
   * @apiParam {Timestamp} posted The date the post was made.
   * @apiUse ExampleCqlPosts
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.posts (post uuid PRIMARY KEY, user uuid, content text, isprivate boolean, posted timestamp)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.posts(user)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.posts(isprivate)');

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
  tables.push('CREATE TABLE ' + KEYSPACE + '.friends (friend uuid, user uuid, user_friend uuid, since timestamp, PRIMARY KEY (user, user_friend))');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.friends(friend)');

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
  tables.push('CREATE TABLE ' + KEYSPACE + '.friend_request (friend_request uuid, user uuid, user_friend uuid, message text, time timeuuid, PRIMARY KEY (user, user_friend)) WITH CLUSTERING ORDER BY (time DESC)');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.friend_request(friend_request)');

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
  tables.push('CREATE TABLE ' + KEYSPACE + '.likes (like uuid, user uuid, item text, since timestamp, PRIMARY KEY (user, item))');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.likes(like)');

  /**
   * @api {table} Follower Follower
   * @apiName FollowerData
   * @apiGroup Data
   * @apiVersion 1.0.0
   * @apiDescription Stores follower data from one user to another, this is not necessarily reciprocal, and does not require approval.
   * @apiParam {Guid} follow The unique guid for the follower relationship.
   * @apiParam {Guid} user The unique guid for the user.
   * @apiParam {Guid} user_follower The unique guid for the user they are following.
   * @apiParam {Timestamp} since The date the follow began.
   * @apiUse ExampleCqlFollows
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.followers (follow uuid, user uuid, user_follower uuid, since timestamp, PRIMARY KEY (user, user_follower))');
  indexes.push('CREATE INDEX ON ' + KEYSPACE + '.followers(follow)');

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
   * @apiParam {Boolean} isprivate Is this event private and only visible if the user is a friend.
   * @apiUse ExampleCqlFeed
   */
  tables.push('CREATE TABLE ' + KEYSPACE + '.userline (user uuid, time timeuuid, item uuid, type text, isprivate boolean, PRIMARY KEY (user, time, isprivate)) WITH CLUSTERING ORDER BY (time DESC, isprivate ASC)');

}

/**
 *  Setup code follows below
 */

/* istanbul ignore next */
function dropKeyspace(next) {
  if(verbose) console.log('Dropping keyspace: ' + KEYSPACE + '...');
  client.execute('DROP KEYSPACE ' + KEYSPACE, function(err) {
    if(err && err.code === 8960) { return next(); }
    return next(err);
  });
}

/* istanbul ignore next */
function createKeyspace(next) {
  if(verbose) console.log('Creating keyspace: ' + KEYSPACE + '...');
  client.execute('CREATE KEYSPACE IF NOT EXISTS ' + KEYSPACE + ' WITH replication ' +
                '= {\'class\' : \'SimpleStrategy\', \'replication_factor\' : 3};', next);
}

/* istanbul ignore next */
function createTables(next) {

  if(verbose) console.log('Creating tables in: ' + KEYSPACE + '...');

  async.map(tables, function(cql, cb) {
    if(verbose) console.log(cql);
    client.execute(cql, function(err) {
      if(err && (err.code == 9216 || err.code == 8704)) { // Already exists
        return cb();
      }
      return cb(err);
    });
  }, next);

}

/* istanbul ignore next */
function createSecondaryIndexes(next) {

  if(verbose) console.log('Creating secondary indexes in: ' + KEYSPACE + '...');
  async.map(indexes, function(cql, cb) {
    if(verbose) console.log(cql);
    client.execute(cql, function(err) {
      if(err && (err.code == 9216 || err.code == 8704)) { // Already exists
        return cb();
      }
      return cb(err);
    });
  }, next);

}

/* istanbul ignore if */
if(require.main === module) {
  verbose = true;
  setup(null, function() {
    console.dir('Setup complete.');
    client.shutdown();
  });
}

function setup(specificKeyspace, next) {

  /* istanbul ignore else */
  if(specificKeyspace) { KEYSPACE = specificKeyspace};

  createTablesAndIndexes();

  async.series([
    dropKeyspace,
    createKeyspace,
    createTables,
    createSecondaryIndexes
  ], function(err, data) {
    /* istanbul ignore if */
    if(err) console.dir(err);
    next();
  });
}

module.exports = setup;
