/**
 * Acceptance test the Cassandra API directly.
 */

/*eslint-env node, mocha */

var keyspace = 'test_seguir_app_api';
var expect = require('expect.js');
var initialiser = require('../../fixtures/initialiser');
var _ = require('lodash');
var databases = process.env.DATABASE ? [process.env.DATABASE] : ['postgres', 'cassandra'];
var async = require('async');

databases.forEach(function (db) {

  var config = _.clone(require('../../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe('Social API - ' + db, function () {

    this.timeout(10000);
    this.slow(5000);

    var api, users = {}, liu, postId, privatePostId, mentionPostId, followId, notFriendFollowId, likeId, friendId, reciprocalFriendId, otherFriendId, friendRequestId, privateFollowId, personalFollowId;

    before(function (done) {
      this.timeout(20000);
      initialiser.setupApi(keyspace, config, function (err, seguirApi) {
        expect(err).to.be(null);
        api = seguirApi;
        done();
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
            results.forEach(function (user) {
              users[user.username] = user;
            });
            liu = users['phteven'].user; // phteven is logged in
            done(err);
          });
      });

      it('can retrieve a user by id', function (done) {
        api.user.getUser(keyspace, users['cliftonc'].user, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.eql(users['cliftonc'].user);
          expect(user.username).to.be('cliftonc');
          done();
        });
      });

      it('can retrieve a user by name', function (done) {
        api.user.getUserByName(keyspace, users['cliftonc'].username, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.eql(users['cliftonc'].user);
          expect(user.username).to.be(users['cliftonc'].username);
          done();
        });
      });

      it('can retrieve a user by alternate id', function (done) {
        api.user.getUserByAltId(keyspace, users['cliftonc'].altid, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.eql(users['cliftonc'].user);
          expect(user.username).to.be(users['cliftonc'].username);
          done();
        });
      });

      it('can update a users data', function (done) {
        api.user.updateUser(keyspace, users['json'].user, 'new_name', 'new_altid', {hello: 'world'}, function (err, user) {
          expect(err).to.be(null);
          api.user.getUser(keyspace, users['json'].user, function (err, user) {
            expect(err).to.be(null);
            expect(user.user).to.eql(users['json'].user);
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
        api.friend.addFriendRequest(keyspace, users['cliftonc'].user, users['phteven'].user, 'Please be my friend', api.client.getTimestamp(), function (err, friend_request) {
          expect(err).to.be(null);
          expect(friend_request.user).to.eql(users['cliftonc'].user);
          expect(friend_request.user_friend).to.eql(users['phteven'].user);
          friendRequestId = friend_request.friend_request;
          done();
        });
      });

      it('can see status of outbound friend requests', function (done) {
        api.friend.getOutgoingFriendRequests(keyspace, users['cliftonc'].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can see status of incoming friend requests', function (done) {
        api.friend.getIncomingFriendRequests(keyspace, users['phteven'].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can see status of all friend requests for incoming', function (done) {
        api.friend.getFriendRequests(keyspace, users['phteven'].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests.incoming[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests.incoming[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can see status of all friend requests for outgoing', function (done) {
        api.friend.getFriendRequests(keyspace, users['cliftonc'].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests.outgoing[0].user.user).to.eql(users['cliftonc'].user);
          expect(friend_requests.outgoing[0].user_friend.user).to.eql(users['phteven'].user);
          done();
        });
      });

      it('can accept a friend request and create a reciprocal friendship', function (done) {
        api.friend.acceptFriendRequest(keyspace, users['phteven'].user, friendRequestId, function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['cliftonc']);
          expect(friend.user_friend).to.eql(users['phteven']);
          friendId = friend.friend;
          reciprocalFriendId = friend.reciprocal;
          done();
        });
      });

      it('it deletes the friend request after it is accepted', function (done) {
        api.friend.getFriendRequest(keyspace, users['phteven'].user, friendRequestId, function (err, friend_request) {
          expect(err).to.not.be(null);
          expect(friend_request).to.eql(undefined);
          done();
        });
      });

    });

    describe('friends', function () {

      it('can friend another user', function (done) {
        api.friend.addFriend(keyspace, users['ted'].user, users['bill'].user, api.client.getTimestamp(), function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['ted']);
          expect(friend.user_friend).to.eql(users['bill']);
          otherFriendId = friend.friend;
          done();
        });
      });

      it('can retrieve a friend by id', function (done) {
        api.friend.getFriend(keyspace, liu, friendId, function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['cliftonc']);
          expect(friend.user_friend).to.eql(users['phteven']);
          done();
        });
      });

      it('can not retrieve details of a friendship for someone that you are not friends with', function (done) {
        api.friend.getFriend(keyspace, users['cliftonc'].user, otherFriendId, function (err, friend) {
          expect(err.message).to.be('You are not allowed to see this item.');
          done();
        });
      });

      it('can retrieve a list of friends for a user', function (done) {
        api.friend.getFriends(keyspace, liu, users['cliftonc'].user, function (err, friends) {
          expect(err).to.be(null);
          expect(friends[0].user_friend).to.eql(users['phteven']);
          done();
        });
      });

      it('can not retrieve a list of friends for someone that you are not friends with', function (done) {
        api.friend.getFriends(keyspace, users['cliftonc'].user, users['ted'].user, function (err, friend) {
          expect(err.message).to.be('You are not allowed to see this item.');
          done();
        });
      });

      it('can add and remove a friend', function (done) {
        api.friend.addFriend(keyspace, users['cliftonc'].user, users['harold'].user, api.client.getTimestamp(), function (err, friend) {
          expect(err).to.be(null);
          api.friend.removeFriend(keyspace, users['cliftonc'].user, users['harold'].user, function (err, result) {
            expect(err).to.be(null);
            expect(result.status).to.be('removed');
            api.feed.getRawFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, null, 100, function (err, feed) {
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
        api.follow.addFollower(keyspace, users['cliftonc'].user, users['phteven'].user, api.client.getTimestamp(), false, false, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['phteven']);
          followId = follow.follow;
          done();
        });
      });

      it('can follow a user who is not a friend', function (done) {
        api.follow.addFollower(keyspace, users['cliftonc'].user, users['ted'].user, api.client.getTimestamp(), false, false, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['ted']);
          notFriendFollowId = follow.follow;
          done();
        });
      });

      it('can follow a user privately so only your friends can see', function (done) {
        api.follow.addFollower(keyspace, users['harold'].user, users['jenny'].user, api.client.getTimestamp(), true, false, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['harold']);
          expect(follow.user_follower).to.eql(users['jenny']);
          expect(follow.isprivate).to.be(true);
          privateFollowId = follow.follow;
          done();
        });
      });

      it('can follow a user personally so only you can see', function (done) {
        api.follow.addFollower(keyspace, users['alfred'].user, users['jenny'].user, api.client.getTimestamp(), false, true, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['alfred']);
          expect(follow.user_follower).to.eql(users['jenny']);
          expect(follow.ispersonal).to.be(true);
          personalFollowId = follow.follow;
          done();
        });
      });

      it('can retrieve a follow by id', function (done) {
        api.follow.getFollow(keyspace, users['cliftonc'].user, followId, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['phteven']);
          done();
        });
      });

      it('can not see a private follow if not a friend ', function (done) {
        api.follow.getFollow(keyspace, users['cliftonc'].user, privateFollowId, function (err, follow) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('can not see a personal follow if not the user', function (done) {
        api.follow.getFollow(keyspace, users['cliftonc'].user, personalFollowId, function (err, follow) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('can retrieve a list of followers for a user', function (done) {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['cliftonc'].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.pluck(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.contain(users['phteven'].user.toString());
          expect(followerIds).to.contain(users['ted'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show private if not a friend', function (done) {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['harold'].user, function (err, followers) {
          expect(err).to.be(null);
          expect(followers.length).to.be(0);
          done();
        });
      });

      it('can retrieve a list of followers for a user but will not show personal if not the user', function (done) {
        api.follow.getFollowers(keyspace, users['cliftonc'].user, users['alfred'].user, function (err, followers) {
          expect(err).to.be(null);
          expect(followers.length).to.be(0);
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show personal if one of the two users', function (done) {
        api.follow.getFollowers(keyspace, users['alfred'].user, users['alfred'].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.pluck(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.contain(users['jenny'].user.toString());
          done();
        });
      });

      it('can retrieve a list of followers for a user but will show private if one of the two users', function (done) {
        api.follow.getFollowers(keyspace, users['harold'].user, users['harold'].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.pluck(followers, 'user_follower'), function (item) { return item.user.toString(); });
          expect(followerIds).to.contain(users['jenny'].user.toString());
          done();
        });
      });

      it('can remove a follow', function (done) {
        api.follow.addFollower(keyspace, users['bill'].user, users['harold'].user, api.client.getTimestamp(), false, false, function (err, follow) {
          expect(err).to.be(null);
          api.follow.removeFollower(keyspace, users['bill'].user, users['harold'].user, function (err, result) {
            expect(err).to.be(null);
            expect(result.status).to.be('removed');
            api.feed.getRawFeed(keyspace, users['bill'].user, users['bill'].user, null, 100, function (err, feed) {
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

      var timestamp = new Date(1280296860145);

      it('can post a message from a user', function (done) {
        api.post.addPost(keyspace, users['cliftonc'].user, 'Hello, this is a post', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.eql(users['cliftonc']);
          postId = post.post;
          done();
        });
      });

      it('can post a private message from a user with a specific timestamp', function (done) {
        api.post.addPost(keyspace, users['cliftonc'].user, 'Hello, this is a private post', 'text/html', timestamp, true, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.eql(users['cliftonc']);
          expect(post.posted).to.eql(timestamp);
          privatePostId = post.post;
          done();
        });
      });

      it('anyone can retrieve a public post by id', function (done) {
        api.post.getPost(keyspace, users['ted'].user, postId, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.eql(users['cliftonc']);
          done();
        });
      });

      it('anyone not a friend cant retrieve a private post by id', function (done) {
        api.post.getPost(keyspace, users['ted'].user, privatePostId, function (err, post) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('anyone who is a friend can retrieve a private post by id', function (done) {
        api.post.getPost(keyspace, users['phteven'].user, privatePostId, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.eql(users['cliftonc']);
          expect(post.posted).to.eql(timestamp);
          done();
        });
      });

      it('you can mention yourself in a post', function (done) {
        api.post.addPost(keyspace, users['harold'].user, 'Who am I? @harold', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Who am I? @harold');
          done();
        });
      });

      it('you can mention someone in a post', function (done) {
        api.post.addPost(keyspace, users['bill'].user, 'Hello, this is a post mentioning @harold', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post mentioning @harold');
          mentionPostId = post.post;
          done();
        });
      });

      it('sanitizes any input by default', function (done) {
        api.post.addPost(keyspace, users['jenny'].user, 'Evil hack <IMG SRC=j&#X41vascript:alert(\'test2\')>', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Evil hack ');
          expect(post.user).to.eql(users['jenny']);
          done();
        });
      });

      it('can add and remove a post', function (done) {
        api.post.addPost(keyspace, users['jenny'].user, 'I am but a fleeting message in the night', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          api.post.removePost(keyspace, users['jenny'].user, post.post, function (err, result) {
            expect(err).to.be(null);
            api.feed.getRawFeed(keyspace, users['jenny'].user, users['jenny'].user, null, 100, function (err, feed) {
              expect(err).to.be(null);
              var ids = _.map(_.pluck(feed, 'item'), function (item) { return item.toString(); });
              expect(ids).to.not.contain(post.post.toString());
              done();
            });
          });
        });
      });

      it('you can add a completely personal post that only appears in the users feed', function (done) {
        api.post.addPost(keyspace, users['jenny'].user, 'Shh - this is only for me.', 'text/html', api.client.getTimestamp(), false, true, function (err, post) {
          expect(err).to.be(null);
          api.feed.getFeed(keyspace, users['harold'].user, users['jenny'].user, null, 100, function (err, feed) {
            expect(err).to.be(null);
            var ids = _.map(_.pluck(feed, 'post'), function (item) { return item.toString(); });
            expect(ids).to.not.contain(post.post.toString());
            done();
          });
        });
      });

      it('can post a message that contains an object with type application/json and it returns the object in the post and feed', function (done) {
        api.post.addPost(keyspace, users['json'].user, {hello: 'world'}, 'application/json', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content.hello).to.be('world');
          api.post.getPost(keyspace, users['json'].user, post.post, function (err, getPost) {
            expect(err).to.be(null);
            expect(getPost.content.hello).to.be('world');
            api.feed.getFeed(keyspace, users['json'].user, users['json'].user, null, 100, function (err, feed) {
              expect(err).to.be(null);
              expect(feed[0].content.hello).to.be('world');
              done();
            });
          });
        });
      });

      it('cant post an invalid message that contains an object with type application/json', function (done) {
        api.post.addPost(keyspace, users['json'].user, '{"hello":bob}', 'application/json', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err.message).to.be('Unable to parse input content, post not saved.');
          done();
        });
      });

    });

    describe('likes', function () {

      it('can like an item from a user', function (done) {
        api.like.addLike(keyspace, users['cliftonc'].user, 'http://github.com', api.client.getTimestamp(), function (err, like) {
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
          expect(like.user).to.eql(users['cliftonc']);
          done();
        });
      });

      it('can check if a user likes an item', function (done) {
        api.like.checkLike(keyspace, users['cliftonc'].user, 'http://github.com', function (err, like) {
          expect(err).to.be(null);
          expect(like.like).to.eql(likeId);
          expect(like.user).to.eql(users['cliftonc']);
          expect(like.count).to.eql(1);
          done();
        });
      });

      it('can check if a user likes an item if they dont like it', function (done) {
        api.like.checkLike(keyspace, users['jenny'].user, 'http://github.com', function (err, like) {
          expect(err).to.be(null);
          expect(like.like).to.be(undefined);
          expect(like.user).to.eql(users['jenny']);
          expect(like.count).to.eql(1);
          done();
        });
      });

      it('can check if a user likes an item that has never been liked', function (done) {
        api.like.checkLike(keyspace, users['jenny'].user, 'http://google.com', function (err, like) {
          expect(err).to.be(null);
          expect(like.like).to.be(undefined);
          expect(like.user).to.eql(users['jenny']);
          expect(like.count).to.eql(0);
          done();
        });
      });

      it('can add and remove a like', function (done) {
        api.like.addLike(keyspace, users['jenny'].user, 'http://seguir.calip.so', api.client.getTimestamp(), function (err, like) {
          expect(err).to.be(null);
          api.like.removeLike(keyspace, users['jenny'].user, 'http://seguir.calip.so', function (err, result) {
            expect(err).to.be(null);
            api.feed.getRawFeed(keyspace, users['jenny'].user, users['jenny'].user, null, 100, function (err, feed) {
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
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(postId);
          expect(feed[2].follow).to.eql(notFriendFollowId);
          expect(feed[3].follow).to.eql(followId);
          expect(feed[4].friend).to.eql(friendId);
          expect(feed[5].post).to.eql(privatePostId);
          done();
        });
      });

      it('logged in - can get a feed for a friend that is in the correct order', function (done) {
        api.feed.getFeed(keyspace, users['phteven'].user, users['cliftonc'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(postId);
          expect(feed[2].follow).to.eql(notFriendFollowId);
          expect(feed[3].follow).to.eql(followId);
          expect(feed[4].friend).to.eql(friendId);
          expect(feed[5].post).to.eql(privatePostId); //
          done();
        });
      });

      it('logged in - can get a feed for a friend and follower that is in the correct order', function (done) {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['phteven'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(postId);
          expect(feed[2].follow).to.eql(notFriendFollowId);
          expect(feed[3].follow).to.eql(followId);
          expect(feed[4].friend).to.eql(reciprocalFriendId);
          expect(feed[5].post).to.eql(privatePostId);
          done();
        });
      });

      it('logged in - can get a feed for a follower that is not a friend in the correct order', function (done) {
        api.feed.getFeed(keyspace, users['cliftonc'].user, users['ted'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(postId);
          expect(feed[2].follow).to.eql(notFriendFollowId);
          done();
        });
      });

      it('anonymous - can get a feed that is in correct order', function (done) {
        api.feed.getFeed(keyspace, '_anonymous_', users['cliftonc'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(postId);
          expect(feed[2].follow).to.eql(notFriendFollowId);
          done();
        });
      });

      it('can see private follows as the user', function (done) {
        api.feed.getFeed(keyspace, users['harold'].user, users['harold'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[2].follow).to.eql(privateFollowId);
          done();
        });
      });

      it('can see personal follows as the user', function (done) {
        api.feed.getFeed(keyspace, users['alfred'].user, users['alfred'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].follow).to.eql(personalFollowId);
          expect(feed[0].isUsersItem).to.eql(true);
          expect(feed[0].isFollower).to.eql(false);
          done();
        });
      });

      it('can see personal follows as the following user', function (done) {
        api.feed.getFeed(keyspace, users['jenny'].user, users['jenny'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[3].follow).to.eql(personalFollowId);
          expect(feed[3].isUsersItem).to.eql(true);
          expect(feed[3].isFollower).to.eql(true);
          done();
        });
      });

      it('anonymous - cant see personal follows as the anonymous user', function (done) {
        api.feed.getFeed(keyspace, '_anonymous_', users['alfred'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed.length).to.be(0);
          done();
        });
      });

      it('anonymous - cant see private follows as anonymous user', function (done) {
        api.feed.getFeed(keyspace, '_anonymous_', users['harold'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed.length).to.be(2);
          done();
        });
      });

      it('logged in - can get a feed for yourself contains mentions', function (done) {
        api.feed.getFeed(keyspace, users['harold'].user, users['harold'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].post).to.eql(mentionPostId);
          done();
        });
      });

      it('cant see follows or mentions on a users personal feed, only direct items', function (done) {
        api.feed.getUserFeed(keyspace, '_anonymous_', users['cliftonc'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].like).to.eql(likeId);
          expect(feed[1].post).to.eql(postId);
          expect(feed[2].follow).to.eql(notFriendFollowId);
          done();
        });
      });

      it('logged in - can get a users personal feed as the user and see direct actions', function (done) {
        api.feed.getUserFeed(keyspace, users['bill'].user, users['bill'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].post).to.eql(mentionPostId);
          done();
        });
      });

      it('logged in - can get a users personal feed as a friend and see direct items private or public', function (done) {
        api.feed.getUserFeed(keyspace, users['cliftonc'].user, users['phteven'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed[0].friend).to.eql(reciprocalFriendId);
          done();
        });
      });

      it('anonymus - can get a users personal feed anonymously and only see direct, public items', function (done) {
        api.feed.getUserFeed(keyspace, '_anonymous_', users['phteven'].user, null, 100, function (err, feed) {
          expect(err).to.be(null);
          expect(feed.length).to.be(0);
          done();
        });
      });

    });

    describe('relationships', function () {

      it('can query a relationship between a user and themselves', function (done) {
        api.user.getUserRelationship(keyspace, users['cliftonc'].user, users['cliftonc'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(true);
          expect(relationship.followerCount).to.be(2);
          done();
        });
      });

      it('can query a relationship between a user and another user', function (done) {
        api.user.getUserRelationship(keyspace, users['cliftonc'].user, users['phteven'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(true);
          expect(relationship.followerCount).to.be(0);
          done();
        });
      });

      it('can query the inverse relationship between a user and another user', function (done) {
        api.user.getUserRelationship(keyspace, users['phteven'].user, users['cliftonc'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(2);
          done();
        });
      });

      it('can query the relationship between users who have no relationship', function (done) {
        api.user.getUserRelationship(keyspace, users['cliftonc'].user, users['bill'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(false);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(0);
          done();
        });
      });

      it('can query a relationship between the anonymous user and a user', function (done) {
        api.user.getUserRelationship(keyspace, null, users['cliftonc'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(false);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          expect(relationship.followerCount).to.be(2);
          done();
        });
      });

    });

    describe('initialising users and follows', function () {

      it('can optionally initialise a user with a follow relationship and automatically populate their feed', function (done) {

        var initialise = {
          follow: {
            users: [users['cliftonc'].username, users['phteven'].username],
            backfill: '1d',
            isprivate: false,
            ispersonal: true
          }
        };

        api.user.addUser(keyspace, 'shaun', 'baah', {type: 'sheep'}, initialise, function (err, user) {
          expect(err).to.be(null);
          api.feed.getFeed(keyspace, user.user, user.user, null, 50, function (err, feed) {
            expect(err).to.be(null);
            expect(_.last(feed).post).to.eql(postId);
            done();
          });
        });

      });

      it('can optionally backfill a follow relationship and automatically populate their feed', function (done) {

        api.user.addUser(keyspace, 'bitzer', 'woof', {type: 'dog'}, function (err, user) {
          expect(err).to.be(null);
          api.follow.addFollower(keyspace, users['cliftonc'].user, user.user, api.client.getTimestamp(), false, false, '1d', function (err, follow) {
            expect(err).to.be(null);
            api.feed.getFeed(keyspace, user.user, user.user, null, 50, function (err, feed) {
              expect(err).to.be(null);
              expect(feed[0].follow).to.eql(follow.follow);
              expect(feed[1].post).to.eql(postId);
              done();
            });
          });
        });

      });

    });

  });

});

