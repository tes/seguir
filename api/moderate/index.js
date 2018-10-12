var _mapValues = require('lodash/mapValues');

module.exports = function (api) {
  var client = api.client;
  var q = client.queries;

  function _isUserModerator (keyspace, user, next) {
    client.get(q(keyspace, 'selectModerator'), [user], {}, function (err, result) {
      if (err) { return next(err); }
      next(null, result);
    });
  }

  function _isUserGroupModerator (keyspace, altid, group, next) {
    client.get(q(keyspace, 'selectGroupById'), [group], {}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Group ' + group + ' is not a valid group ')); }
      var groupData = _mapValues(result.groupdata, function (value) {
        return value.toString();
      });
      if (groupData.admin === altid.toString()) {
        return next(null, result);
      }
      next(null, null);
    });
  }

  function isUserModerator (keyspace, autoModeratedBy, altid, user, group, next) {
    if (autoModeratedBy) {
      return next(null, { isUserModerator: true });
    }

    _isUserModerator(keyspace, user, function (err, result) {
      if (err) { return next(err); }
      if (result) {
        return next(null, { isUserModerator: true });
      }
      if (!group) {
        return next(null, { isUserModerator: false });
      }
      _isUserGroupModerator(keyspace, altid, group, function (err, group) {
        if (err) { return next(err); }
        if (group) {
          return next(null, { isUserModerator: true });
        }
        return next(null, { isUserModerator: false });
      });
    });
  }

  return {
    isUserModerator: isUserModerator
  };
};
