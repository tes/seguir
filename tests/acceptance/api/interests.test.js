/* eslint-env node, mocha */
const keyspace = 'test_seguir_app_api';
const expect = require('expect.js');
const initialiser = require('../../fixtures/initialiser');
const databases = process.env.DATABASE ? [process.env.DATABASE] : ['cassandra-redis'];
const _ = require('lodash');

databases.forEach((db) => {
  const config = _.clone(require(`../../fixtures/${db}.json`));
  config.keyspace = keyspace;

  describe(`API [Interests] - ${db}`, function () {
    this.timeout(20000);
    this.slow(5000);

    let api;
    let users = {};

    before((done) => {
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

    describe('interests', () => {
      it('can add user\'s interest and retrieve multiple users by interest', (done) => {
        api.interest.upsertInterests(keyspace, users['cliftonc'].user, [{ type: 'subject', keyword: 'english' }, { type: 'workplace', keyword: 'primary' }], (err) => {
          expect(err).to.be(null);
          api.interest.upsertInterests(keyspace, users['cliftonc'].user, [{ type: 'subject', keyword: 'math' }, { type: 'workplace', keyword: 'primary' }], (err) => {
            expect(err).to.be(null);
            api.interest.upsertInterests(keyspace, users['ted'].user, [{ type: 'subject', keyword: 'english' }, { type: 'workplace', keyword: 'primary' }], (err) => {
              expect(err).to.be(null);
              api.interest.getUsers(keyspace, 'subject', 'english', (err, results) => {
                expect(err).to.be(null);
                const interestedUsers = results.map((result) => result.user.toString());
                expect(interestedUsers.length).to.be(1);
                expect(interestedUsers).to.contain(users['ted'].user.toString());
                api.interest.getUsers(keyspace, 'workplace', 'primary', (err, results) => {
                  expect(err).to.be(null);
                  const interestedUsers = results.map((result) => result.user.toString());
                  expect(interestedUsers.length).to.be(2);
                  expect(interestedUsers).to.contain(users['cliftonc'].user.toString());
                  expect(interestedUsers).to.contain(users['ted'].user.toString());
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
});
