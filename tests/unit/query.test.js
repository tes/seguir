'use strict';

var expect = require('expect.js');
var q = require('../../api/db/queries');

describe('Queries', function() {

    describe('query selection', function () {

      it('looks up a query based on name', function(done) {
        expect(q('seguir','selectFriend')).to.contain('SELECT friend');
        done();
      });

      it('can specify extra data', function(done) {
        expect(q('seguir','selectTimeline', {timeClause:'hello-world'})).to.contain('hello-world');
        done();
      });

    });

});
