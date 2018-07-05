var st = require('string-template');
var queries = {};

module.exports = function (keyspace, name, data) {
  data = data || {};
  data.KEYSPACE = keyspace; // Keyspace important and so explicit in method call
  return st(queries[name] || '', data);
};

/**
 * Definitions of queries are referenced in the structure documentation in ../setup/index
 * They exist here so they can be kept up to date with the queries;
 */
queries.insertSchemaVersion = 'INSERT INTO {KEYSPACE}.schema_version (version, applied, description) VALUES (?, ?, ?)';
queries.selectSchemaVersions = 'SELECT version, applied FROM {KEYSPACE}.schema_version';

/**
 * @apiDefine ExampleCqlAccounts
 * @apiExample {cql} Insert Account
 *    INSERT INTO {KEYSPACE}.accounts (account, name, isadmin, enabled) VALUES(?, ?, ?, ?)
 */
queries.upsertAccount = 'INSERT INTO {KEYSPACE}.accounts (account, name, isadmin, enabled) VALUES(?, ?, ?, ?)';
queries.selectAccounts = 'SELECT account, name, isadmin, enabled FROM {KEYSPACE}.accounts';
queries.selectAccount = 'SELECT account, name, isadmin, enabled FROM {KEYSPACE}.accounts WHERE account = ?';
queries.selectAccountByName = 'SELECT account, name, isadmin, enabled FROM {KEYSPACE}.accounts WHERE name = ?';
queries.updateAccount = 'UPDATE {KEYSPACE}.accounts SET name = ?, isadmin = ?, enabled = ?  WHERE account = ?';

/**
 * @apiDefine ExampleCqlAccountUsers
 * @apiExample {cql} Insert Account User
 *    INSERT INTO {KEYSPACE}.accounts (account, name, isadmin, enabled) VALUES(?, ?, ?, ?)
 */
queries.upsertAccountUser = 'INSERT INTO {KEYSPACE}.account_users (account, username, password, enabled) VALUES(?, ?, ?, ?)';
queries.selectAccountUsers = 'SELECT account, username, enabled FROM {KEYSPACE}.account_users WHERE account = ?';
queries.selectAccountUserByName = 'SELECT account, username, password, enabled FROM {KEYSPACE}.account_users WHERE username = ?';
queries.updateAccountUser = 'UPDATE {KEYSPACE}.account_users SET password = ?, enabled = ?  WHERE account = ? AND username = ?';

/**
 * @apiDefine ExampleCqlApplications
 * @apiExample {cql} Insert Application
 *    INSERT INTO seguir.applications (account, name, appid, appsecret, enabled) VALUES(?, ?, ?, ?, ?)
 * @apiExample {cql} Check Application
 *    SELECT application, name FROM seguir.applications WHERE key = ?
 */
queries.upsertApplication = 'INSERT INTO {KEYSPACE}.applications (account, name, appkeyspace, appid, enabled) VALUES(?, ?, ?, ?, ?)';
queries.checkApplication = 'SELECT account, name, appkeyspace, appid, enabled FROM {KEYSPACE}.applications WHERE appid = ?';
queries.selectApplications = 'SELECT account, name, appkeyspace, appid, enabled FROM {KEYSPACE}.applications WHERE account = ?';
queries.updateApplication = 'UPDATE {KEYSPACE}.applications SET name = ?, enabled = ? WHERE appid = ?';

/**
 * @apiDefine ExampleCqlApplicationTokens
 */
queries.upsertApplicationToken = 'INSERT INTO {KEYSPACE}.application_tokens (appid, appkeyspace, tokenid, tokensecret, description, enabled) VALUES(?, ?, ?, ?, ?, ?)';
queries.checkApplicationToken = 'SELECT appid, appkeyspace, tokenid, tokensecret, description, enabled FROM {KEYSPACE}.application_tokens WHERE tokenid = ?';
queries.selectApplicationTokens = 'SELECT appid, appkeyspace, tokenid, tokensecret, description, enabled FROM {KEYSPACE}.application_tokens WHERE appid = ?';
queries.updateApplicationToken = 'UPDATE {KEYSPACE}.application_tokens SET enabled = ?, description = ? WHERE tokenid = ?';
queries.updateApplicationTokenSecret = 'UPDATE {KEYSPACE}.application_tokens SET tokensecret = ? WHERE tokenid = ?';
queries.removeApplicationToken = 'DELETE FROM {KEYSPACE}.application_tokens WHERE tokenid = ?';

