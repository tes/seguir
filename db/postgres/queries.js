var st = require('string-template');
var queries = {};

/**
 * Definitions of queries are referenced in the structure documentation in ../setup/index
 * They exist here so they can be kept up to date with the queries;
 */

/**
 * @apiDefine ExampleCqlAccounts
 * @apiExample {cql} Insert Account
 *    INSERT INTO {KEYSPACE}.accounts (account, name, isadmin, enabled) VALUES(?, ?, ?, ?)
 */
queries.upsertAccount = 'INSERT INTO {KEYSPACE}.accounts (account, name, isadmin, enabled) VALUES ($1, $2, $3, $4)';
queries.selectAccounts = 'SELECT account, name, isadmin, enabled FROM {KEYSPACE}.accounts';
queries.selectAccount = 'SELECT account, name, isadmin, enabled FROM {KEYSPACE}.accounts WHERE account = $1';
queries.selectAccountByName = 'SELECT account, name, isadmin, enabled FROM {KEYSPACE}.accounts WHERE name = $1';
queries.updateAccount = 'UPDATE {KEYSPACE}.accounts SET name = $1, isadmin = $2, enabled = $3 WHERE account = $4';

/**
 * @apiDefine ExampleCqlAccountUsers
 * @apiExample {cql} Insert Account User
 *    INSERT INTO {KEYSPACE}.accounts (account, name, isadmin, enabled) VALUES(?, ?, ?, ?)
 */
queries.upsertAccountUser = 'INSERT INTO {KEYSPACE}.account_users (account, username, password, enabled) VALUES($1, $2, $3, $4)';
queries.selectAccountUsers = 'SELECT account, username, enabled FROM {KEYSPACE}.account_users WHERE account = $1';
queries.selectAccountUserByName = 'SELECT account, username, password, enabled FROM {KEYSPACE}.account_users WHERE username = $1';
queries.updateAccountUser = 'UPDATE {KEYSPACE}.account_users SET password = $1, enabled = $2 WHERE account = $3 AND username = $4';

/**
 * @apiDefine ExampleCqlApplications
 * @apiExample {cql} Insert Application
 *    INSERT INTO seguir.applications (account, name, appid, appsecret, enabled) VALUES(?, ?, ?, ?, ?)
 * @apiExample {cql} Check Application
 *    SELECT application, name FROM seguir.applications WHERE key = ?
 */
queries.upsertApplication = 'INSERT INTO {KEYSPACE}.applications (account, name, appkeyspace, appid, appsecret, enabled) VALUES($1, $2, $3, $4, $5, $6)';
queries.checkApplication = 'SELECT account, name, appkeyspace, appid, appsecret, enabled FROM {KEYSPACE}.applications WHERE appid = $1';
queries.selectApplications = 'SELECT account, name, appkeyspace, appid, appsecret, enabled FROM {KEYSPACE}.applications WHERE account = $1';
queries.updateApplication = 'UPDATE {KEYSPACE}.applications SET name = $1, enabled = $2 WHERE appid = $3';
queries.updateApplicationSecret = 'UPDATE {KEYSPACE}.applications SET appsecret = $1 WHERE appid = $2';

/**
 * @apiDefine ExampleCqlApplicationTokens
 */
queries.upsertApplicationToken = 'INSERT INTO {KEYSPACE}.application_tokens (appid, appkeyspace, tokenid, tokensecret, enabled) VALUES($1, $2, $3, $4, $5)';
queries.checkApplicationToken = 'SELECT appid, appkeyspace, tokenid, tokensecret, enabled FROM {KEYSPACE}.application_tokens WHERE tokenid = $1';
queries.selectApplicationTokens = 'SELECT appid, appkeyspace, tokenid, tokensecret, enabled FROM {KEYSPACE}.application_tokens WHERE appid = $1';
queries.updateApplicationToken = 'UPDATE {KEYSPACE}.application_tokens SET enabled = $1 WHERE tokenid = $2';
queries.removeApplicationToken = 'DELETE FROM {KEYSPACE}.application_tokens WHERE tokenid=$1';

/**
 * @apiDefine ExampleCqlUsers
 * @apiExample {cql} Insert User
 *    INSERT INTO seguir.users (user, username) VALUES(?, ?)
 * @apiExample {cql} Select User
 *    SELECT user, username FROM seguir.users WHERE user = ?
 * @apiExample {cql} Select User by Name
 *    SELECT user, username FROM seguir.users WHERE username = ?
 */
queries.upsertUser = 'INSERT INTO {KEYSPACE}.users ("user", username, altid, userdata) VALUES($1, $2, $3, $4);';
queries.selectUser = 'SELECT "user", username, altid, userdata FROM {KEYSPACE}.users WHERE "user" = $1';
queries.selectUserByUsername = 'SELECT "user", username, altid, userdata FROM {KEYSPACE}.users WHERE username = $1';
queries.selectUserByAltId = 'SELECT "user", username, altid, userdata FROM {KEYSPACE}.users WHERE altid = $1';
queries.updateUser = 'UPDATE {KEYSPACE}.users SET username = $1, altid = $2, userdata = $3 WHERE "user" = $4';

