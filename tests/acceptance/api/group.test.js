/* eslint-env node, mocha */
const keyspace = 'test_seguir_app_api';
const expect = require('expect.js');
const initialiser = require('../../fixtures/initialiser');
const databases = process.env.DATABASE ? [process.env.DATABASE] : ['cassandra-redis'];
const _ = require('lodash');

databases.forEach((db) => {
  const config = _.clone(require(`../../fixtures/${db}.json`));
  config.keyspace = keyspace;

  describe(`API [Group] - ${db}`, function () {
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

    describe('group', () => {
      it('can create a public group', (done) => {
        api.group.addGroup(keyspace, 'A public group', '1', users['cliftonc'].user, api.client.getTimestamp(), { groupData: { description: 'this is a public group....', image: '/img/1.png' } }, '1', (err, group) => {
          expect(err).to.be(null);
          expect(group.groupname).to.be('A public group');
          expect(group.member_from_supergroupid).to.be('1');
          expect(group.is_private).to.be(false);
          done();
        });
      });

      it('can create a private group', (done) => {
        api.group.addPrivateGroup(keyspace, 'A private group', '1', users['cliftonc'].user, api.client.getTimestamp(), { groupData: { description: 'this is a private group....', image: '/img/1.png' } }, '1', (err, group) => {
          expect(err).to.be(null);
          expect(group.groupname).to.be('A private group');
          expect(group.member_from_supergroupid).to.be('1');
          expect(group.is_private).to.be(true);
          done();
        });
      });

      it('can join a group under a supergroup', (done) => {
        api.group.addGroup(keyspace, 'No Nonsense', '1', users['cliftonc'].user, api.client.getTimestamp(), { groupData: { description: 'this is a no nonsense group....', image: '/img/1.png' } }, '1', (err, group) => {
          expect(err).to.be(null);
          expect(group.groupname).to.be('No Nonsense');
          expect(group.member_from_supergroupid).to.be('1');
          api.group.joinGroup(keyspace, group.group, users['phteven'].user, api.client.getTimestamp(), '2', (err, result) => {
            expect(err).to.be(null);
            expect(result.group).to.be(group.group);
            expect(result.user).to.be(users['phteven'].user);
            expect(result.from_supergroupid).to.be('2');
            done();
          });
        });
      });
    });
  });
});
