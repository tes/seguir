var async = require('async');
var _mapValues = require('lodash/mapValues');
var _zipObject = require('lodash/zipObject');
var _filter = require('lodash/filter');
var debug = require('debug')('seguir:group');

var DEFAULT_PAGESIZE = 50;

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

  function joinGroup (keyspace, group, user, timestamp, cb) {
    var memberValues = [group, user, timestamp];
    client.execute(q(keyspace, 'upsertMember'), memberValues, function (err) {
      if (err) return cb(err);

      var countUpdate = [1, group.toString()];
      debug('update group counts:', 'counts', countUpdate);
      client.execute(q(keyspace, 'updateCounter', {TYPE: 'member'}), countUpdate, {cacheKey: 'count:member:' + group}, function (err) {
        if (err) { return cb(err); }

        api.metrics.increment('member.add');
        getGroup(keyspace, group, null, function (err, result) {
          if (err) return cb(err);
          var joinGroupContent = {
            category: 'social-group',
            type: 'new-member',
            data: {
              group: {
                id: group,
                name: result.groupname
              }
            }
          };
          api.post.addPost(keyspace, user, joinGroupContent, 'application/json', timestamp, 'public', function (err, result) {
            if (err) return cb(err);
            cb(null, _zipObject(['group', 'user', 'timestamp'], memberValues));
          });
        });
      });
    });
  }

  function addGroup (keyspace, groupName, supergroupId, user, timestamp, options, next) {
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
        joinGroup(keyspace, group, user, timestamp, function (err, result) {
          if (err) { return next(err); }
          next(null, _zipObject(['group', 'groupData', 'groupName', 'supergroupId'], groupValues));
        });
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

  function getGroup (keyspace, group, liu, next) {
    client.get(q(keyspace, 'selectGroupById'), [group], {}, function (err, result) {
      if (err) {
        next(err);
        return;
      }
      if (!result) {
        next(api.common.error(404, 'Unable to find group by id: ' + group));
        return;
      }
      if (!liu) {
        next(null, result);
        return;
      }
      client.get(q(keyspace, 'selectCount', {TYPE: 'member'}), [group.toString()], {cacheKey: 'count:member:' + group}, function (err, countItems) {
        if (err) { return next(err); }

        if (countItems && +countItems.count > 0) {
          result.memberCount = +countItems.count;
          api.common.isUserGroupMember(keyspace, liu, group, function (err) {
            if (!err) {
              result.isMember = true;
            }
            next(null, result);
          });
        } else {
          result.memberCount = 0;
          next(null, result);
        }
      });
    });
  }

  function getGroups (keyspace, groups, next) {
    async.map(groups, function (group, cb) {
      getGroup(keyspace, group, null, function (err, result) {
        if (err) return cb();
        cb(null, result);
      });
    }, next);
  }

  function updateGroup (keyspace, userAltid, group, groupName, supergroupId, groupData, next) {
    getGroup(keyspace, group, null, function (err, result) {
      if (err) { return next(err); }

      if (userAltid.toString() !== result.groupdata.admin) {
        return next(new Error('Unable to update the group, only admin can update it.'));
      }

      groupData = _mapValues(groupData, function (value) {
        return value.toString();
      }); // Always ensure our groupData is <text,text>

      var groupValues = [groupName, supergroupId, groupData, group];
      client.execute(q(keyspace, 'updateGroup'), groupValues, {}, function (err, value) {
        if (err) { return next(err); }
        next(null, _zipObject(['groupName', 'supergroupId', 'groupData', 'group'], groupValues));
      });
    });
  }

  function removeMembers (jobData, cb) {
    client.execute(q(jobData.keyspace, 'removeMembers'), [jobData.group], function (err) {
      if (err) return cb(err);
      cb(null, { status: 'removed' });
    });
  }

  function removeMembersByUser (keyspace, user, next) {
    client.execute(q(keyspace, 'selectGroupsForUser'), [user], function (err, results) {
      if (err) return next(err);
      async.each(results, function (member, cb) {
        client.execute(q(keyspace, 'removeMember'), [member.group, user], cb);
      }, next);
    });
  }

  function removeGroup (keyspace, userAltid, user, group, next) {
    getGroup(keyspace, group, null, function (err, result) {
      if (err) { return next(err); }
      if (userAltid.toString() !== result.groupdata.admin) {
        return next(new Error('Unable to remove the group, only admin can remove it.'));
      }
      var jobData = {
        keyspace: keyspace,
        user: user,
        group: group
      };

      var _removeMembers = function (cb) {
        if (messaging.enabled) {
          messaging.submit('seguir-remove-members', jobData, cb);
        } else {
          removeMembers(jobData, cb);
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

  function getGroupsByUser (keyspace, user, next) {
    client.execute(q(keyspace, 'selectGroupsForUser'), [user], function (err, results) {
      if (err) return next(err);

      if (results && results.length > 0) {
        async.map(results, function (group, cb) {
          getGroup(keyspace, group.group, user, function (err, result) {
            if (err) {
              return cb(null, null);
            }
            cb(null, result);
          });
        }, function (err, groups) {
          if (err) { return next(err); }
          var existingGroups = _filter(groups, function (group) {
            return group !== null;
          });
          next(null, existingGroups);
        });
      } else {
        next(null, []);
      }
    });
  }

  function getGroupsBySupergroupId (keyspace, supergroupId, liu, options, next) {
    if (!next) {
      next = options;
      options = {};
    }
    var pageState = options.pageState;
    var pageSize = options.pageSize || DEFAULT_PAGESIZE;

    client.execute(q(keyspace, 'selectGroupsBySupergroupId'), [supergroupId], {pageState: pageState, pageSize: pageSize}, function (err, data, nextPageState) {
      if (err) { return next(err); }

      if (data && data.length > 0) {
        async.map(data, function (item, cb) {
          api.common.isUserGroupMember(keyspace, liu, item.group, function (err) {
            if (!err) {
              item.isMember = true;
            }
            cb();
          });
        }, function () {
          next(null, data, nextPageState);
        });
      } else {
        next(null, []);
      }
    });
  }

  function getGroupMembers (keyspace, group, options, next) {
    var pageState = options.pageState;
    var pageSize = options.pageSize || 50;
    var selectOptions = { pageState: pageState, pageSize: pageSize };
    client.execute(q(keyspace, 'selectGroupMembers'), [group], selectOptions, function (err, groupMembers, nextPageState) {
      if (err) { return next(err); }

      api.user.mapUserIdToUser(keyspace, groupMembers, ['user'], function (err, members) {
        if (err) { return next(err); }
        next(null, members, nextPageState);
      });
    });
  }

  function leaveGroup (keyspace, group, user, cb) {
    var memberValues = [group, user];
    client.execute(q(keyspace, 'removeMember'), memberValues, function (err) {
      if (err) return cb(err);

      var countUpdate = [-1, group.toString()];
      debug('update member counts:', 'counts', countUpdate);
      client.execute(q(keyspace, 'updateCounter', {TYPE: 'member'}), countUpdate, {cacheKey: 'count:member:' + group}, function (err) {
        if (err) return cb(err);
        cb(null, { status: 'removed' });
      });
    });
  }

  return {
    addGroup: addGroup,
    getGroup: getGroup,
    getGroups: getGroups,
    joinGroup: joinGroup,
    leaveGroup: leaveGroup,
    updateGroup: updateGroup,
    removeGroup: removeGroup,
    removeMembers: removeMembers,
    getGroupsByUser: getGroupsByUser,
    getGroupsBySupergroupId: getGroupsBySupergroupId,
    getGroupMembers: getGroupMembers,
    removeMembersByUser: removeMembersByUser
  };
};
