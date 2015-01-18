var st = require("string-template");
var DEFAULT_KEYSPACE = 'seguir';

// Queries
var queries = {
   upsertUser: 'INSERT INTO {KEYSPACE}.users (user, username) VALUES(?, ?);',
   upsertPost: 'INSERT INTO {KEYSPACE}.posts (post, user, content, posted) VALUES(?, ?, ?, ?);',
   upsertLike: 'INSERT INTO {KEYSPACE}.likes (like, user, item, since) VALUES(?, ?, ?, ?);',
   upsertUserTimeline: 'INSERT INTO {KEYSPACE}.userline (user, item, type, time) VALUES(?, ?, ?, ?);',
   upsertFriend: 'INSERT INTO {KEYSPACE}.friends (friend, user, user_friend, since) VALUES(?, ?, ?, ?);',
   upsertFollower: 'INSERT INTO {KEYSPACE}.followers (follow, user, user_follower, since) VALUES(?, ?, ?, ?);',
   selectFollowers: 'SELECT user_follower from {KEYSPACE}.followers WHERE user = ?',
   selectTimeline: 'SELECT user, time, dateOf(time) AS date, item, type FROM {KEYSPACE}.userline WHERE user = ? {timeClause} LIMIT {limit}',
   selectPost: 'SELECT post, content, user, posted FROM {KEYSPACE}.posts WHERE post = ?',
   selectLike: 'SELECT like, item, user, since FROM {KEYSPACE}.likes WHERE like = ?',
   selectUser: 'SELECT user, username FROM {KEYSPACE}.users WHERE user = ?',
   selectFriend: 'SELECT friend, user, user_friend, since FROM {KEYSPACE}.friends WHERE friend = ?',
   selectFollow: 'SELECT follow, user, user_follower, since FROM {KEYSPACE}.followers WHERE follow = ?',
   selectUserByUsername: 'SELECT user, username FROM {KEYSPACE}.users WHERE username = ?',
   checkLike: 'SELECT like, user, since FROM {KEYSPACE}.likes WHERE user = ? AND item = ?'
}

module.exports = function(keyspace) {
  return function(name, data) {
    data = data || {};
    data.KEYSPACE = data.KEYSPACE || keyspace || DEFAULT_KEYSPACE;
    return st(queries[name], data);
  }
}
