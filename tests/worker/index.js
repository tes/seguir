/**
 * Multiple queue workers
 */
var messaging = require('../../api/db/messaging')();
var cluster = require('cluster');
var numWorkers = 4;

messaging.client.set('seguir:test:counter', 0);

if(cluster.isMaster){
  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
} else {
  messaging.listen('seguir-test-queue', function(message, done) {
    messaging.client.incrby('seguir:test:counter', 1, done);
  });
}
