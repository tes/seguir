/**
 * Acceptance test of redis primitives
 */
'use strict';

var expect = require('expect.js');
var async = require('async');
var _ = require('lodash');
var path = require('path');
var spawn = require('child_process').spawn;
var messaging = require('../../api/db/messaging')();

describe('Messaging primitives', function() {

    this.timeout(5000);

    describe('Job queue', function () {

      it('can spawn multiple workers where only one responds', function(done) {

        var workers = spawn('node', [path.resolve('tests', 'worker')]);

        setTimeout(function() {
          messaging.submit('seguir-test-queue', {hello:'world'});
          setTimeout(function() {
            messaging.client.get('seguir:test:counter', function(err, result) {
              expect(result).to.be('1');
              done();
            });
          }, 500)
        }, 500);

      });

      it('can create multiple queues', function(done) {

        var counter = 0;
        messaging.listen('q1', function(data, jobDone) {
          counter++;
          jobDone();
        });

        messaging.listen('q2', function(data, jobDone) {
          counter++;
          jobDone();
        });

        messaging.submit('q1', {hello:'world'});
        messaging.submit('q2', {hello:'world'});

        setTimeout(function() {
          expect(counter).to.be(2);
          done();
        }, 500)

      });

    });

});