/**
 * @apiDefine ExampleCqlPosts
 * @apiExample {cql} Insert Post
 *    INSERT INTO seguir.posts (post, user, content, posted) VALUES($1, $2, $3, $4)
 * @apiExample {cql} Select Post
 *    SELECT post, content, user, posted FROM seguir.posts WHERE post = ?
 */
queries.selectPost = 'SELECT p.post, p.content, p.content_type, p."user", u.altid as user_altid, u.username as user_username, u.userdata as user_userdata, p.posted, p.isprivate, p.ispersonal FROM {KEYSPACE}.posts p, {KEYSPACE}.users u where u.user = p.user AND p.post = $1';
queries.upsertPost = 'INSERT INTO {KEYSPACE}.posts (post, "user", content, content_type, posted, isprivate, ispersonal) VALUES($1, $2, $3, $4, $5, $6, $7);';
queries.removePost = 'DELETE FROM {KEYSPACE}.posts WHERE post = $1';

/**
 * @apiDefine ExampleCqlFriends
 * @apiExample {cql} Insert Friend
 *    INSERT INTO seguir.friends (friend, user, user_friend, since) VALUES(?, ?, ?, ?)
 * @apiExample {cql} Select Friend
 *    SELECT friend, user, user_friend, since FROM seguir.friends WHERE friend = ?
 * @apiExample {cql} Select Friends
 *    SELECT user_friend, since from seguir.friends WHERE user = ?
 * @apiExample {cql} Remove Friend
 *    DELETE FROM {KEYSPACE}.friends WHERE friend = ?
 */
queries.upsertFriend = 'INSERT INTO {KEYSPACE}.friends (friend, "user", user_friend, since) VALUES($1, $2, $3, $4)';
queries.selectFriend = 'SELECT f.friend, f."user", u.altid as user_altid, u.username as user_username, u.userdata as user_userdata, f.user_friend, uf.altid as user_friend_altid, uf.username as user_friend_username, uf.userdata as user_friend_userdata, f.since FROM {KEYSPACE}.friends f, {KEYSPACE}.users u, {KEYSPACE}.users uf WHERE f.user = u.user AND f.user_friend = uf.user AND f.friend = $1';
queries.selectFriends = 'SELECT user_friend, since from {KEYSPACE}.friends WHERE "user" = $1';
queries.removeFriend = 'DELETE FROM {KEYSPACE}.friends WHERE "user" = $1 AND user_friend=$2';
queries.isFriend = 'SELECT friend, since from {KEYSPACE}.friends WHERE "user" = $1 AND user_friend = $2';

/**
 * @apiDefine ExampleCqlFriendRequests
 * @apiExample {cql} Insert Friend Request
 *    INSERT INTO seguir.friend_request (friend_request, user, user_friend, message, time) VALUES(?, ?, ?, ?)
 */
queries.upsertFriendRequest = 'INSERT INTO {KEYSPACE}.friend_request (friend_request, "user", user_friend, message, since) VALUES($1, $2, $3, $4, $5)';
queries.selectFriendRequest = 'SELECT fr.friend_request, fr."user", u.altid as user_altid, u.username as user_username, u.userdata as user_userdata, fr.user_friend, uf.altid as user_friend_altid, uf.username as user_friend_username, uf.userdata as user_friend_userdata, fr.message, fr.since FROM {KEYSPACE}.friend_request fr, {KEYSPACE}.users u, {KEYSPACE}.users uf WHERE fr.user = u.user AND fr.user_friend = uf.user AND fr.friend_request = $1';
queries.selectIncomingFriendRequests = 'SELECT fr.friend_request, fr."user", u.altid as user_altid, u.username as user_username, u.userdata as user_userdata, fr.user_friend, uf.altid as user_friend_altid, uf.username as user_friend_username, uf.userdata as user_friend_userdata, fr.message, fr.since FROM {KEYSPACE}.friend_request fr, {KEYSPACE}.users u, {KEYSPACE}.users uf WHERE fr.user = u.user AND fr.user_friend = uf.user AND fr.user_friend = $1';
queries.selectOutgoingFriendRequests = 'SELECT fr.friend_request, fr."user", u.altid as user_altid, u.username as user_username, u.userdata as user_userdata, fr.user_friend, uf.altid as user_friend_altid, uf.username as user_friend_username, uf.userdata as user_friend_userdata, fr.message, fr.since FROM {KEYSPACE}.friend_request fr, {KEYSPACE}.users u, {KEYSPACE}.users uf WHERE fr.user = u.user AND fr.user_friend = uf.user AND fr."user" = $1';
queries.acceptFriendRequest = 'DELETE FROM {KEYSPACE}.friend_request WHERE friend_request = $1';

