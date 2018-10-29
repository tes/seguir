/**
 * Acceptance test of redis primitives
 */

/* eslint-env node, mocha */

const expect = require('expect.js');
const messaging = require('../../../db/messaging')({messaging: {}});

describe('Messaging primitives', function () {
  this.timeout(5000);

  after(() => {
    messaging.shutdown();
  });

  describe('Job queue', () => {
    it('redis client is working', (done) => {
      messaging.client.ping((err, result) => {
        expect(err).to.be(null);
        expect(result).to.be('PONG');
        done();
      });
    });

    it('can publish and subscribe', (done) => {
      messaging.subscribe('test', (msg) => {
        expect(msg.hello).to.be('world');
        done();
      });

      setTimeout(() => {
        messaging.publish('test', {hello: 'world'});
      }, 200);
    });

    it('can create multiple queues and consume messages', (done) => {
      let counter = 0;

      messaging.listen('q1', (data, jobDone) => {
        counter++;
        jobDone();
      });

      messaging.listen('q2', (data, jobDone) => {
        counter++;
        jobDone();
      });

      messaging.submit('q1', {hello: 'world'});
      messaging.submit('q2', {hello: 'world'});

      setTimeout(() => {
        expect(counter).to.be(2);
        done();
      }, 1000);
    });
  });
});
