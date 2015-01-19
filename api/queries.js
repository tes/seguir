var st = require("string-template");
var queries = {};

/**
 * Definitions of queries are referenced in the structure documentation in ../setup/index
 * They exist here so they can be kept up to date with the queries;
 */

/**
 * @apiDefine ExampleCqlApplications
 * @apiExample {cql} Insert Application
 *    INSERT INTO seguir.applications (application, key, name) VALUES(?, ?, ?)
 * @apiExample {cql} Check Application Key
 *    SELECT application, name FROM seguir.applications WHERE key = ?
 */
queries.upsertApplication = 'INSERT INTO {KEYSPACE}.applications (application, key, name) VALUES(?, ?, ?)';
queries.checkApplicationKey = 'SELECT application, name FROM {KEYSPACE}.applications WHERE key = ?';

/**
 * @apiDefine ExampleCqlUsers
 * @apiExample {cql} Insert User
 *    INSERT INTO seguir.users (user, username) VALUES(?, ?)
 * @apiExample {cql} Select User
 *    SELECT user, username FROM seguir.users WHERE user = ?
 * @apiExample {cql} Select User by Name
 *    SELECT user, username FROM seguir.users WHERE username = ?
 */
queries.upsertUser = 'INSERT INTO {KEYSPACE}.users (user, username) VALUES(?, ?);';
queries.selectUser = 'SELECT user, username FROM {KEYSPACE}.users WHERE user = ?';
queries.selectUserByUsername = 'SELECT user, username FROM {KEYSPACE}.users WHERE username = ?';

/**
 * @apiDefine ExampleCqlPosts
 * @apiExample {cql} Insert Post
 *    INSERT INTO seguir.posts (post, user, content, posted) VALUES(?, ?, ?, ?)
 * @apiExample {cql} Select Post
 *    SELECT post, content, user, posted FROM seguir.posts WHERE post = ?
 */
queries.selectPost = 'SELECT post, content, user, posted FROM {KEYSPACE}.posts WHERE post = ?';
queries.upsertPost = 'INSERT INTO {KEYSPACE}.posts (post, user, content, posted) VALUES(?, ?, ?, ?);';

/**
 * @apiDefine ExampleCqlFriends
 * @apiExample {cql} Insert Friend
 *    INSERT INTO seguir.friends (friend, user, user_friend, since) VALUES(?, ?, ?, ?)
 * @apiExample {cql} Select Friend
 *    SELECT friend, user, user_friend, since FROM seguir.friends WHERE friend = ?
 * @apiExample {cql} Select Friends
 *    SELECT user_friend, since from seguir.friends WHERE user = ?
 */
queries.upsertFriend = 'INSERT INTO {KEYSPACE}.friends (friend, user, user_friend, since) VALUES(?, ?, ?, ?)';
queries.selectFriend = 'SELECT friend, user, user_friend, since FROM {KEYSPACE}.friends WHERE friend = ?';
queries.selectFriends = 'SELECT user_friend, since from {KEYSPACE}.friends WHERE user = ?';

/**
 * @apiDefine ExampleCqlFriendRequests
 * @apiExample {cql} Insert Friend Request
 *    INSERT INTO seguir.friend_request (friend_request, user, user_friend, message, time) VALUES(?, ?, ?, ?)
 */
queries.upsertFriendRequest = 'INSERT INTO {KEYSPACE}.friend_request (friend, user, user_friend, since) VALUES(?, ?, ?, ?)';

/**
 * @apiDefine ExampleCqlFollows
 * @apiExample {cql} Insert Follow
 *    INSERT INTO seguir.followers (follow, user, user_follower, since) VALUES(?, ?, ?, ?);
 * @apiExample {cql} Select Follow
 *    SELECT follow, user, user_follower, since FROM seguir.followers WHERE follow = ?
 * @apiExample {cql} Select Followers
 *    SELECT user_follower, since from seguir.followers WHERE user = ?
 */
queries.upsertFollower = 'INSERT INTO {KEYSPACE}.followers (follow, user, user_follower, since) VALUES(?, ?, ?, ?);';
queries.selectFollow = 'SELECT follow, user, user_follower, since FROM {KEYSPACE}.followers WHERE follow = ?';
queries.selectFollowers = 'SELECT user_follower, since from {KEYSPACE}.followers WHERE user = ?';

/**
 * @apiDefine ExampleCqlLikes
 * @apiExample {cql} Insert Like
 *    INSERT INTO seguir.likes (like, user, item, since) VALUES(?, ?, ?, ?);
 * @apiExample {cql} Select Like
 *    SELECT like, item, user, since FROM seguir.likes WHERE like = ?
 * @apiExample {cql} Check Like
 *    SELECT like, user, since FROM seguir.likes WHERE user = ? AND item = ?
 */
queries.upsertLike = 'INSERT INTO {KEYSPACE}.likes (like, user, item, since) VALUES(?, ?, ?, ?);';
queries.selectLike = 'SELECT like, item, user, since FROM {KEYSPACE}.likes WHERE like = ?';
queries.checkLike = 'SELECT like, user, since FROM {KEYSPACE}.likes WHERE user = ? AND item = ?';

/**
 * @apiDefine ExampleCqlFeed
 * @apiExample {cql} Insert Feed Item
 *    INSERT INTO seguir.userline (user, item, type, time) VALUES(?, ?, ?, ?);
 * @apiExample {cql} Select Feed
 *    SELECT user, time, dateOf(time) AS date, item, type FROM seguir.userline WHERE user = ? {timeClause} LIMIT {limit}
 */
queries.upsertUserTimeline = 'INSERT INTO {KEYSPACE}.userline (user, item, type, time) VALUES(?, ?, ?, ?);';
queries.selectTimeline = 'SELECT user, time, dateOf(time) AS date, item, type FROM {KEYSPACE}.userline WHERE user = ? {timeClause} LIMIT {limit}';

module.exports = function(keyspace) {
  return function(name, data) {
    data = data || {};
    data.KEYSPACE = data.KEYSPACE || keyspace;
    return st(queries[name], data);
  }
}