/**
 * @apiDefine ExampleCqlFollows
 * @apiExample {cql} Insert Follow
 *    INSERT INTO seguir.followers (follow, user, user_follower, since) VALUES(?, ?, ?, ?);
 * @apiExample {cql} Select Follow
 *    SELECT follow, user, user_follower, since FROM seguir.followers WHERE follow = ?
 * @apiExample {cql} Select Followers
 *    SELECT user, user_follower, since from seguir.followers WHERE user = ?
 * @apiExample {cql} Remove Follow
 *    DELETE FROM {KEYSPACE}.followers WHERE follow = ?
 */
queries.upsertFollower = 'INSERT INTO {KEYSPACE}.followers (follow, "user", user_follower, since, isprivate, ispersonal) VALUES($1, $2, $3, $4, $5, $6);';
queries.selectFollow = 'SELECT f.follow, f."user", u.altid as user_altid, u.username as user_username, u.userdata as user_userdata, f.user_follower, uf.altid as user_follower_altid, uf.username as user_follower_username, uf.userdata as user_follower_userdata, f.since, f.isprivate, f.ispersonal FROM {KEYSPACE}.followers f, {KEYSPACE}.users u, {KEYSPACE}.users uf WHERE f.user = u.user AND f.user_follower = uf.user AND f.follow = $1';
queries.selectFollowers = 'SELECT f.follow, f."user", u.altid as user_altid, u.username as user_username, u.userdata as user_userdata, f.user_follower, uf.altid as user_follower_altid, uf.username as user_follower_username, uf.userdata as user_follower_userdata, f.since, f.isprivate, f.ispersonal FROM {KEYSPACE}.followers f, {KEYSPACE}.users u, {KEYSPACE}.users uf WHERE f.user = u.user AND f.user_follower = uf.user AND f."user" = $1';
queries.removeFollower = 'DELETE FROM {KEYSPACE}.followers WHERE "user" = $1 AND user_follower = $2';
queries.isFollower = 'SELECT follow, since, isprivate, ispersonal from {KEYSPACE}.followers WHERE "user" = $1 AND user_follower = $2';

/**
 * @apiDefine ExampleCqlLikes
 * @apiExample {cql} Insert Like
 *    INSERT INTO seguir.likes (like, user, item, since) VALUES(?, ?, ?, ?);
 * @apiExample {cql} Select Like
 *    SELECT like, item, user, since FROM seguir.likes WHERE like = ?
 * @apiExample {cql} Check Like
 *    SELECT like, user, since FROM seguir.likes WHERE user = ? AND item = ?
 * @apiExample {cql} Remove Like
 *    DELETE FROM {KEYSPACE}.likes WHERE like = ?
 */
queries.upsertLike = 'INSERT INTO {KEYSPACE}.likes ("like", "user", item, since) VALUES($1, $2, $3, $4);';
queries.selectLike = 'SELECT "like", item, "user", since FROM {KEYSPACE}.likes WHERE "like" = $1';
queries.checkLike = 'SELECT "like", "user", since FROM {KEYSPACE}.likes WHERE "user" = $1 AND item = $2';
queries.removeLike = 'DELETE FROM {KEYSPACE}.likes WHERE "user" = $1 AND item = $2';

/**
 * @apiDefine ExampleCqlFeed
 * @apiExample {cql} Insert Feed Item
 *    INSERT INTO seguir.userline (user, item, type, time) VALUES(?, ?, ?, ?);
 * @apiExample {cql} Select Feed
 *    SELECT user, time, dateOf(time) AS date, item, type FROM seguir.userline WHERE user = ? {privateClause}{timeClause} LIMIT {limit}
 * @apiExample {cql} Remove Item from feed)
 *    DELETE FROM {KEYSPACE}.userline WHERE user = ? AND item = ?
 */
queries.upsertUserTimeline = 'INSERT INTO {KEYSPACE}.{TIMELINE} ("user", item, type, time, isprivate, ispersonal) VALUES($1, $2, $3, $4, $5, $6);';
queries.selectTimeline = 'SELECT "user", time, time as date, item, type, isprivate, ispersonal FROM {KEYSPACE}.{TIMELINE} WHERE "user" = $1{timeClause} ORDER BY time DESC {limitClause}';
queries.removeFromTimeline = 'DELETE FROM {KEYSPACE}.{TIMELINE} WHERE "user" = $1 AND time = $2';
queries.selectAllItems = 'SELECT "user", time FROM {KEYSPACE}.{TIMELINE} WHERE item = $1';
queries.timelineLimit = ' LIMIT {limit} OFFSET 0';
queries.timelineSortReverse = ' AND time > $2';
queries.timelineSort = ' AND time < $2';

module.exports = function (keyspace, name, data) {
  data = data || {};
  data.KEYSPACE = keyspace; // Keyspace important and so explicit in method call
  return st(queries[name], data);
};
