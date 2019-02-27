/**
 * Posts
 */

/* eslint-env node, mocha */

const keyspace = 'test_seguir_app_api';
const expect = require('expect.js');
const initialiser = require('../../fixtures/initialiser');
const databases = process.env.DATABASE ? [process.env.DATABASE] : ['cassandra-redis'];
const _ = require('lodash');

databases.forEach((db) => {
  const config = _.clone(require(`../../fixtures/${db}.json`));
  config.keyspace = keyspace;

  describe(`API [Posts] - ${db}`, function () {
    this.timeout(20000);
    this.slow(5000);

    let api;
    let users = {};
    let postId;
    let privatePostId;

    before(function (done) {
      this.timeout(20000);
      initialiser.setupApi(keyspace, config, (err, seguirApi) => {
        expect(err).to.be(null);
        api = seguirApi;
        initialiser.setupUsers(keyspace, api, [
          { username: 'cliftonc', altid: '1' },
          { username: 'phteven', altid: '2' },
          { username: 'ted', altid: '3' },
          { username: 'bill', altid: '4' },
          { username: 'harold', altid: '5' },
          { username: 'jenny', altid: '6' },
          { username: 'alfred', altid: '7' },
          { username: 'json', altid: '8' },
        ], (err, userMap) => {
          expect(err).to.be(null);
          users = userMap;
          done();
        });
      });
    });
    describe('posts', () => {
      const timestamp = new Date(1280296860000);

      it('can post a message from a user', (done) => {
        api.post.addPost(keyspace, users['cliftonc'].user, 'Hello, this is a post', 'text/html', api.client.getTimestamp(), api.visibility.PUBLIC, 'ALTID', (err, post) => {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.eql(users['cliftonc']);
          postId = post.post;
          done();
        });
      });

      it('can post a private message from a user with a specific timestamp', (done) => {
        api.post.addPost(keyspace, users['cliftonc'].user, 'Hello, this is a private post', 'text/html', timestamp, api.visibility.PRIVATE, (err, post) => {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a private post');
          expect(post.user).to.eql(users['cliftonc']);
          expect(post.posted).to.eql(timestamp);
          privatePostId = post.post;
          done();
        });
      });

      it('anyone can retrieve a public post by id', (done) => {
        api.post.getPost(keyspace, users['ted'].user, postId, (err, post) => {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post');
          expect(post.user).to.eql(users['cliftonc']);
          done();
        });
      });

      it('anyone not a friend cant retrieve a private post by id', (done) => {
        api.post.getPost(keyspace, users['ted'].user, privatePostId, (err) => {
          expect(err.statusCode).to.be(403);
          done();
        });
      });

      it('anyone who is a friend can retrieve a private post by id', (done) => {
        api.friend.addFriend(keyspace, users['cliftonc'].user, users['phteven'].user, api.client.getTimestamp(), (err) => {
          expect(err).to.be(null);
          api.post.getPost(keyspace, users['phteven'].user, privatePostId, (err, post) => {
            expect(err).to.be(null);
            expect(post.content).to.be('Hello, this is a private post');
            expect(post.user).to.eql(users['cliftonc']);
            expect(post.posted.toString()).to.eql(timestamp.toString());
            done();
          });
        });
      });

      it('you can mention yourself in a post', (done) => {
        api.post.addPost(keyspace, users['harold'].user, 'Who am I? @harold', 'text/html', api.client.getTimestamp(), api.visibility.PUBLIC, (err, post) => {
          expect(err).to.be(null);
          expect(post.content).to.be('Who am I? @harold');
          done();
        });
      });

      it('you can mention someone in a post', (done) => {
        api.post.addPost(keyspace, users['bill'].user, 'Hello, this is a post mentioning @harold', 'text/html', api.client.getTimestamp(), api.visibility.PUBLIC, (err, post) => {
          expect(err).to.be(null);
          expect(post.content).to.be('Hello, this is a post mentioning @harold');
          done();
        });
      });

      it('sanitizes any input by default', (done) => {
        api.post.addPost(keyspace, users['jenny'].user, 'Evil hack <IMG SRC=j&#X41vascript:alert(\'test2\')>', 'text/html', api.client.getTimestamp(), api.visibility.PUBLIC, (err, post) => {
          expect(err).to.be(null);
          expect(post.content).to.be('Evil hack ');
          expect(post.user).to.eql(users['jenny']);
          done();
        });
      });

      it('can add and remove a post', (done) => {
        api.post.addPost(keyspace, users['jenny'].user, 'I am but a fleeting message in the night', 'text/html', api.client.getTimestamp(), api.visibility.PUBLIC, (err, post) => {
          expect(err).to.be(null);
          api.post.removePost(keyspace, users['jenny'].user, post.post, (err) => {
            expect(err).to.be(null);
            api.feed.getRawFeed(keyspace, users['jenny'].user, users['jenny'].user, (err, feed) => {
              expect(err).to.be(null);
              const ids = _.map(_.map(feed, 'item'), (item) => item.toString());
              expect(ids).to.not.contain(post.post.toString());
              done();
            });
          });
        });
      });

      it('you can add a completely personal post that only appears in the users feed', (done) => {
        api.post.addPost(keyspace, users['jenny'].user, 'Shh - this is only for me.', 'text/html', api.client.getTimestamp(), api.visibility.PERSONAL, (err, post) => {
          expect(err).to.be(null);
          api.feed.getFeed(keyspace, users['harold'].user, users['jenny'].user, (err, { feed }) => {
            expect(err).to.be(null);
            const ids = _.map(_.map(feed, 'post'), (item) => item.toString());
            expect(ids).to.not.contain(post.post.toString());
            done();
          });
        });
      });

      it('can post a message that contains an object with type application/json and it returns the object in the post and feed', (done) => {
        api.post.addPost(keyspace, users['json'].user, { hello: 'world' }, 'application/json', api.client.getTimestamp(), api.visibility.PUBLIC, (err, post) => {
          expect(err).to.be(null);
          expect(post.content.hello).to.be('world');
          api.post.getPost(keyspace, users['json'].user, post.post, (err, getPost) => {
            expect(err).to.be(null);
            expect(getPost.content.hello).to.be('world');
            api.feed.getFeed(keyspace, users['json'].user, users['json'].user, (err, { feed }) => {
              expect(err).to.be(null);
              expect(feed[0].content.hello).to.be('world');
              done();
            });
          });
        });
      });

      it('cant post an invalid message that contains an object with type application/json', (done) => {
        api.post.addPost(keyspace, users['json'].user, '{"hello":bob}', 'application/json', api.client.getTimestamp(), api.visibility.PUBLIC, (err) => {
          expect(err.message).to.be('Unable to parse input content, post not saved.');
          done();
        });
      });

      it('can update an existing post by id', (done) => {
        api.post.updatePost(keyspace, users['cliftonc'].user, postId, 'CHANGED!', 'text/html', api.visibility.PUBLIC, (err) => {
          expect(err).to.be(null);
          api.post.getPost(keyspace, users['json'].user, postId, (err, getPost) => {
            expect(err).to.be(null);
            expect(getPost.content).to.be('CHANGED!');
            done();
          });
        });
      });

      it('can update an existing post by altid', (done) => {
        api.post.updatePostByAltid(keyspace, 'ALTID', 'CHANGED AGAIN', 'text/html', api.visibility.PUBLIC, (err) => {
          expect(err).to.be(null);
          api.post.getPostByAltid(keyspace, users['json'].user, 'ALTID', (err, getPost) => {
            expect(err).to.be(null);
            expect(getPost.content).to.be('CHANGED AGAIN');
            done();
          });
        });
      });

      it('can create, retrieve and delete a post by altid', (done) => {
        api.post.addPost(keyspace, users['json'].user, '{"hello":"world"}', 'application/json', api.client.getTimestamp(), api.visibility.PUBLIC, 'P-1234', (err, post) => {
          expect(err).to.be(null);
          expect(post.altid).to.be('P-1234');
          api.post.getPostByAltid(keyspace, users['json'].user, 'P-1234', (err, retrievedPost) => {
            expect(err).to.be(null);
            expect(retrievedPost.altid).to.be('P-1234');
            api.post.removePostByAltid(keyspace, users['json'].user, 'P-1234', (err, status) => {
              expect(err).to.be(null);
              expect(status.status).to.be('removed');
              api.post.getPostByAltid(keyspace, users['json'].user, 'P-1234', (err) => {
                expect(err.statusCode).to.be(404);
                done();
              });
            });
          });
        });
      });

      it('can create, retrieve and delete multiple posts by altid', (done) => {
        api.post.addPost(keyspace, users['json'].user, '{"hello":"world"}', 'application/json', api.client.getTimestamp(), api.visibility.PUBLIC, 'P-1234', (err, newpost) => {
          expect(err).to.be(null);
          expect(newpost.altid).to.be('P-1234');
          api.post.addPost(keyspace, users['json'].user, '{"hello":"world"}', 'application/json', api.client.getTimestamp(), api.visibility.PERSONAL, 'P-1234', (err, post) => {
            expect(err).to.be(null);
            expect(post.altid).to.be('P-1234');
            api.post.getPostsByAltid(keyspace, users['json'].user, 'P-1234', (err, retrievedNewPosts) => {
              expect(err).to.be(null);
              expect(retrievedNewPosts[0].altid).to.be('P-1234');
              expect(retrievedNewPosts[1].altid).to.be('P-1234');
              api.post.removePostsByAltid(keyspace, users['cliftonc'].user, 'P-1234', (err, status) => {
                expect(err).to.be(null);
                expect(status.status).to.be('removed');
                api.post.getPostsByAltid(keyspace, users['json'].user, 'P-1234', (err, retrievedPosts) => {
                  expect(err).to.be(null);
                  expect(retrievedPosts.length).to.be(1);
                  done();
                });
              });
            });
          });
        });
      });

      it.only('can post message to interested users feed', (done) => {
        const australia = { type: 'country', keyword: 'australia' };
        const primary = { type: 'workplace', keyword: 'primary' };
        const filterPost = (feed, id) => feed.filter(({ type }) => type === 'post').map(({ post }) => post.toString()).filter((postId) => postId === id);
        api.interest.upsertInterests(keyspace, users['alfred'].user, [australia, primary], (err) => {
          expect(err).to.be(null);
          api.interest.upsertInterests(keyspace, users['cliftonc'].user, [australia], (err) => {
            expect(err).to.be(null);
            api.post.addPostToInterestedUsers(keyspace, users['json'].user, { hello: 'This is australian...' }, [australia, primary], 'application/json', api.client.getTimestamp(), api.visibility.PUBLIC, 'P-1234', (err, post) => {
              expect(err).to.be(null);
              api.feed.getFeed(keyspace, users['alfred'].user, users['alfred'].user, (err, { feed }) => {
                expect(err).to.be(null);
                expect(filterPost(feed, post.post.toString())).to.have.length(1);
                api.feed.getFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, (err, { feed }) => {
                  expect(err).to.be(null);
                  expect(filterPost(feed, post.post.toString())).to.have.length(1);
                  api.feed.getFeed(keyspace, users['ted'].user, users['ted'].user, (err, { feed }) => {
                    expect(err).to.be(null);
                    expect(filterPost(feed, post.post.toString())).to.have.length(0);
                    // the author should get the post as well
                    api.feed.getFeed(keyspace, users['json'].user, users['json'].user, (err, { feed }) => {
                      expect(err).to.be(null);
                      expect(filterPost(feed, post.post.toString())).to.have.length(1);
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });

      it('can post message to interested users feed by paging', (done) => {
        const australia = { type: 'country', keyword: 'australia' };
        const filterPost = (feed, id) => feed.filter(({ type }) => type === 'post').map(({ post }) => post.toString()).filter((postId) => postId === id);
        api.interest.upsertInterests(keyspace, users['cliftonc'].user, [australia], (err) => {
          expect(err).to.be(null);
          api.post.addPostToInterestedUsers(keyspace, users['json'].user, { hello: 'This is australian...' }, [australia], 'application/json', api.client.getTimestamp(), api.visibility.PUBLIC, 'P-1234', (err, post) => {
            expect(err).to.be(null);
            api.feed.getFeed(keyspace, users['cliftonc'].user, users['cliftonc'].user, (err, { feed }) => {
              expect(err).to.be(null);
              expect(filterPost(feed, post.post.toString())).to.have.length(1);
              api.feed.getFeed(keyspace, users['ted'].user, users['ted'].user, (err, { feed }) => {
                expect(err).to.be(null);
                expect(filterPost(feed, post.post.toString())).to.have.length(0);
                done();
              });
            });
          });
        });
      });
    });
  });
});
