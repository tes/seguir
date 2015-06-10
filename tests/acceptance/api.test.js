/**
 * Acceptance test the Cassandra API directly.
 */

/*eslint-env node, mocha */

var keyspace = 'test_seguir_app_api';
var expect = require('expect.js');
var Api = require('../../api');
var _ = require('lodash');
var databases = process.env.DATABASE ? [process.env.DATABASE] : ['postgres', 'cassandra'];
var async = require('async');

databases.forEach(function (db) {

  var config = _.clone(require('../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe('Social API - ' + db, function () {

    this.timeout(10000);
    this.slow(2000);

    var api, users = [], liu, postId, privatePostId, mentionPostId, followId, notFriendFollowId, likeId, friendId, reciprocalFriendId, otherFriendId, friendRequestId, privateFollowId, personalFollowId;

    before(function (done) {
      this.timeout(20000);
      Api(config, function (err, seguirApi) {
        expect(err).to.be(null);
        api = seguirApi;
        console.log('Setting up keyspace in ' + api.client.type + '...');
        api.client.setup.setupTenant(api.client, keyspace, function (err) {
          done(err);
        });
      });
    });

    describe('users', function () {

      it('can create users', function (done) {
        async.map([
            {username: 'cliftonc', altid: '1'},
            {username: 'phteven', altid: '2'},
            {username: 'ted', altid: '3'},
            {username: 'bill', altid: '4'},
            {username: 'harold', altid: '5'},
            {username: 'jenny', altid: '6'},
            {username: 'alfred', altid: '7'},
            {username: 'json', altid: '8'}
          ], function (user, cb) {
            api.user.addUser(keyspace, user.username, user.altid, {'age': 15}, cb);
          }, function (err, results) {
            expect(err).to.be(null);
            users = results;
            liu = users[1].user; // phteven is logged in
            done(err);
          });
      });

      it('can retrieve a user by id', function (done) {
        api.user.getUser(keyspace, users[0].user, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.eql(users[0].user);
          expect(user.username).to.be('cliftonc');
          done();
        });
      });

      it('can retrieve a user by name', function (done) {
        api.user.getUserByName(keyspace, users[0].username, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.eql(users[0].user);
          expect(user.username).to.be(users[0].username);
          done();
        });
      });

      it('can retrieve a user by alternate id', function (done) {
        api.user.getUserByAltId(keyspace, users[0].altid, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.eql(users[0].user);
          expect(user.username).to.be(users[0].username);
          done();
        });
      });

      it('can update a users data', function (done) {
        api.user.updateUser(keyspace, users[7].user, 'new_name', 'new_altid', {hello: 'world'}, function (err, user) {
          expect(err).to.be(null);
          api.user.getUser(keyspace, users[7].user, function (err, user) {
            expect(err).to.be(null);
            expect(user.user).to.eql(users[7].user);
            expect(user.username).to.be('new_name');
            expect(user.altid).to.be('new_altid');
            expect(user.userdata.hello).to.be('world');
            done();
          });
        });
      });

    });

    describe('friend requests', function () {

      it('can create a friend request', function (done) {
        api.friend.addFriendRequest(keyspace, users[0].user, users[1].user, 'Please be my friend', api.client.getTimestamp(), function (err, friend_request) {
          expect(err).to.be(null);
          expect(friend_request.user).to.eql(users[0].user);
          expect(friend_request.user_friend).to.eql(users[1].user);
          friendRequestId = friend_request.friend_request;
          done();
        });
      });

      it('can see status of outbound friend requests', function (done) {
        api.friend.getOutgoingFriendRequests(keyspace, users[0].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests[0].user.user).to.eql(users[0].user);
          expect(friend_requests[0].user_friend.user).to.eql(users[1].user);
          done();
        });
      });

      it('can see status of incoming friend requests', function (done) {
        api.friend.getIncomingFriendRequests(keyspace, users[1].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests[0].user.user).to.eql(users[0].user);
          expect(friend_requests[0].user_friend.user).to.eql(users[1].user);
          done();
        });
      });

      it('can see status of all friend requests for incoming', function (done) {
        api.friend.getFriendRequests(keyspace, users[1].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests.incoming[0].user.user).to.eql(users[0].user);
          expect(friend_requests.incoming[0].user_friend.user).to.eql(users[1].user);
          done();
        });
      });

      it('can see status of all friend requests for outgoing', function (done) {
        api.friend.getFriendRequests(keyspace, users[0].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests.outgoing[0].user.user).to.eql(users[0].user);
          expect(friend_requests.outgoing[0].user_friend.user).to.eql(users[1].user);
          done();
        });
      });

      it('can accept a friend request and create a reciprocal friendship', function (done) {
        api.friend.acceptFriendRequest(keyspace, users[1].user, friendRequestId, function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users[0]);
          expect(friend.user_friend).to.eql(users[1]);
          friendId = friend.friend;
          reciprocalFriendId = friend.reciprocal;
          done();
        });
      });

      it('it deletes the friend request after it is accepted', function (done) {
        api.friend.getFriendRequest(keyspace, users[1].user, friendRequestId, function (err, friend_request) {
          expect(err).to.not.be(null);
          expect(friend_request).to.eql(undefined);
          done();
        });
      });

    });

    describe('friends', function () {

      it('can friend another user', function (done) {
        api.friend.addFriend(keyspace, users[2].user, users[3].user, api.client.getTimestamp(), function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users[2]);
          expect(friend.user_friend).to.eql(users[3]);
          otherFriendId = friend.friend;
          done();
        });
      });

      it('can retrieve a friend by id', function (done) {
        api.friend.getFriend(keyspace, liu, friendId, function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users[0]);
          expect(friend.user_friend).to.eql(users[1]);
          done();
        });
      });

      it('can not retrieve details of a friendship for someone that you are not friends with', function (done) {
        api.friend.getFriend(keyspace, users[0].user, otherFriendId, function (err, friend) {
          expect(err.message).to.be('You are not allowed to see this item.');
          done();
        });
      });

      it('can retrieve a list of friends for a user', function (done) {
        api.friend.getFriends(keyspace, liu, users[0].user, function (err, friends) {
          expect(err).to.be(null);
          expect(friends[0].user_friend).to.eql(users[1]);
          done();
        });
      });

      it('can not retrieve a list of friends for someone that you are not friends with', function (done) {
        api.friend.getFriends(keyspace, users[0].user, users[2].user, function (err, friend) {
          expect(err.message).to.be('You are not allowed to see this item.');
          done();
        });
      });

      it('can add and remove a friend', function (done) {
        api.friend.addFriend(keyspace, users[0].user, users[4].user, api.client.getTimestamp(), function (err, friend) {
          expect(err).to.be(null);
          api.friend.removeFriend(keyspace, users[0].user, users[4].user, function (err, result) {
            expect(err).to.be(null);
            expect(result.status).to.be('removed');
            api.feed.getRawFeed(keyspace, users[0].user, users[0].user, null, 100, function (err, feed) {
              expect(err).to.be(null);
              expect(_.pluck(feed, 'item')).to.not.contain(friend.friend);
              done();
            });
          });
        });
      });

    });

    describe('follows', function () {

      it('can follow a user who is a friend', function (done) {
        api.follow.addFollower(keyspace, users[0].user, users[1].user, api.client.getTimestamp(), false, false, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users[0]);
          expect(follow.user_follower).to.eql(users[1]);
          followId = follow.follow;
          done();
        });
      });

      it('can follow a user who is not a friend', function (done) {
        api.follow.addFollower(keyspace, users[0].user, users[2].user, api.client.getTimestamp(), false, false, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users[0]);
          expect(follow.user_follower).to.eql(users[2]);
          notFriendFollowId = follow.follow;
          done();
        });
      });

      it('can follow a user privately so only your friends can see', function (done) {
        api.follow.addFollower(keyspace, users[4].user, users[5].user, api.client.getTimestamp(), true, false, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users[4]);
          expect(follow.user_follower).to.eql(users[5]);
          expect(follow.isprivate).to.be(true);
          privateFollowId = follow.follow;
          done();
        });
      });

      it('can follow a user personally so only you can see', function (done) {
        api.follow.addFollower(keyspace, users[6].user, users[5].user, api.client.getTimestamp(), false, true, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users[6]);
          expect(follow.user_follower).to.eql(users[5]);
          expect(follow.ispersonal).to.be(true);
          personalFollowId = follow.follow;
          done();
        });
      });

      it('can retrieve a follow by id', function (done) {
        api.follow.getFollow(keyspace, users[0].user, followId, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users[0]);
          expect(follow.user_follower).to.eql(users[1]);
          done();
        });
      });

      it('can not see a private follow if not a friend ', function (done) {
        api.follow.getFollow(keyspace, users[0].user, privateFollowId, function (err, follow) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('can not see a personal follow if not the user', function (done) {
        api.follow.getFollow(keyspace, users[0].user, personalFollowId, function (err, follow) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('can retrieve a list of followers for a user', function (done) {
        api.follow.getFollowers(keyspace, users[0].user, users[0].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.pluck(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.contain(users[1].user.toString());
          expect(followerIds).to.contain(users[2].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show private if not a friend', function (done) {
        api.follow.getFollowers(keyspace, users[0].user, users[4].user, function (err, followers) {
          expect(err).to.be(null);
          expect(followers.length).to.be(0);
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show personal if not the user', function (done) {
        api.follow.getFollowers(keyspace, users[0].user, users[6].user, function (err, followers) {
          expect(err).to.be(null);
          expect(followers.length).to.be(0);
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show personal if one of the two users', function (done) {
        api.follow.getFollowers(keyspace, users[6].user, users[6].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.pluck(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.contain(users[5].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show private if one of the two users', function (done) {
        api.follow.getFollowers(keyspace, users[4].user, users[4].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.pluck(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.contain(users[5].user.toString());
          done();
        });
      });

      it('can remove a follow', function (done) {
        api.follow.addFollower(keyspace, users[3].user, users[4].user, api.client.getTimestamp(), false, false, function (err, follow) {
          expect(err).to.be(null);
          api.follow.removeFollower(keyspace, users[3].user, users[4].user, function (err, result) {
            expect(err).to.be(null);
            expect(result.status).to.be('removed');
            api.feed.getRawFeed(keyspace, users[3].user, users[3].user, null, 100, function (err, feed) {
              expect(err).to.be(null);
              var followerIds = _.map(_.pluck(feed, 'item'), function (item) { return item.toString(); });
              expect(followerIds).to.not.contain(follow.follow.toString());
              done();
            });
          });
        });
      });

    });

    describe('posts', function () {

      it('can post a message from a user', function (done) {
        api.post.addPost(keyspace, users[0].user, 'Hello, this is a post', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.eql(users[0]);
          postId = post.post;
          done();
        });
      });

      it('can post a private message from a user', function (done) {
        api.post.addPost(keyspace, users[0].user, 'Hello, this is a private post', 'text/html', api.client.getTimestamp(), true, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.eql(users[0]);
          privatePostId = post.post;
          done();
        });
      });

      it('anyone can retrieve a public post by id', function (done) {
        api.post.getPost(keyspace, users[2].user, postId, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.eql(users[0]);
          done();
        });
      });

      it('anyone not a friend cant retrieve a private post by id', function (done) {
        api.post.getPost(keyspace, users[2].user, privatePostId, function (err, post) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('anyone who is a friend can retrieve a private post by id', function (done) {
        api.post.getPost(keyspace, users[1].user, privatePostId, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.eql(users[0]);
          done();
        });
      });

      it('you can mention yourself in a post', function (done) {
        api.post.addPost(keyspace, users[4].user, 'Who am I? @harold', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Who am I? @harold');
          done();
        });
      });

      it('you can mention someone in a post', function (done) {
        api.post.addPost(keyspace, users[3].user, 'Hello, this is a post mentioning @harold', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post mentioning @harold');
          mentionPostId = post.post;
          done();
        });
      });

      it('sanitizes any input by default', function (done) {
        api.post.addPost(keyspace, users[5].user, 'Evil hack <IMG SRC=j&#X41vascript:alert(\'test2\')>', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Evil hack ');
          expect(post.user).to.eql(users[5]);
          done();
        });
      });

      it('can add and remove a post', function (done) {
        api.post.addPost(keyspace, users[5].user, 'I am but a fleeting message in the night', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          api.post.removePost(keyspace, users[5].user, post.post, function (err, result) {
            expect(err).to.be(null);
            api.feed.getRawFeed(keyspace, users[5].user, users[5].user, null, 100, function (err, feed) {
              expect(err).to.be(null);
              var ids = _.map(_.pluck(feed, 'item'), function (item) { return item.toString(); });
              expect(ids).to.not.contain(post.post.toString());
              done();
            });
          });
        });
      });

      it('you can add a completely personal post that only appears in the users feed', function (done) {
        api.post.addPost(keyspace, users[5].user, 'Shh - this is only for me.', 'text/html', api.client.getTimestamp(), false, true, function (err, post) {
          expect(err).to.be(null);
          api.feed.getFeed(keyspace, users[4].user, users[5].user, null, 100, function (err, feed) {
            expect(err).to.be(null);
            var ids = _.map(_.pluck(feed, 'post'), function (item) { return item.toString(); });
            expect(ids).to.not.contain(post.post.toString());
            done();
          });
        });
      });

      it('can post a message that contains an object with type application/json and it returns the object in the post and feed', function (done) {
        api.post.addPost(keyspace, users[7].user, {hello: 'world'}, 'application/json', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content.hello).to.be('world');
          api.post.getPost(keyspace, users[7].user, post.post, function (err, getPost) {
            expect(err).to.be(null);
            expect(getPost.content.hello).to.be('world');
            api.feed.getFeed(keyspace, users[7].user, users[7].user, null, 100, function (err, feed) {
              expect(err).to.be(null);
              expect(feed[0].content.hello).to.be('world');
              done();
            });
          });
        });
      });

      it('cant post an invalid message that contains an object with type application/json', function (done) {
        api.post.addPost(keyspace, users[7].user, '{"hello":bob}', 'application/json', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err.message).to.be('Unable to parse input content, post not saved.');
          done();
        });
      });

    });

    describe('likes', function () {

      it('can like an item from a user', function (done) {
        api.like.addLike(keyspace, users[0].user, 'http://github.com', api.client.getTimestamp(), function (err, like) {
          expect(err).to.be(null);
          expect(like.item).to.be('http://github.com');
          likeId = like.like;
          done();
        });
      });

      it('can retrieve a like by id', function (done) {
        api.like.getLike(keyspace, likeId, function (err, like) {
          expect(err).to.be(null);
          expect(like.item).to.be('http://github.com');
          expect(like.user).to.eql(users[0]);
          done();
        });
      });

      it('can check if a user likes an item', function (done) {
        api.like.checkLike(keyspace, users[0].user, 'http://github.com', function (err, like) {
          expect(err).to.be(null);
          expect(like.like).to.eql(likeId);
          expect(like.user).to.eql(users[0]);
          done();
        });
      });

      it('can add and remove a like', function (done) {
        api.like.addLike(keyspace, users[5].user, 'http://seguir.calip.so', api.client.getTimestamp(), function (err, like) {
          expect(err).to.be(null);
          api.like.removeLike(keyspace, users[5].user, 'http://seguir.calip.so', function (err, result) {
            expect(err).to.be(null);
            api.feed.getRawFeed(keyspace, users[5].user, users[5].user, null, 100, function (err, feed) {
              expect(err).to.be(null);
              var ids = _.map(_.pluck(feed, 'item'), function (item) { return item.toString(); });
              expect(ids).to.not.contain(like.like.toString());
              done();
            });
          });
        });
      });

    });

    describe('feeds', function () {

      this.timeout(10000);

      it('logged in - can get a feed for yourself that is in the correct order', function (done) {
        api.feed.getFeed(keyspace, users[0].user, users[0].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(privatePostId);
          expect(feed[2].post).to.eql(postId);
          expect(feed[3].follow).to.eql(notFriendFollowId);
          expect(feed[4].follow).to.eql(followId);
          expect(feed[5].friend).to.eql(friendId);
          done();
        });
      });

      it('logged in - can get a feed for a friend that is in the correct order', function (done) {
        api.feed.getFeed(keyspace, users[1].user, users[0].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(privatePostId); //
          expect(feed[2].post).to.eql(postId);
          expect(feed[3].follow).to.eql(notFriendFollowId);
          expect(feed[4].follow).to.eql(followId);
          expect(feed[5].friend).to.eql(friendId);
          done();
        });
      });

      it('logged in - can get a feed for a friend and follower that is in the correct order', function (done) {
        api.feed.getFeed(keyspace, users[0].user, users[1].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(privatePostId);
          expect(feed[2].post).to.eql(postId);
          expect(feed[3].follow).to.eql(notFriendFollowId);
          expect(feed[4].follow).to.eql(followId);
          done();
        });
      });

      it('logged in - can get a feed for a follower that is not a friend in the correct order', function (done) {
        api.feed.getFeed(keyspace, users[0].user, users[2].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(postId);
          expect(feed[2].follow).to.eql(notFriendFollowId);
          done();
        });
      });

      it('anonymous - can get a feed that is in correct order', function (done) {
        api.feed.getFeed(keyspace, '_anonymous_', users[0].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(postId);
          expect(feed[2].follow).to.eql(notFriendFollowId);
          done();
        });
      });

      it('can see private follows as the user', function (done) {
        api.feed.getFeed(keyspace, users[4].user, users[4].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[2].follow).to.eql(privateFollowId);
          done();
        });
      });

      it('can see personal follows as the user', function (done) {
        api.feed.getFeed(keyspace, users[6].user, users[6].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].follow).to.eql(personalFollowId);
          done();
        });
      });

      it('anonymous - cant see personal follows as the anonymous user', function (done) {
        api.feed.getFeed(keyspace, '_anonymous_', users[6].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed.length).to.be(0);
          done();
        });
      });

      it('anonymous - cant see private follows as anonymous user', function (done) {
        api.feed.getFeed(keyspace, '_anonymous_', users[4].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed.length).to.be(2);
          done();
        });
      });

      it('logged in - can get a feed for yourself contains mentions', function (done) {
        api.feed.getFeed(keyspace, users[4].user, users[4].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].post).to.eql(mentionPostId);
          done();
        });
      });

      it('cant see follows or mentions on a users personal feed, only direct items', function (done) {
        api.feed.getUserFeed(keyspace, '_anonymous_', users[0].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(postId);
          expect(feed[2].follow).to.eql(notFriendFollowId);
          done();
        });
      });

      it('logged in - can get a users personal feed as the user and see direct actions', function (done) {
        api.feed.getUserFeed(keyspace, users[3].user, users[3].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].post).to.eql(mentionPostId);
          done();
        });
      });

      it('logged in - can get a users personal feed as a friend and see direct items private or public', function (done) {
        api.feed.getUserFeed(keyspace, users[0].user, users[1].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].friend).to.eql(reciprocalFriendId);
          done();
        });
      });

      it('anonymus - can get a users personal feed anonymously and only see direct, public items', function (done) {
        api.feed.getUserFeed(keyspace, '_anonymous_', users[1].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed.length).to.be(0);
          done();
        });
      });

    });

    describe('relationships', function () {

      it('can query a relationship between a user and themselves', function (done) {
        api.user.getUserRelationship(keyspace, users[0].user, users[0].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(true);
          done();
        });
      });

      it('can query a relationship between a user and another user', function (done) {
        api.user.getUserRelationship(keyspace, users[0].user, users[1].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(true);
          done();
        });
      });

      it('can query the inverse relationship between a user and another user', function (done) {
        api.user.getUserRelationship(keyspace, users[1].user, users[0].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(false);
          done();
        });
      });

      it('can query the relationship between users who have no relationship', function (done) {
        api.user.getUserRelationship(keyspace, users[0].user, users[3].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(false);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          done();
        });
      });

    });

    describe('initialising users', function () {

      it('can optionally initialise a user with a follow relationship and automatically populate their feed', function (done) {

        var initialise = {
          follow: {
            users: [users[0].username, users[1].username],
            backfill: '1d',
            isprivate: false,
            ispersonal: true
          }
        };

        api.user.addUser(keyspace, 'shaun', 'baah', {type: 'sheep'}, initialise, function (err, user) {
          expect(err).to.be(null);
          api.feed.getFeed(keyspace, user.user, user.user, null, 50, function (err, feed) {
            expect(err).to.be(null);
            expect(feed[0].post).to.eql(postId);
            done();
          });
        });

      });

    });

  });

});

