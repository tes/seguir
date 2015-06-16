var path = require('path');

module.exports = function (config, next) {

  require('../db')(config, function (err, client) {

    if (err) { return next(err); }

    var messaging = require('../db/messaging')(config);

    var api = {};
    api.client = client;
    api.config = config;
    api.messaging = messaging;

    var modules = ['auth', 'common', 'user', 'post', 'like', 'feed', 'friend', 'follow', '../db/migrations'];
    modules.forEach(function (module) {
      var moduleName = path.basename(module);
      api[moduleName] = require(path.resolve(__dirname, module))(api);
    });

    next(null, api);

  });

};