/**
 * @apiDefine ExampleCqlUsers
 * @apiExample {cql} Insert User
 *    INSERT INTO seguir.users (user, username) VALUES(?, ?)
 * @apiExample {cql} Select User
 *    SELECT user, username FROM seguir.users WHERE user = ?
 * @apiExample {cql} Select User by Name
 *    SELECT user, username FROM seguir.users WHERE username = ?
 */
queries.upsertUser = 'INSERT INTO {KEYSPACE}.users (user, username, altid, userdata) VALUES(?, ?, ?, ?);';
queries.selectUser = 'SELECT user, username, altid, userdata FROM {KEYSPACE}.users WHERE user = ?';
queries.selectUserByUsername = 'SELECT user, username, altid, userdata FROM {KEYSPACE}.users WHERE username = ?';
queries.selectUserByAltId = 'SELECT user, username, altid, userdata FROM {KEYSPACE}.users WHERE altid = ?';
queries.updateUser = 'UPDATE {KEYSPACE}.users SET username = ?, altid = ?, userdata = ? WHERE user = ?';
queries.removeUser = 'DELETE FROM {KEYSPACE}.users WHERE user = ?';

/**
 * @apiDefine ExampleCqlPosts
 * @apiExample {cql} Insert Post
 *    INSERT INTO seguir.posts (post, user, content, posted) VALUES(?, ?, ?, ?)
 * @apiExample {cql} Select Post
 *    SELECT post, content, user, posted FROM seguir.posts WHERE post = ?
 */
queries.selectPost = 'SELECT post, content, content_type, user, posted, visibility, altid FROM {KEYSPACE}.posts WHERE post = ?';
queries.selectPostByAltid = 'SELECT post, content, content_type, user, posted, visibility, altid FROM {KEYSPACE}.posts WHERE altid = ?';
queries.upsertPost = 'INSERT INTO {KEYSPACE}.posts (post, user, group, content, content_type, posted, visibility, altid) VALUES(?, ?, ?, ?, ?, ?, ?, ?);';
queries.removePost = 'DELETE FROM {KEYSPACE}.posts WHERE post=?';
queries.removePostByAltid = 'DELETE FROM {KEYSPACE}.posts WHERE altid=?';
queries.updatePost = 'UPDATE {KEYSPACE}.posts SET content = ?, content_type = ?, visibility = ? WHERE post = ?';
queries.updatePostByAltid = 'UPDATE {KEYSPACE}.posts SET content = ?, content_type = ?, visibility = ? WHERE altid = ?';

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
queries.upsertFriend = 'INSERT INTO {KEYSPACE}.friends (friend, user, user_friend, since, visibility) VALUES(?, ?, ?, ?, ?)';
queries.selectFriend = 'SELECT friend, user, user_friend, since, visibility FROM {KEYSPACE}.friends WHERE friend = ?';
queries.selectFriends = 'SELECT user_friend, since from {KEYSPACE}.friends WHERE user = ?';
queries.removeFriend = 'DELETE FROM {KEYSPACE}.friends WHERE user = ? AND user_friend=?';
queries.isFriend = 'SELECT friend, since from {KEYSPACE}.friends WHERE user = ? AND user_friend = ?';

/**
 * @apiDefine ExampleCqlFriendRequests
 * @apiExample {cql} Insert Friend Request
 *    INSERT INTO seguir.friend_request (friend_request, user, user_friend, message, time) VALUES(?, ?, ?, ?)
 */
queries.upsertFriendRequest = 'INSERT INTO {KEYSPACE}.friend_request (friend_request, user, user_friend, message, since, visibility) VALUES(?, ?, ?, ?, ?, ?)';
queries.selectFriendRequest = 'SELECT friend_request, user, user_friend, message, since, visibility FROM {KEYSPACE}.friend_request WHERE friend_request = ?';
queries.selectIncomingFriendRequests = 'SELECT friend_request, user, user_friend, message, since, visibility FROM {KEYSPACE}.friend_request WHERE user_friend = ?';
queries.selectOutgoingFriendRequests = 'SELECT friend_request, user, user_friend, message, since, visibility FROM {KEYSPACE}.friend_request WHERE user = ?';
queries.acceptFriendRequest = 'DELETE FROM {KEYSPACE}.friend_request WHERE friend_request = ?';

