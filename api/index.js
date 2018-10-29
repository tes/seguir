const path = require('path');
const consoleLogger = require('./logger');
const _ = require('lodash');

module.exports = (config, logger, metrics, next) => {
  if (!next) { next = metrics; metrics = { increment: _.noop }; }
  if (!next) { next = logger; logger = consoleLogger; }

  require('../db')(config, (err, client) => {
    if (err) { return next(err); }

    const messaging = require('../db/messaging')(config);

    const urls = require('./urls');
    const visibility = require('./visibility');

    const api = {
      logger,
      metrics,
      client,
      config,
      messaging,
      urls,
      visibility,
    };

    const modules = ['auth', 'common', 'user', 'post', 'like', 'feed', 'friend', 'follow', 'group', 'comment', '../db/migrations'];
    modules.forEach((module) => {
      const moduleName = path.basename(module);
      api[moduleName] = require(path.resolve(__dirname, module))(api);
    });

    next(null, api);
  });
};
