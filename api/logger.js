/**
 * Default console logger
 */
var debug = require('debug')('seguir:logger');

module.exports = {
  info: function (msg) { debug('info', msg); },
  error: function (msg) { debug('error', msg); },
  warn: function (msg) { debug('warn', msg); },
  debug: function (msg) { debug('debug', msg); }
};
