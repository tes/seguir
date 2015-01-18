'use strict';

var expect = require('expect.js');
var q = require('../../api/queries')('seguir');

describe('Queries', function() {

    describe('query selection', function () {

      it('looks up a query based on name', function(done) {
        expect(q('selectFriend')).to.contain('SELECT friend');
        done();
      });

      it('can over-ride the keyspace in the query', function(done) {
        expect(q('selectFriend', {KEYSPACE:'new-keyspace'})).to.contain('new-keyspace');
        done();
      });

      it('can specify extra data', function(done) {
        expect(q('selectTimeline', {timeClause:'hello-world'})).to.contain('hello-world');
        done();
      });

    });

});
