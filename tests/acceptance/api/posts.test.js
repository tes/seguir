/**
 * Posts
 */

/*eslint-env node, mocha */

var keyspace = 'test_seguir_app_api';
var expect = require('expect.js');
var initialiser = require('../../fixtures/initialiser');
var databases = process.env.DATABASE ? [process.env.DATABASE] : ['postgres', 'cassandra-redis'];
var _ = require('lodash');

databases.forEach(function (db) {

  var config = _.clone(require('../../fixtures/' + db + '.json'));
  config.keyspace = keyspace;

  describe('API [Posts] - ' + db, function () {

    this.timeout(10000);
    this.slow(5000);

    var api, users = {}, postId, privatePostId;

    before(function (done) {
      this.timeout(20000);
      initialiser.setupApi(keyspace, config, function (err, seguirApi) {
        expect(err).to.be(null);
        api = seguirApi;
        initialiser.setupUsers(keyspace, api, [
          {username: 'cliftonc', altid: '1'},
          {username: 'phteven', altid: '2'},
          {username: 'ted', altid: '3'},
          {username: 'bill', altid: '4'},
          {username: 'harold', altid: '5'},
          {username: 'jenny', altid: '6'},
          {username: 'alfred', altid: '7'},
          {username: 'json', altid: '8'}
        ], function (err, userMap) {
          expect(err).to.be(null);
          users = userMap;
          done();
        });
      });
    });

    describe('posts', function () {

      var timestamp = new Date(1280296860145);

      it('can post a message from a user', function (done) {
        api.post.addPost(keyspace, users['cliftonc'].user, 'Hello, this is a post', 'text/html', api.client.getTimestamp(), api.visibility.PUBLIC, 'ALTID', function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.eql(users['cliftonc']);
          postId = post.post;
          done();
        });
      });

      it('can post a private message from a user with a specific timestamp', function (done) {
        api.post.addPost(keyspace, users['cliftonc'].user, 'Hello, this is a private post', 'text/html', timestamp, api.visibility.PRIVATE, function (err, post) {
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
        api.friend.addFriend(keyspace, users['cliftonc'].user, users['phteven'].user, api.client.getTimestamp(), function (err, friend) {
          expect(err).to.be(null);
          api.post.getPost(keyspace, users['phteven'].user, privatePostId, function (err, post) {
            expect(err).to.be(null);
            expect(post.content).to.be('Hello, this is a private post');
            expect(post.user).to.eql(users['cliftonc']);
            expect(post.posted).to.eql(timestamp);
            done();
          });
        });
      });

      it('you can mention yourself in a post', function (done) {
        api.post.addPost(keyspace, users['harold'].user, 'Who am I? @harold', 'text/html', api.client.getTimestamp(), api.visibility.PUBLIC, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Who am I? @harold');
          done();
        });
      });

      it('you can mention someone in a post', function (done) {
        api.post.addPost(keyspace, users['bill'].user, 'Hello, this is a post mentioning @harold', 'text/html', api.client.getTimestamp(), api.visibility.PUBLIC, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post mentioning @harold');
          done();
        });
      });

      it('sanitizes any input by default', function (done) {
        api.post.addPost(keyspace, users['jenny'].user, 'Evil hack <IMG SRC=j&#X41vascript:alert(\'test2\')>', 'text/html', api.client.getTimestamp(), api.visibility.PUBLIC, function (err, post) {
          expect(err).to.be(null);
          expect(post.content).to.be('Evil hack ');
          expect(post.user).to.eql(users['jenny']);
          done();
        });
      });

      it('can add and remove a post', function (done) {
        api.post.addPost(keyspace, users['jenny'].user, 'I am but a fleeting message in the night', 'text/html', api.client.getTimestamp(), api.visibility.PUBLIC, function (err, post) {
          expect(err).to.be(null);
          api.post.removePost(keyspace, users['jenny'].user, post.post, function (err, result) {
            expect(err).to.be(null);
            api.feed.getRawFeed(keyspace, users['jenny'].user, users['jenny'].user, function (err, feed) {
              expect(err).to.be(null);
              var ids = _.map(_.pluck(feed, 'item'), function (item) { return item.toString(); });
              expect(ids).to.not.contain(post.post.toString());
              done();
            });
          });
        });
      });

      it('you can add a completely personal post that only appears in the users feed', function (done) {
        api.post.addPost(keyspace, users['jenny'].user, 'Shh - this is only for me.', 'text/html', api.client.getTimestamp(), api.visibility.PERSONAL, function (err, post) {
          expect(err).to.be(null);
          api.feed.getFeed(keyspace, users['harold'].user, users['jenny'].user, function (err, feed) {
            expect(err).to.be(null);
            var ids = _.map(_.pluck(feed, 'post'), function (item) { return item.toString(); });
            expect(ids).to.not.contain(post.post.toString());
            done();
          });
        });
      });

      it('can post a message that contains an object with type application/json and it returns the object in the post and feed', function (done) {
        api.post.addPost(keyspace, users['json'].user, {hello: 'world'}, 'application/json', api.client.getTimestamp(), api.visibility.PUBLIC, function (err, post) {
          expect(err).to.be(null);
          expect(post.content.hello).to.be('world');
          api.post.getPost(keyspace, users['json'].user, post.post, function (err, getPost) {
            expect(err).to.be(null);
            expect(getPost.content.hello).to.be('world');
            api.feed.getFeed(keyspace, users['json'].user, users['json'].user, function (err, feed) {
              expect(err).to.be(null);
              expect(feed[0].content.hello).to.be('world');
              done();
            });
          });
        });
      });

      it('cant post an invalid message that contains an object with type application/json', function (done) {
        api.post.addPost(keyspace, users['json'].user, '{"hello":bob}', 'application/json', api.client.getTimestamp(), api.visibility.PUBLIC, function (err, post) {
          expect(err.message).to.be('Unable to parse input content, post not saved.');
          done();
        });
      });

      it('can update an existing post by id', function (done) {
        api.post.updatePost(keyspace, postId, 'CHANGED!', 'text/html', api.visibility.PUBLIC, function (err, post) {
          expect(err).to.be(null);
          api.post.getPost(keyspace, users['json'].user, postId, function (err, getPost) {
            expect(err).to.be(null);
            expect(getPost.content).to.be('CHANGED!');
            done();
          });
        });
      });

      it('can update an existing post by altid', function (done) {
        api.post.updatePostByAltid(keyspace, 'ALTID', 'CHANGED AGAIN', 'text/html', api.visibility.PUBLIC, function (err, post) {
          expect(err).to.be(null);
          api.post.getPostByAltid(keyspace, users['json'].user, 'ALTID', function (err, getPost) {
            expect(err).to.be(null);
            expect(getPost.content).to.be('CHANGED AGAIN');
            done();
          });
        });
      });

      it('cant create, retrieve and delete a post by altid', function (done) {
        api.post.addPost(keyspace, users['json'].user, '{"hello":"world"}', 'application/json', api.client.getTimestamp(), api.visibility.PUBLIC, 'P-1234', function (err, post) {
          expect(err).to.be(null);
          expect(post.altid).to.be('P-1234');
          api.post.getPostByAltid(keyspace, users['json'].user, 'P-1234', function (err, retrievedPost) {
            expect(err).to.be(null);
            expect(retrievedPost.altid).to.be('P-1234');
            api.post.removePostByAltid(keyspace, users['json'].user, 'P-1234', function (err, status) {
              expect(err).to.be(null);
              expect(status.status).to.be('removed');
              api.post.getPostByAltid(keyspace, users['json'].user, 'P-1234', function (err, retrievedPost) {
                expect(err.statusCode).to.be(404);
                done();
              });
            });
          });
        });
      });
    });

  });

});

