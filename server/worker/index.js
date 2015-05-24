/**
 * A worker will listen for jobs on the job queue, and execute them.
 */
var async = require('async');

function bootstrapWorker (config, next) {

  var client = require('../../api/db/client')(config);
  var messaging = require('../../api/db/messaging')(config);
  var api = require('../../index')(client, messaging, config.keyspace);

  var follower = function (cb) {
    messaging.listen('seguir-publish-to-followers', function (data, next) {
      api.manage.insertFollowersTimeline(data, next);
    }, cb);
  };

  var mentions = function (cb) {
    messaging.listen('seguir-publish-mentioned', function (data, cb) {
      api.manage.insertMentionedTimeline(data, cb);
    }, cb);
  };

  async.series([
    follower,
    mentions
  ], function () {
    console.log('Seguir worker ready for work ...');
    return next && next();
  });

}

/* istanbul ignore if */
if (require.main === module) {
  var config = require('../config');
  bootstrapWorker(config);
} else {
  // Used for testing
  module.exports = bootstrapWorker;
}
