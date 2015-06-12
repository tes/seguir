/**
 * A worker will listen for jobs on the job queue, and execute them.
 */
var async = require('async');

function bootstrapWorker (api, next) {

  var follower = function (cb) {
    api.messaging.listen('seguir-publish-to-followers', function (data, next) {
      api.feed.insertFollowersTimeline(data, next);
    }, cb);
  };

  var mentions = function (cb) {
    api.messaging.listen('seguir-publish-mentioned', function (data, cb) {
      api.feed.insertMentionedTimeline(data, cb);
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
  var config = require('../config')();
  require('../../api')(config, function (err, api) {
    if (err) { return process.exit(0); }
    bootstrapWorker(api);
  });
} else {
  // Used for testing
  module.exports = bootstrapWorker;
}
