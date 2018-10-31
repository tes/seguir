module.exports = (api) => {
  const client = api.client;
  const q = client.queries;
  const _isUserModerator = (keyspace, user, next) => {
    client.get(q(keyspace, 'selectModerator'), [user], {}, (err, result) => {
      if (err) { return next(err); }
      next(null, result);
    });
  };

  const _isUserGroupModerator = (keyspace, altid, group, next) => {
    client.get(q(keyspace, 'selectGroupById'), [group], {}, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, `Group ${group} is not a valid group`)); }
      if (result.groupdata && result.groupdata.admin.toString() === altid.toString()) {
        return next(null, result);
      }
      next(null, null);
    });
  };

  const isUserModerator = (keyspace, autoModeratedBy, altid, user, group, next) => {
    if (autoModeratedBy) {
      return next(null, { isUserModerator: true });
    }
    _isUserModerator(keyspace, user, (err, result) => {
      if (err) { return next(err); }
      if (result) {
        return next(null, { isUserModerator: true });
      }
      if (!(group && altid)) {
        return next(null, { isUserModerator: false });
      }
      _isUserGroupModerator(keyspace, altid, group, (err, group) => {
        if (err) { return next(err); }
        if (group) {
          return next(null, { isUserModerator: true });
        }
        return next(null, { isUserModerator: false });
      });
    });
  };

  return {
    isUserModerator,
  };
};
