/**
 * A worker will listen for jobs on the job queue, and execute them.
 */
var async = require('async');
var moment = require('moment');
var _ = require('lodash');

function bootstrapWorker(config) {

  var client = require('../api/db/client')(config);
  var messaging = require('../api/db/messaging')(config);
  var api = require('../index')(client, messaging, config.keyspace);

  messaging.listen('seguir:publish-to-followers', function(data, done) {
    api.manage.insertFollowersTimeline(data, done);
  });

  messaging.listen('seguir:process-mentioned', function(data, done) {
    api.manage.insertMentionedTimeline(data, done);
  });

  console.log('Seguir worker ready for work ...');

}

/* istanbul ignore if */
if(require.main === module) {
  var config = require('../server/config');
  bootstrapWorker(config);
} else {
  // Used for testing
  module.exports = bootstrapWorker;
}
