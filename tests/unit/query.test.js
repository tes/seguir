/* eslint-env node, mocha */

const expect = require('expect.js');
const q = require('../../db/cassandra/queries');

describe('Queries', () => {
  describe('query selection', () => {
    it('looks up a query based on name', (done) => {
      expect(q('seguir', 'selectFriend')).to.contain('SELECT friend');
      done();
    });

    it('can specify extra type', (done) => {
      expect(q('seguir', 'selectTimeline', { TYPEQUERY: 'hello-world' })).to.contain('hello-world');
      done();
    });
  });
});
