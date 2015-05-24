var redis = require('redis');
var _ = require('lodash');
var RSMQ = require('rsmq');
var RSMQWorker = require('rsmq-worker');

module.exports = function (config) {

  if (!config || !config.redis) {
    return { enabled: false };
  }

  var redisClient = client(config);
  var rsmq = new RSMQ({host: redisClient.connectionOption.host, port: redisClient.connectionOption.port, ns: 'rsmq'});

  /**
   * Create queues on demand on first use
   */
  function createOrSelectQueue (name, next) {
    rsmq.listQueues(function (err, queues) {
      if (err) { return next(err); }
      if (_.contains(queues, name)) { return next(); }
      rsmq.createQueue({qname: name}, function (err) {
        next(err);
      });
    });
  }

  /**
   * Submit a job for processing
   */
  function submit (name, data, next) {
    createOrSelectQueue(name, function (err) {
      if (err && err.name !== 'queueExists') { return next && next(err); }
      rsmq.sendMessage({qname: name, message: JSON.stringify(data)}, function (err, response) {
        if (err) { return next && next(err); }
        return next && next(null, response);
      });
    });
  }

  /**
   * Listen to a queue to process jobs
   */
  function listen (name, callback, next) {
    var worker = new RSMQWorker(name, {rsmq: rsmq, autostart: true, interval: [0.1, 0.2, 0.5, 1, 2, 3, 5]});
    worker.on('message', function (msg, cb) {
      callback(JSON.parse(msg), cb);
    });
    return next && next();
  }

  /**
   * Publish a notification onto a pubsub topic
   */
  function publish (topic, data) {

  }

  /**
   * Subscribe to a pubsub topic
   */
  function subscribe (topic, callback) {

  }

  return {
    submit: submit,
    listen: listen,
    publish: publish,
    subscribe: subscribe,
    client: redisClient,
    enabled: true
  };

};

function client (config) {

  var redisConfig = config && config.redis ? config.redis : {};
  redisConfig = _.defaults(config && config.redis || {}, { host: 'localhost', port: 6379, options: { } });
  redisConfig.options.retry_max_delay = redisConfig.options.retry_max_delay || 10000;

  var redisClient = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);

  redisClient.on('error', function (err) {
    console.error('Error connecting to redis [%s:%s] - %s', redisConfig.host, redisConfig.port, err.message);
  });

  redisClient.on('ready', function () {
    // Do nothing - assume success unless proven otherwise
  });

  redisClient.select(redisConfig.db || 0);

  return redisClient;

}
