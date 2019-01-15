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
        api.interest.addInterest(keyspace, users['cliftonc'].user, 'subject', 'english', (err, interest) => {
          expect(err).to.be(null);
          expect(interest.user).to.be(users['cliftonc'].user);
          expect(interest.type).to.be('subject');
          expect(interest.keyword).to.be('english');
          api.interest.addInterest(keyspace, users['phteven'].user, 'subject', 'english', (err, interest) => {
            expect(err).to.be(null);
            expect(interest.user).to.be(users['phteven'].user);
            expect(interest.type).to.be('subject');
            expect(interest.keyword).to.be('english');
            api.interest.addInterest(keyspace, users['ted'].user, 'subject', 'english', (err, interest) => {
              expect(interest.user).to.be(users['ted'].user);
              expect(interest.type).to.be('subject');
              expect(interest.keyword).to.be('english');
              api.interest.getUsers(keyspace, 'subject', 'english', (err, results) => {
                expect(err).to.be(null);
                const interestedUsers = results.map((result) => result.user.toString());
                expect(interestedUsers.length).to.be(3);
                expect(interestedUsers).to.contain(users['ted'].user.toString());
                expect(interestedUsers).to.contain(users['phteven'].user.toString());
                expect(interestedUsers).to.contain(users['cliftonc'].user.toString());
                done();
              });
            });
          });
        });
      });
    });
  });
});
