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

    var api = {};
    api.client = client;
    api.config = config;
    api.messaging = messaging;
    api.auth = auth(client, messaging, keyspace, api);
    api.common = common(client, messaging, api);
    api.follow = follow(client, messaging, api);
    api.feed = feed(client, messaging, api);
    api.friend = friend(client, messaging, api);
    api.like = like(client, messaging, api);
    api.post = post(client, messaging, api);
    api.user = user(client, messaging, api);
    next(null, api);

  });

};
