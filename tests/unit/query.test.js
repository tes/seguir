/* eslint-env node, mocha */

var expect = require('expect.js');
var q = require('../../db/cassandra/queries');

describe('Queries', function () {
  describe('query selection', function () {
    it('looks up a query based on name', function (done) {
      expect(q('seguir', 'selectFriend')).to.contain('SELECT friend');
      done();
    });

    it('can specify extra type', function (done) {
      expect(q('seguir', 'selectTimeline', {TYPEQUERY: 'hello-world'})).to.contain('hello-world');
      done();
    });
  });
});
