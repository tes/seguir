/**
 * Acceptance test the Cassandra API directly.
 */

/*eslint-env node, mocha */

var keyspace = 'test_client_seguir_server';
var _ = require('lodash');
var expect = require('expect.js');
var initialiser = require('../../fixtures/initialiser');
var async = require('async');
var fs = require('fs');
var hbs = require('handlebars');
var databases = process.env.DATABASE ? [process.env.DATABASE] : ['postgres', 'cassandra'];

databases.forEach(function (db) {

  var config = _.clone(require('../../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe('Seguir Social Server / Client API - ' + db, function () {

    this.timeout(10000);
    this.slow(5000);

    var api, users = {}, liu, liuAltId, postId, privatePostId, followId, notFriendFollowId, followUserId, reciprocalFriendId, friendRequestId, likeId, friendId, server, client, samples = [];

    function addSample (name, sample) {
      samples.push({name: name, sample: JSON.stringify(sample, null, 2)});
    }

    function writeJsFile (folder) {
      var sampleMarker = '// MARKER: Samples';
      var template = hbs.compile(fs.readFileSync(folder + '/samples.hbs').toString());
      var sampleContent = template({samples: samples});
      var sourceJs = fs.readFileSync(folder + '/index.js').toString();
      var newSourceJs = [sourceJs.split(sampleMarker)[0], sampleMarker + '\n', sampleContent].join('');
      fs.writeFileSync(folder + '/index.js', newSourceJs);
    }

    function updateSamples () {
      if (_.contains(process.argv, '--write-samples')) {
        console.log('Writing updated samples into javascript source files ...');
        writeJsFile('client');
        writeJsFile('server');
      }
    }

    before(function (done) {
      this.timeout(20000);
      initialiser.setupServer(config, keyspace, function (err, seguirApi, seguirServer, seguirClient) {
        expect(err).to.be(null);
        api = seguirApi;
        server = seguirServer;
        client = seguirClient;
        done();
      });
    });

    after(function () {
      server.close();
      updateSamples();
    });

    describe('Status', function () {
      it('can retrieve server status', function (done) {
        client.status(function (err, status) {
          expect(err).to.be(null);
          expect(status.status).to.be('OK');
          done();
        });
      });
    });

    describe('Users', function () {

      it('can create users', function (done) {
        async.map([
          {username: 'cliftonc', altid: '1'},
          {username: 'phteven', altid: '2'},
          {username: 'ted', altid: '3'},
          {username: 'bill', altid: '4'},
          {username: 'harold', altid: '5'},
          {username: 'jenny', altid: '6'},
          {username: 'alfred', altid: '7'},
          {username: 'json', altid: '8'},
          {username: 'evil &user <alert>name</alert>', altid: '9'}
        ], function (user, cb) {
          client.addUser(null, user.username, user.altid, {avatar: 'test.jpg'}, cb);
        }, function (err, results) {
          expect(err).to.be(null);
          results.forEach(function (user) {
            users[user.username] = user;
          });
          liu = users['cliftonc'].user; // clifton is logged in
          liuAltId = users['cliftonc'].altid;
          addSample('addUser', users['cliftonc']);
          done();
        });
      });

      it('can retrieve a user by id', function (done) {
        client.getUser(null, users['cliftonc'].user, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.be(users['cliftonc'].user);
          expect(user.username).to.be('cliftonc');
          addSample('getUser', users['cliftonc']);
          done();
        });
      });

      it('can retrieve a user by altid but coerced by server to uuid', function (done) {
        client.getUser(null, users['cliftonc'].altid, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.be(users['cliftonc'].user);
          expect(user.username).to.be('cliftonc');
          done();
        });
      });

      it('can retrieve a user by name even if it has invalid url encoded characters', function (done) {
        client.getUserByName(null, 'evil &user <alert>name</alert>', function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.be(users['evil &user <alert>name</alert>'].user);
          expect(user.username).to.be(users['evil &user <alert>name</alert>'].username);
          addSample('getUserByName', users['evil &user <alert>name</alert>']);
          done();
        });
      });

      it('can retrieve a user by altid', function (done) {
        client.getUserByAltId(null, users['cliftonc'].altid, function (err, user) {
          expect(err).to.be(null);
          expect(user.user).to.be(users['cliftonc'].user);
          expect(user.username).to.be(users['cliftonc'].username);
          addSample('getUserByAltId', users['cliftonc']);
          done();
        });
      });

      it('can update a users data', function (done) {
        client.updateUser(null, users['json'].user, 'new_name', 'new_altid', {hello: 'world'}, function (err, user) {
          expect(err).to.be(null);
          addSample('updateUser', user);
          client.getUser(null, users['json'].user, function (err, user) {
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
        client.addFriendRequest(users['cliftonc'].user, users['phteven'].user, 'Please be my friend', function (err, friend_request) {
          expect(err).to.be(null);
          expect(friend_request.user).to.be(users['cliftonc'].user);
          expect(friend_request.user_friend).to.be(users['phteven'].user);
          friendRequestId = friend_request.friend_request;
          addSample('addFriendRequest', friend_request);
          done();
        });
      });

      it('can see status of friend requests', function (done) {
        client.getFriendRequests(users['cliftonc'].user, function (err, friend_requests) {
          expect(err).to.be(null);
          expect(friend_requests.outgoing[0].user.user).to.be(users['cliftonc'].user);
          expect(friend_requests.outgoing[0].user_friend.user).to.be(users['phteven'].user);
          addSample('getFriendRequests', friend_requests);
          done();
        });
      });

      it('can accept a friend request and create a reciprocal friendship', function (done) {
        client.acceptFriendRequest(users['phteven'].user, friendRequestId, function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['cliftonc']);
          expect(friend.user_friend).to.eql(users['phteven']);
          friendId = friend.friend;
          reciprocalFriendId = friend.reciprocal;
          addSample('acceptFriendRequest', friend);
          done();
        });
      });

    });

    describe('friends', function () {

      it('can retrieve a friend by id', function (done) {
        client.getFriend(liu, friendId, function (err, friend) {
          expect(err).to.be(null);
          expect(friend.user).to.eql(users['cliftonc']);
          expect(friend.user_friend).to.eql(users['phteven']);
          addSample('getFriend', friend);
          done();
        });
      });

      it('can retrieve a list of friends for a user', function (done) {
        client.getFriends(liu, users['cliftonc'].user, function (err, friends) {
          expect(err).to.be(null);
          expect(friends[0].user_friend).to.eql(users['phteven']);
          addSample('getFriends', friends);
          done();
        });
      });

      it('can retrieve a list of friends for a user by altids', function (done) {
        client.getFriends(liuAltId, users['cliftonc'].altid, function (err, friends) {
          expect(err).to.be(null);
          expect(friends[0].user_friend).to.eql(users['phteven']);
          done();
        });
      });

      it('can add and remove a friend', function (done) {
        client.addFriendRequest(users['bill'].user, users['harold'].user, 'Please be my friend', function (err, friend_request) {
          expect(err).to.be(null);
          client.acceptFriendRequest(users['bill'].user, friend_request.friend_request, function (err, friend) {
            expect(err).to.be(null);
            client.getFriend(users['bill'].user, friend.friend, function (err, friend) {
              expect(err).to.be(null);
              client.removeFriend(users['bill'].user, users['harold'].user, function (err, result) {
                expect(err).to.be(null);
                addSample('removeFriend', result);
                client.getFriend(users['bill'].user, friend.friend, function (err, friend) {
                  expect(err.statusCode).to.be(404);
                  done();
                });
              });
            });
          });
        });
      });

    });

    describe('follows', function () {

      it('can add a follower who is a friend', function (done) {
        client.followUser(users['phteven'].user, liu, false, false, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['phteven']);
          followId = follow.follow;
          addSample('followUser', follow);
          done();
        });
      });

      it('can add a follower who is not a friend', function (done) {
        client.followUser(users['ted'].user, liu, false, false, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['ted']);
          notFriendFollowId = follow.follow;
          done();
        });
      });

      it('can follow a user who is not a friend', function (done) {
        client.followUser(users['bill'].user, users['ted'].user, false, false, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['ted']);
          expect(follow.user_follower).to.eql(users['bill']);
          followUserId = follow.follow;
          done();
        });
      });

      it('can retrieve a follow by id', function (done) {
        client.getFollow(liu, followId, function (err, follow) {
          expect(err).to.be(null);
          expect(follow.user).to.eql(users['cliftonc']);
          expect(follow.user_follower).to.eql(users['phteven']);
          addSample('getFollow', follow);
          done();
        });
      });

      it('can retrieve a list of followers for a user', function (done) {
        client.getFollowers(liu, users['cliftonc'].user, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.pluck(followers, 'user_follower'), function (item) {
            return item.user.toString();
          });
          expect(followerIds).to.contain(users['phteven'].user);
          expect(followerIds).to.contain(users['ted'].user);
          addSample('getFollowers', followers);
          done();
        });
      });

      it('can retrieve a list of followers for a user who has no followers', function (done) {
        client.getFollowers(liu, users['alfred'].user, function (err, followers) {
          expect(err).to.be(null);
          expect(followers.length).to.be(0);
          done();
        });
      });

      it('can retrieve a list of followers for a user who has no followers if you are the anonymous user', function (done) {
        client.getFollowers(undefined, users['alfred'].user, function (err, followers) {
          expect(err).to.be(null);
          expect(followers.length).to.be(0);
          done();
        });
      });

      it('can retrieve a list of followers for a user by altids', function (done) {
        client.getFollowers(liuAltId, users['cliftonc'].altid, function (err, followers) {
          expect(err).to.be(null);
          var followerIds = _.map(_.pluck(followers, 'user_follower'), function (item) {
            return item.user.toString();
          });
          expect(followerIds).to.contain(users['phteven'].user);
          expect(followerIds).to.contain(users['ted'].user);
          done();
        });
      });

      it('can add and then remove a follower', function (done) {
        client.followUser(users['bill'].user, users['harold'].user, false, false, function (err, follow) {
          expect(err).to.be(null);
          client.getFollowers(users['harold'].user, users['harold'].user, function (err, followers1) {
            expect(err).to.be(null);
            expect(_.map(_.pluck(followers1, 'user_follower'), function (item) {
              return item.user.toString();
            })).to.contain(users['bill'].user);
            client.unFollowUser(users['bill'].user, users['harold'].user, function (err, result) {
              expect(err).to.be(null);
              addSample('unFollowUser', result);
              expect(result.status).to.be('removed');
              client.getFollowers(users['harold'].user, users['harold'].user, function (err, followers2) {
                expect(err).to.be(null);
                expect(followers2.length).to.be(0);
                done();
              });
            });
          });
        });
      });

    });

    describe('posts', function () {

      var timestamp = 1280296860145;

      it('can post a message from a user', function (done) {
        client.addPost(liu, 'Hello, this is a post', 'text/html', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.eql(users['cliftonc']);
          postId = post.post;
          done();
        });
      });

      it('can post a private message from a user using their altid with a specific timestamp', function (done) {
        client.addPost(liuAltId, 'Hello, this is a private post', 'text/html', timestamp, true, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.eql(users['cliftonc']);
          expect(api.client.getTimestamp(post.posted)).to.eql(api.client.getTimestamp(timestamp));
          privatePostId = post.post;
          done();
        });
      });

      it('anyone can retrieve a public post by id', function (done) {
        client.getPost(users['ted'].user, postId, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.eql(users['cliftonc']);
          addSample('getPost', post);
          done();
        });
      });

      it('anyone not a friend cant retrieve a private post by id', function (done) {
        client.getPost(users['ted'].user, privatePostId, function (err, post) {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('anyone who is a friend can retrieve a private post by id', function (done) {
        client.getPost(users['phteven'].user, privatePostId, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.eql(users['cliftonc']);
          expect(api.client.getTimestamp(post.posted)).to.eql(api.client.getTimestamp(timestamp));
          done();
        });
      });

      it('can remove a post', function (done) {
        client.addPost(liu, 'Why cant I live longer than a few milliseconds for once?', 'text/html', api.client.getTimestamp(), true, false, function (err, post) {
          expect(err).to.be(null);
          client.removePost(liu, post.post, function (err, result) {
            expect(err).to.be(null);
            addSample('removePost', result);
            client.getPost(users['phteven'].user, post.post, function (err, post) {
              expect(err.statusCode).to.be(404);
              done();
            });
          });
        });
      });

      it('can add a personal post', function (done) {
        client.addPost(users['jenny'].user, 'Only you may see me', 'text/html', api.client.getTimestamp(), false, true, function (err, post) {
          expect(err).to.be(null);
          client.getPost(users['jenny'].user, post.post, function (err, post) {
            expect(err).to.be(null);
            client.getPost(users['phteven'].user, post.post, function (err, post) {
              expect(err.statusCode).to.be(403);
              done();
            });
          });
        });
      });

      it('can post a message that contains an object with type application/json and it returns the object in the post and feed', function (done) {
        client.addPost(users['json'].user, {hello: 'world'}, 'application/json', api.client.getTimestamp(), false, false, function (err, post) {
          expect(err).to.be(null);
          expect(post.content.hello).to.be('world');
          addSample('addPost', post);
          client.getPost(users['json'].user, post.post, function (err, getPost) {
            expect(err).to.be(null);
            expect(getPost.content.hello).to.be('world');
            client.getFeed(users['json'].user, users['json'].user, null, 100, function (err, feed) {
              expect(err).to.be(null);
              expect(feed.feed[0].content.hello).to.be('world');
              done();
            });
          });
        });
      });

    });

    describe('likes', function () {

      it('can like an item from a user', function (done) {
        client.addLike(liu, 'http://github.com', function (err, like) {
          expect(err).to.be(null);
          expect(like.item).to.be(encodeURIComponent('http://github.com'));
          likeId = like.like;
          addSample('addLike', like);
          done();
        });
      });

      it('can retrieve a like by id', function (done) {
        client.getLike(liu, likeId, function (err, like) {
          expect(err).to.be(null);
          expect(like.item).to.be(encodeURIComponent('http://github.com'));
          expect(like.user).to.eql(users['cliftonc']);
          addSample('getLike', like);
          done();
        });
      });

      it('can check if a user likes an item', function (done) {
        client.checkLike(liu, 'http://github.com', function (err, like) {
          expect(err).to.be(null);
          expect(like.like).to.be(likeId);
          expect(like.user).to.eql(users['cliftonc']);
          addSample('checkLike', like);
          done();
        });
      });

      it('can remove a like', function (done) {
        client.addLike(liu, 'http://seguir.com', function (err, like) {
          expect(err).to.be(null);
          client.removeLike(liu, 'http://seguir.com', function (err, result) {
            expect(err).to.be(null);
            addSample('removeLike', result);
            client.checkLike(liu, 'http://seguir.com', function (err, like) {
              expect(err).to.be(null);
              expect(like.count).to.be(0);
              expect(like.user.user).to.eql(liu);
              addSample('checkNotLike', like);
              done();
            });
          });
        });
      });

    });

    describe('feeds', function () {

      it('logged in - can get a feed for yourself that is in the correct order', function (done) {
        client.getFeed(users['cliftonc'].user, users['cliftonc'].user, null, 100, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed).to.not.be(undefined);
          expect(feed[0].like).to.be(likeId);
          expect(feed[1].post).to.be(postId);
          expect(feed[2].follow).to.be(notFriendFollowId);
          expect(feed[3].follow).to.be(followId);
          expect(feed[4].friend).to.be(friendId);
          expect(feed[5].post).to.be(privatePostId);
          addSample('getFeed', result);
          done();
        });
      });

      it('logged in - can get a feed for yourself that is in the correct order - if LIU is username', function (done) {
        client.getFeed(users['cliftonc'].username, users['cliftonc'].user, null, 100, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed).to.not.be(undefined);
          expect(feed[0].like).to.be(likeId);
          expect(feed[1].post).to.be(postId);
          expect(feed[2].follow).to.be(notFriendFollowId);
          expect(feed[3].follow).to.be(followId);
          expect(feed[4].friend).to.be(friendId);
          expect(feed[5].post).to.be(privatePostId);
          done();
        });
      });

      it('logged in - can get a feed for yourself that is in the correct order - if LIU is altid', function (done) {
        client.getFeed(users['cliftonc'].altid, users['cliftonc'].user, null, 100, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed).to.not.be(undefined);
          expect(feed[0].like).to.be(likeId);
          expect(feed[1].post).to.be(postId);
          expect(feed[2].follow).to.be(notFriendFollowId);
          expect(feed[3].follow).to.be(followId);
          expect(feed[4].friend).to.be(friendId);
          expect(feed[5].post).to.be(privatePostId);
          done();
        });
      });

      it('logged in - can get a feed for a friend that is in the correct order', function (done) {
        client.getFeed(users['phteven'].user, users['cliftonc'].user, null, 100, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed[0].like).to.be(likeId);
          expect(feed[1].post).to.be(postId);
          expect(feed[2].follow).to.be(notFriendFollowId);
          expect(feed[3].follow).to.be(followId);
          expect(feed[4].friend).to.be(friendId);
          expect(feed[5].post).to.be(privatePostId); //
          done();
        });
      });

      it('logged in - can get a feed for a friend and follower that is in the correct order', function (done) {
        client.getFeed(users['cliftonc'].user, users['phteven'].user, null, 100, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed[0].like).to.be(likeId);
          expect(feed[1].post).to.be(postId);
          expect(feed[2].follow).to.be(notFriendFollowId);
          expect(feed[3].follow).to.be(followId);
          expect(feed[4].friend).to.be(reciprocalFriendId);
          expect(feed[5].post).to.be(privatePostId);
          done();
        });
      });

      it('logged in - can get a feed for a follower that is not a friend in the correct order', function (done) {
        client.getFeed(users['cliftonc'].user, users['ted'].user, null, 100, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed[0].like).to.be(likeId);
          expect(feed[1].post).to.be(postId);
          expect(feed[2].follow).to.be(followUserId);
          expect(feed[3].follow).to.be(notFriendFollowId);
          done();
        });
      });

      it('anonymous - can get a feed that is in correct order', function (done) {
        client.getFeed(null, users['cliftonc'].user, null, 100, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed[0].like).to.be(likeId);
          expect(feed[1].post).to.be(postId);
          expect(feed[2].follow).to.be(notFriendFollowId);
          done();
        });
      });

      it('logged in - can get a users personal feed as a friend and see direct items private or public', function (done) {
        client.getUserFeed(users['cliftonc'].user, users['phteven'].user, null, 100, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed[0].friend).to.be(reciprocalFriendId);
          addSample('getUserFeed', feed);
          done();
        });
      });

      it('logged in - can get a users personal feed as a friend and see direct items private or public by altids', function (done) {
        client.getUserFeed(users['cliftonc'].altid, users['phteven'].altid, null, 100, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed[0].friend).to.be(reciprocalFriendId);
          done();
        });
      });

      it('anonymous - can get a users personal feed anonymously and only see direct, public items', function (done) {
        client.getUserFeed(null, users['phteven'].user, null, 100, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed.length).to.be(0);
          done();
        });
      });

      it('logged in - paginate through a feed', function (done) {
        client.getFeed(users['cliftonc'].user, users['cliftonc'].user, null, 2, function (err, result) {
          var feed = result.feed;
          expect(err).to.be(null);
          expect(feed).to.not.be(undefined);
          expect(feed[0].like).to.be(likeId);
          expect(feed[1].post).to.be(postId);
          var nextFrom = result.more;
          client.getFeed(users['cliftonc'].user, users['cliftonc'].user, nextFrom, 2, function (err, result2) {
            var feed2 = result2.feed;
            expect(err).to.be(null);
            expect(feed2).to.not.be(undefined);
            expect(feed2[0].follow).to.be(notFriendFollowId);
            expect(feed2[1].follow).to.be(followId);
            nextFrom = result2.more;
            client.getFeed(users['cliftonc'].user, users['cliftonc'].user, nextFrom, 2, function (err, result3) {
              var feed3 = result3.feed;
              expect(err).to.be(null);
              expect(feed3).to.not.be(undefined);
              expect(result3.more).to.be(null);
              expect(feed3[0].friend).to.be(friendId);
              expect(feed3[1].post).to.be(privatePostId);
              done();
            });
          });
        });
      });

    });

    describe('relationships', function () {

      it('can query a relationship between a user and themselves', function (done) {
        client.getUserRelationship(users['cliftonc'].user, users['cliftonc'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(true);
          done();
        });
      });

      it('can query a relationship between a user and another user', function (done) {
        client.getUserRelationship(users['cliftonc'].user, users['phteven'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(true);
          addSample('getUserRelationship', relationship);
          done();
        });
      });

      it('can query the inverse relationship between a user and another user', function (done) {
        client.getUserRelationship(users['phteven'].user, users['cliftonc'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(true);
          expect(relationship.youFollow).to.be(true);
          expect(relationship.theyFollow).to.be(false);
          done();
        });
      });

      it('can query the relationship between users who have no relationship', function (done) {
        client.getUserRelationship(users['cliftonc'].user, users['bill'].user, function (err, relationship) {
          expect(err).to.be(null);
          expect(relationship.isFriend).to.be(false);
          expect(relationship.youFollow).to.be(false);
          expect(relationship.theyFollow).to.be(false);
          done();
        });
      });

      it('can query the relationship between user and the anonymous user', function (done) {
        client.getUserRelationship(null, users['bill'].user, function (err, relationship) {
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
            users: [users['cliftonc'].username, users['phteven'].username],
            backfill: '1d',
            isprivate: false,
            ispersonal: true
          }
        };

        client.addUser(null, 'shaun', 'baah', {type: 'sheep'}, initialise, function (err, user) {
          expect(err).to.be(null);
          client.getFeed(user.user, user.user, null, 50, function (err, feed) {
            expect(err).to.be(null);
            expect(_.last(feed.feed).post).to.eql(postId);
            done();
          });
        });

      });

      it('can optionally backfill a follow relationship and automatically populate their feed', function (done) {

        client.addUser(null, 'bitzer', 'woof', {type: 'dog'}, function (err, user) {
          expect(err).to.be(null);
          client.followUser(user.user, users['cliftonc'].user, false, false, '1d', function (err, follow) {
            expect(err).to.be(null);
            client.getFeed(user.user, user.user, null, 50, function (err, feed) {
              expect(err).to.be(null);
              expect(feed.feed[0].follow).to.eql(follow.follow);
              expect(feed.feed[1].post).to.eql(postId);
              done();
            });
          });
        });

      });

    });

  });

});
