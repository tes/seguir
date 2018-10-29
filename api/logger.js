const debug = require('debug')('seguir:logger');

module.exports = {
  info: (msg) => { debug('info', msg); },
  error: (msg) => { debug('error', msg); },
  warn: (msg) => { debug('warn', msg); },
  debug: (msg) => { debug('debug', msg); },
};
