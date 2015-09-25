var path = require('path');
var consoleLogger = require('./logger');

module.exports = function (config, logger, next) {

  if (!next) { next = logger; logger = consoleLogger; }

  require('../db')(config, function (err, client) {

    if (err) { return next(err); }

    var messaging = require('../db/messaging')(config);

    var api = {};
    api.logger = logger;
    api.client = client;
    api.config = config;
    api.messaging = messaging;
    api.urls = require('./urls');
    api.visibility = require('./visibility');

    var modules = ['auth', 'common', 'user', 'post', 'like', 'feed', 'friend', 'follow', '../db/migrations'];
    modules.forEach(function (module) {
      var moduleName = path.basename(module);
      api[moduleName] = require(path.resolve(__dirname, module))(api);
    });

    next(null, api);

  });

};
