/**
 * Default console logger
 */
module.exports = {
	info: function (msg) { console.log('[info]: ' + msg); },
	error: function (msg) { console.log('[error]: ' + msg); },
	warn: function (msg) { console.log('[warn]: ' + msg); },
	debug: function (msg) { console.log('[debug]: ' + msg); }
};
