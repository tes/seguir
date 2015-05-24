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

      messaging.listen('q1', function (data, jobDone) {
        counter++;
        console.log('Received on q1');
        jobDone();
      });

      messaging.listen('q2', function (data, jobDone) {
        counter++;
        console.log('Received on q2');
        jobDone();
      });

      messaging.submit('q1', {hello: 'world'});
      messaging.submit('q2', {hello: 'world'});

      setTimeout(function () {
        expect(counter).to.be(2);
        done();
      }, 2000);

    });

  });

});
