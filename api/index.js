module.exports = function (config, next) {

  require('../db')(config, function (err, client) {

    if (err) { return next(err); }

    var messaging = require('../db/messaging')(config);
    var keyspace = config.keyspace || 'seguir';

    // TODO: Refactor out into iteration over array of modules
    var auth = require('./auth');
    var common = require('./common');
    var user = require('./user');
    var post = require('./post');
    var like = require('./like');
    var feed = require('./feed');
    var friend = require('./friend');
    var follow = require('./follow');
    var migrations = require('../db/migrations');

    var api = {};
    api.client = client;
    api.config = config;
    api.messaging = messaging;

    // Auth and migrations both run on core keyspace
    api.auth = auth(keyspace, api);
    api.migrations = migrations(keyspace, api);

    // Other APIs get their keyspace with each api request
    api.common = common(api);
    api.follow = follow(api);
    api.feed = feed(api);
    api.friend = friend(api);
    api.like = like(api);
    api.post = post(api);
    api.user = user(api);

    next(null, api);

  });

};
