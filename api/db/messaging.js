'use strict';

var redis = require('redis');
var _ = require('lodash');
var Queue = require('bull');

module.exports = function(config) {

    var redisClient = client(config);
    var queues = {};

    /**
     * Create queues on demand on first use
     */
    function createOrSelectQueue(name) {
        if(queues[name]) { return queues[name]; }
        queues[name] = Queue(name, redisClient.connectionOption.port, redisClient.connectionOption.host);
        return queues[name];
    }

    /**
     * Submit a job for processing
     */
    function submit(name, data) {
        var queue = createOrSelectQueue(name);
        queue.add(data);
    }

    /**
     * Listen to a queue to process jobs
     */
    function listen(name, callback) {
        var queue = createOrSelectQueue(name);
        queue.process(function(job, done) {
            callback(job.data, done);
        });
    }

    /**
     * Publish a notification onto a pubsub topic
     */
    function publish(topic, data) {

    }

    /**
     * Subscribe to a pubsub topic
     */
    function subscribe(topic, callback) {

    }

    return {
        submit: submit,
        listen: listen,
        publish: publish,
        subscribe: subscribe,
        client: redisClient
    }

}

function client(config) {

    var redisConfig = config && config.redis ? config.redis : {};
    redisConfig = _.defaults(config && config.redis || {}, { host: 'localhost', port: 6379, options: { } });
    redisConfig.options.retry_max_delay = redisConfig.options.retry_max_delay || 10000;

    var client = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);

    client.on('error', function(err) {
        console.error('Error connecting to redis [%s:%s] - %s', redisConfig.host, redisConfig.port, err.message);
    });

    client.on('ready', function() {
        // Do nothing - assume success unless proven otherwise
    });

    client.select(redisConfig.db || 0);

    return client;

}
