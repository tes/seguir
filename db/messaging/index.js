const redis = require('../redis');
const _ = require('lodash');
const RSMQ = require('rsmq');
const RSMQWorker = require('rsmq-worker');
const clients = [];

const client = (config) => {
  const redisConfig = config && config.messaging ? config.messaging : {};
  const redisClient = redis(redisConfig);

  // Keep a reference to it for later shutdown
  clients.push(redisClient);

  return redisClient;
};

module.exports = config => {
  if (!config || !config.messaging) {
    return { enabled: false };
  }

  const redisClient = client(config);
  const rsmq = new RSMQ({ host: config.messaging.host, port: config.messaging.port, ns: 'rsmq' });

  /**
   * Create queues on demand on first use
   */
  const createOrSelectQueue = (name, next) => {
    rsmq.listQueues((err, queues) => {
      if (err) { return next(err); }
      if (_.includes(queues, name)) { return next(); }
      rsmq.createQueue({ qname: name }, err => {
        next(err);
      });
    });
  };

  /**
   * Submit a job for processing
   */
  const submit = (name, data, next) => {
    createOrSelectQueue(name, err => {
      if (err && err.name !== 'queueExists') { return next && next(err); }
      rsmq.sendMessage({ qname: name, message: JSON.stringify(data) }, (err, response) => {
        if (err) { return next && next(err); }
        return next && next(null, response);
      });
    });
  };

  /**
   * Listen to a queue to process jobs
   */
  const listen = (name, options, callback, next) => {
    if (!next) { // listen(name, callback, next)
      next = callback;
      callback = options;
      options = null;
    }

    const worker = new RSMQWorker(name, Object.assign({}, options, { rsmq, autostart: true }));
    worker.on('message', (msg, cb) => {
      callback(JSON.parse(msg), cb);
    });
    return next && next();
  };

  /**
   * Publish a notification onto a pubsub topic for downstream systems
   */
  const publish = (name, data) => {
    const channel = [config.messaging.namespace || 'seguir', name].join('.');
    redisClient.publish(channel, JSON.stringify(data));
  };

  /**
   * Subscribe
   */
  const subscribe = (name, callback) => {
    // Redis subscriptions block the normal client, so we create another
    const subscriberClient = client(config);
    const channel = [config.messaging.namespace || 'seguir', name].join('.');
    subscriberClient.on('message', (channel, message) => {
      callback(JSON.parse(message));
    });
    subscriberClient.subscribe(channel);
  };

  /**
   * Shutdown all active redis clients
   */
  const shutdown = () => {
    clients.forEach((redisclient) => {
      redisclient.unsubscribe();
      redisclient.quit();
    });
  };

  return {
    submit,
    listen,
    publish,
    subscribe,
    client: redisClient,
    shutdown,
    enabled: true,
    feed: config.messaging.feed,
  };
};
