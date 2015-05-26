var sanitizeHtml = require('sanitize-html');

module.exports = function (client, messaging, keyspace, api) {

  var q = require('../db/queries');

  function error (code, message) {
    var err = new Error(message);
    err.statusCode = code;
    return err;
  }

  function get (keyspace, query, data, many, next) {
    client.execute(q(keyspace, query), data, {prepare: true}, response(query, data, many, next));
  }

  function response (query, data, many, next) {
    return function (err, result) {
      /* istanbul ignore if */
      if (err) { return next(err); }
      if (!result.rows || (many !== 'many' && result.rows.length !== 1)) {
        return next(error(404, 'Item not found: "' + query + '"" for "' + data.join(', ') + '"'));
      }
      next(null, many === 'many' ? result.rows : result.rows[0]);
    };
  }

  function clean (input) {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }

  return {
    error: error,
    get: get,
    response: response,
    clean: clean
  };

};
