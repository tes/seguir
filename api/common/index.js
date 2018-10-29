const sanitizeHtml = require('sanitize-html');
const _ = require('lodash');

module.exports = (api) => {
  const client = api.client;
  const q = client.queries;

  const error = (code, message) => {
    const err = new Error(message);
    err.statusCode = code;
    return err;
  };

  const get = (keyspace, query, data, many, next) => {
    client.execute(q(keyspace, query), data, {}, response(query, data, many, next));
  };

  const response = (query, data, many, next) => {
    return (err, result) => {
      /* istanbul ignore if */
      if (err) { return next(err); }
      if (!Array.isArray(result) || (many !== 'many' && result.length === 0)) {
        return next(error(404, 'Item not found: "' + query + '"" for "' + data.join(', ') + '"'));
      }
      next(null, many === 'many' ? result : result[0]);
    };
  };

  const clean = input => sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });

  // Deal with any content conversion to persist in cassandra
  // While not too many options will just switch
  const convertContentToString = (content, content_type) => {
    switch (content_type) {
      case 'application/json':
        if (typeof content === 'object') {
          return JSON.stringify(content);
        }
        return content;
      default:
        return api.common.clean(content);
    }
  };

  // Deal with any content conversion when retrieving from cassandra
  const convertContentFromString = (content, content_type) => {
    switch (content_type) {
      case 'application/json':
        let json;
        try {
          json = JSON.parse(content);
        } catch (ex) {
          // Return null object on error
        }
        return json;
      default:
        return content;
    }
  };

  const expandEmbeddedObject = (item, field, test, ignore) => {
    const prefix = field + '_';
    const testField = prefix + test;
    if (item[testField]) {
      const embed = {};
      _.forOwn(item, (value, key) => {
        if (key.indexOf(prefix) === 0 && !_.includes(ignore, key)) {
          const embedKey = key.replace(prefix, '');
          embed[embedKey] = value;
          delete item[key];
        }
      });
      return embed;
    }
  };

  const isUserGroupMember = (keyspace, user, group, next) => {
    client.get(q(keyspace, 'selectMemberByUserAndGroup'), [user, group], {}, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'User ' + user + ' is not a member of group ' + group)); }
      next(null, result);
    });
  };

  return {
    error,
    get,
    response,
    clean,
    convertContentToString,
    convertContentFromString,
    expandEmbeddedObject,
    isUserGroupMember,
  };
};
