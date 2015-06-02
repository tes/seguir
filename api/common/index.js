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

  // Deal with any content conversion to persist in cassandra
  // While not too many options will just switch
  function convertContentToCassandra (content, content_type) {
    switch (content_type) {
      case 'application/json':
        if (typeof content === 'object') {
          return JSON.stringify(content);
        }
        return content;
      default:
        return api.common.clean(content);
    }
  }

  // Deal with any content conversion when retrieving from cassandra
  function convertContentFromCassandra (content, content_type) {
    switch (content_type) {
      case 'application/json':
        var json;
        try {
          json = JSON.parse(content);
        } catch(ex) {
          // Return null object on error
        }
        return json;
      default:
        return content;
    }
  }

  return {
    error: error,
    get: get,
    response: response,
    clean: clean,
    convertContentToCassandra: convertContentToCassandra,
    convertContentFromCassandra: convertContentFromCassandra
  };

};
