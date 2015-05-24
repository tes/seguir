/**
 * Acceptance test of redis primitives
 */

/*eslint-env node, mocha */

var expect = require('expect.js');
var messaging = require('../../api/db/messaging')({redis: {}});

describe('Messaging primitives', function () {

  this.timeout(5000);

  describe('Job queue', function () {

    it('redis client is working', function (done) {

      messaging.client.ping(function (err, result) {
        expect(err).to.be(null);
        expect(result).to.be('PONG');
        done();
      });

    });

    it('can create multiple queues and consume messages', function (done) {

      var counter = 0;

      messaging.submit('q1', {hello: 'world'}, function (err, response) {
        console.dir(err);
        console.dir(response);
      });

      messaging.submit('q2', {hello: 'world'});

      messaging.listen('q1', function (data, jobDone) {
        counter++;
        jobDone();
      });

      messaging.listen('q2', function (data, jobDone) {
        counter++;
        jobDone();
      });

      setTimeout(function () {
        expect(counter).to.be(2);
        done();
      }, 1000);

    });

  });

});