/**
 * @apiDefine ExampleCqlFollows
 * @apiExample {cql} Insert Follow
 *    INSERT INTO seguir.followers (follow, user, user_follower, since) VALUES(?, ?, ?, ?);
 * @apiExample {cql} Insert Follower Timeline
 *    INSERT INTO seguir.followers_timeline (follow, user, user_follower, since) VALUES(?, ?, ?, ?);
 * @apiExample {cql} Select Follow
 *    SELECT follow, user, user_follower, since FROM seguir.followers WHERE follow = ?
 * @apiExample {cql} Select Followers
 *    SELECT user, user_follower, since from seguir.followers WHERE user = ?
 * @apiExample {cql} Remove Follow
 *    DELETE FROM {KEYSPACE}.followers WHERE follow = ?
 */
queries.upsertFollower = 'INSERT INTO {KEYSPACE}.followers (follow, user, user_follower, since, visibility) VALUES(?, ?, ?, ?, ?);';
queries.upsertFollowerTimeline = 'INSERT INTO {KEYSPACE}.followers_timeline (follow, user, user_follower, time, since, is_private, is_personal, is_public) VALUES(?, ?, ?, ?, ?, ?, ?, ?);';
queries.upsertFollowingTimeline = 'INSERT INTO {KEYSPACE}.following_timeline (follow, user, user_follower, time, since, is_private, is_personal, is_public) VALUES(?, ?, ?, ?, ?, ?, ?, ?);';
queries.selectFollow = 'SELECT follow, user, user_follower, since, visibility FROM {KEYSPACE}.followers WHERE follow = ?';
queries.selectFollowFromTimeline = 'SELECT follow, user, user_follower, time FROM {KEYSPACE}.followers_timeline WHERE user = ? and user_follower = ?';
queries.selectFollowers = 'SELECT follow, user, user_follower, since, visibility from {KEYSPACE}.followers WHERE user = ?';
queries.selectFollowersTimeline = 'SELECT follow, user, user_follower, time from {KEYSPACE}.followers_timeline WHERE user = ? and {PRIVACY} = True';
queries.selectFollowingTimeline = 'SELECT follow, user_follower, user, time from {KEYSPACE}.following_timeline WHERE user_follower = ? and {PRIVACY} = True';
queries.removeFollower = 'DELETE FROM {KEYSPACE}.followers WHERE user = ? AND user_follower = ?';
queries.removeFollowerTimeline = 'DELETE FROM {KEYSPACE}.followers_timeline WHERE user = ? AND time = ?';
queries.removeFollowingTimeline = 'DELETE FROM {KEYSPACE}.following_timeline WHERE user_follower = ? AND time = ?';
queries.isFollower = 'SELECT follow, user, user_follower, since, visibility from {KEYSPACE}.followers WHERE user = ? AND user_follower = ?';
queries.selectFollowersCount = 'SELECT count FROM {KEYSPACE}.counts WHERE item = ? AND type = \'followers\'';
queries.selectFollowingCount = 'SELECT count FROM {KEYSPACE}.counts WHERE item = ? AND type = \'following\'';

/**
 * @apiDefine ExampleCqlCounts
 */
queries.updateCounter = 'UPDATE {KEYSPACE}.counts SET count = count + ? WHERE item = ? AND type = \'{TYPE}\'';
queries.selectCount = 'SELECT count FROM {KEYSPACE}.counts WHERE item = ? AND type = \'{TYPE}\'';

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
queries.upsertLike = 'INSERT INTO {KEYSPACE}.likes (like, user, item, since, visibility) VALUES(?, ?, ?, ?, ?);';
queries.selectLike = 'SELECT like, item, user, since, visibility FROM {KEYSPACE}.likes WHERE like = ?';
queries.checkLike = 'SELECT like, user, since, visibility FROM {KEYSPACE}.likes WHERE user = ? AND item = ?';
queries.removeLike = 'DELETE FROM {KEYSPACE}.likes WHERE user = ? AND item = ?';

