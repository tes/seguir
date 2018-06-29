var async = require('async');
var _mapValues = require('lodash/mapValues');
var _zipObject = require('lodash/zipObject');

/**
 * This is a collection of methods that allow you to create, update and delete social items.
 *
 * These methods all exclude the 'loggedinuser' parameter as they are all carried out only by
 * the currently logged in user and / or system level calls (e.g. adding a user via integration
 * with an SSO flow).
 *
 */
module.exports = function (api) {
  var client = api.client;
  var messaging = api.messaging;
  var q = client.queries;

  function addGroup (keyspace, groupName, supergroupId, options, next) {
    if (!next) {
      next = options;
      options = {};
    }

    var groupData = options.groupData || {};
    var group = client.isValidId(options.group) ? options.group : client.generateId();

    groupData = _mapValues(groupData, function (value) {
      return value.toString();
    }); // Always ensure our groupdata is <text,text>

    // Check group doesn't already exist with this name in this supergroup
    getGroupByNameWithinSupergroup(keyspace, groupName, supergroupId, function (err, existingGroup) {
      if (err && err.statusCode !== 404) { return next(err); }
      if (existingGroup) {
        return next({
          statusCode: 409,
          message: 'Group with groupname ' + groupName + ' already exists for supergroupId ' + supergroupId
        });
      }

      var groupValues = [group, groupData, groupName, supergroupId];

      client.execute(q(keyspace, 'upsertGroup'), groupValues, {}, function (err, result) {
        if (err) { return next(err); }
        next(null, _zipObject(['group', 'groupData', 'groupName', 'supergroupId'], groupValues));
      });
    });
  }

  function getGroupByNameWithinSupergroup (keyspace, groupName, supergroupId, next) {
    client.get(q(keyspace, 'selectGroupByNameAndSupergroup'), [groupName, supergroupId], {}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find group by groupName: ' + groupName + ' and supergroupId ' + supergroupId)); }
      next(null, result);
    });
  }

  function getGroup (keyspace, group, next) {
    client.get(q(keyspace, 'selectGroupById'), [group], {}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find group by id: ' + group)); }
      next(null, result);
    });
  }

  function updateGroup (keyspace, group, groupName, supergroupId, groupData, next) {
    groupData = _mapValues(groupData, function (value) {
      return value.toString();
    }); // Always ensure our groupData is <text,text>

    var groupValues = [groupName, supergroupId, groupData, group];
    client.execute(q(keyspace, 'updateGroup'), groupValues, {}, function (err, value) {
      if (err) { return next(err); }
      next(null, _zipObject(['groupName', 'supergroupId', 'groupData', 'group'], groupValues));
    });
  }

  function removeMembers (keyspace, group, cb) {
    client.execute(q(keyspace, 'removeMembers'), [group], function (err) {
      if (err) return cb(err);
      cb(null, { status: 'removed' });
    });
  }

  function removeGroup (keyspace, group, next) {
    getGroup(keyspace, group, function (err, result) {
      if (err) { return next(err); }
      var jobData = {
        keyspace: keyspace,
        group: group
      };

      var _removeMembers = function (cb) {
        if (messaging.enabled) {
          messaging.submit('seguir-remove-members', jobData, cb);
        } else {
          removeMembers(keyspace, jobData.group, cb);
        }
      };
      var _removeGroup = function (cb) {
        client.execute(q(keyspace, 'removeGroup'), [group], function (err) {
          if (err) return cb(err);
          cb(null, { status: 'removed' });
        });
      };
      async.series([
        _removeMembers,
        _removeGroup
      ], next);
    });
  }

  function getBySupergroupId (keyspace, supergroupId, next) {
    client.get(q(keyspace, 'selectGroupsBySupergroupId'), [supergroupId], {}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find groups by supergroupId: ' + supergroupId)); }
      next(null, result);
    });
  }

  function getGroupMembers (keyspace, group, next) {
    client.get(q(keyspace, 'selectGroupMembers'), [group], {}, function (err, result) {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find group members: ' + group)); }
      next(null, result);
    });
  }

  function joinGroup (keyspace, group, user, timestamp, cb) {
    var memberValues = [group, user, timestamp];
    client.execute(q(keyspace, 'upsertMember'), memberValues, function (err) {
      if (err) return cb(err);
      cb(null, _zipObject(['group', 'user', 'timestamp'], memberValues));
    });
  }

  function leaveGroup (keyspace, group, user, cb) {
    var memberValues = [group, user];
    client.execute(q(keyspace, 'removeMember'), memberValues, function (err) {
      if (err) return cb(err);
      cb(null, { status: 'removed' });
    });
  }

  return {
    addGroup: addGroup,
    getGroup: getGroup,
    joinGroup: joinGroup,
    leaveGroup: leaveGroup,
    updateGroup: updateGroup,
    removeGroup: removeGroup,
    removeMembers: removeMembers,
    getBySupergroupId: getBySupergroupId,
    getGroupMembers: getGroupMembers
  };
};