/**
 * @apiDefine ExampleCqlFeed
 * @apiExample {cql} Insert Feed Item
 *    INSERT INTO seguir.userline (user, item, type, time) VALUES(?, ?, ?, ?);
 * @apiExample {cql} Select Feed
 *    SELECT user, time, dateOf(time) AS date, item, type FROM seguir.userline WHERE user = ?
 * @apiExample {cql} Remove Item from feed)
 *    DELETE FROM {KEYSPACE}.userline WHERE user = ? AND item = ?
 */
queries.upsertUserTimeline = 'INSERT INTO {KEYSPACE}.{TIMELINE} (user, item, type, time, visibility, from_follow) VALUES(?, ?, ?, ?, ?, ?);';
queries.selectTimeline = 'SELECT user, time, dateOf(time) AS date, item, type, visibility, from_follow FROM {KEYSPACE}.{TIMELINE} WHERE user = ? {TYPEQUERY} {OLDERTHANQUERY}';
queries.removeFromTimeline = 'DELETE FROM {KEYSPACE}.{TIMELINE} WHERE user = ? AND time = ?';
queries.selectAllItems = 'SELECT user, time FROM {KEYSPACE}.{TIMELINE} WHERE item = ?';
queries.selectAllFollowItems = 'SELECT user, time FROM {KEYSPACE}.{TIMELINE} WHERE from_follow = ?';
queries.typeQuery = 'AND type = ?';
queries.olderThanQuery = 'AND time <= ?';

/**
 * Get indexes
 */
queries.retrieveIndexes = 'SELECT columnfamily_name, column_name, index_name, index_options, index_type, component_index FROM system.schema_columns WHERE keyspace_name = ?';

/**
 * Groups
 */
queries.upsertGroup = 'INSERT INTO {KEYSPACE}.groups (group, groupdata, groupname, supergroupid) VALUES(?, ?, ?, ?);';
queries.updateGroup = 'UPDATE {KEYSPACE}.groups SET groupname = ?, supergroupid = ?, groupdata = ? WHERE group = ?;';
queries.upsertMember = 'INSERT INTO {KEYSPACE}.members (group, user, since) VALUES(?, ?, ?);';
queries.removeGroup = 'DELETE FROM {KEYSPACE}.groups WHERE group = ?;';
queries.removeMember = 'DELETE FROM {KEYSPACE}.members WHERE group = ? AND user = ?;';
queries.removeMembers = 'DELETE FROM {KEYSPACE}.members WHERE group = ?;';
queries.selectGroupById = 'SELECT group, groupdata, groupname, supergroupid from {KEYSPACE}.groups WHERE group = ?;';
queries.selectGroupMembers = 'SELECT member, since from {KEYSPACE}.members WHERE group = ?;';
queries.selectGroupsBySupergroupId = 'SELECT group, groupdata, groupname, supergroupid from {KEYSPACE}.groups WHERE supergroupid = ?;';
queries.selectGroupsForUser = 'SELECT group, since from {KEYSPACE}.members WHERE user = ?;';
queries.selectGroupByNameAndSupergroup = 'SELECT group, groupdata, groupname, supergroupid from {KEYSPACE}.groups WHERE groupname = ? AND supergroupid = ? ALLOW FILTERING;';
queries.selectMembersForGroup = 'SELECT user, since from {KEYSPACE}.members WHERE group = ?;';
queries.selectMemberByUserAndGroup = 'SELECT group, user, since from {KEYSPACE}.members WHERE user = ? AND group = ?;';
queries.upsertGroupTimeline = 'INSERT INTO {KEYSPACE}.group_timeline (group, item, type, time) VALUES(?, ?, ?, ?);';
queries.upsertFeedTimelineFromGroup = 'INSERT INTO {KEYSPACE}.feed_timeline (user, item, type, time, visibility, from_group) VALUES(?, ?, ?, ?, ?, ?);';
queries.upsertUserTimelineFromGroup = 'INSERT INTO {KEYSPACE}.user_timeline (user, item, type, time, visibility) VALUES(?, ?, ?, ?, ?);';
queries.selectGroupTimeline = 'SELECT group, time, dateOf(time) AS date, item, type FROM {KEYSPACE}.{TIMELINE} WHERE group = ? {TYPEQUERY} {OLDERTHANQUERY}';
