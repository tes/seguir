const async = require('async');
const _mapValues = require('lodash/mapValues');
const _zipObject = require('lodash/zipObject');
const _filter = require('lodash/filter');

const DEFAULT_PAGESIZE = 50;

/**
 * This is a collection of methods that allow you to create, update and delete social items.
 *
 * These methods all exclude the 'loggedinuser' parameter as they are all carried out only by
 * the currently logged in user and / or system level calls (e.g. adding a user via integration
 * with an SSO flow).
 *
 */
module.exports = (api) => {
  const client = api.client;
  const messaging = api.messaging;
  const q = client.queries;

  const joinGroup = (keyspace, group, user, timestamp, cb) => {
    const memberValues = [group, user, timestamp];
    client.execute(q(keyspace, 'upsertMember'), memberValues, (err) => {
      if (err) return cb(err);
      getGroup(keyspace, group, (err, result) => {
        if (err) return cb(err);
        const joinGroupContent = {
          category: 'social-group',
          type: 'new-member',
          data: {
            group: {
              id: group,
              name: result.groupname,
            },
          },
        };
        api.post.addPost(keyspace, user, joinGroupContent, 'application/json', timestamp, 'public', (err, result) => {
          if (err) return cb(err);
          cb(null, _zipObject(['group', 'user', 'timestamp'], memberValues));
        });
      });
    });
  };

  const addGroup = (keyspace, groupName, supergroupId, user, timestamp, options, next) => {
    if (!next) {
      next = options;
      options = {};
    }

    let groupData = options.groupData || {};
    const group = client.isValidId(options.group) ? options.group : client.generateId();

    groupData = _mapValues(groupData, (value) => {
      return value.toString();
    }); // Always ensure our groupdata is <text,text>

    // Check group doesn't already exist with this name in this supergroup
    getGroupByNameWithinSupergroup(keyspace, groupName, supergroupId, (err, existingGroup) => {
      if (err && err.statusCode !== 404) { return next(err); }
      if (existingGroup) {
        return next({
          statusCode: 409,
          message: 'Group with groupname ' + groupName + ' already exists for supergroupId ' + supergroupId,
        });
      }

      const groupValues = [group, groupData, groupName, supergroupId];

      client.execute(q(keyspace, 'upsertGroup'), groupValues, {}, (err, result) => {
        if (err) { return next(err); }
        joinGroup(keyspace, group, user, timestamp, (err, result) => {
          if (err) { return next(err); }
          next(null, _zipObject(['group', 'groupData', 'groupName', 'supergroupId'], groupValues));
        });
      });
    });
  };

  const getGroupByNameWithinSupergroup = (keyspace, groupName, supergroupId, next) => {
    client.get(q(keyspace, 'selectGroupByNameAndSupergroup'), [groupName, supergroupId], {}, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find group by groupName: ' + groupName + ' and supergroupId ' + supergroupId)); }
      next(null, result);
    });
  };

  const getGroup = (keyspace, group, next) => {
    client.get(q(keyspace, 'selectGroupById'), [group], {}, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, 'Unable to find group by id: ' + group)); }
      next(null, result);
    });
  };

  const getGroups = (keyspace, groups, next) => {
    async.map(groups, (group, cb) => {
      getGroup(keyspace, group, (err, result) => {
        if (err) return cb();
        cb(null, result);
      });
    }, next);
  };

  const updateGroup = (keyspace, userAltid, group, groupName, supergroupId, groupData, next) => {
    getGroup(keyspace, group, (err, result) => {
      if (err) { return next(err); }

      if (userAltid.toString() !== result.groupdata.admin) {
        return next(new Error('Unable to update the group, only admin can update it.'));
      }

      groupData = _mapValues(groupData, (value) => {
        return value.toString();
      }); // Always ensure our groupData is <text,text>

      const groupValues = [groupName, supergroupId, groupData, group];
      client.execute(q(keyspace, 'updateGroup'), groupValues, {}, (err, value) => {
        if (err) { return next(err); }
        next(null, _zipObject(['groupName', 'supergroupId', 'groupData', 'group'], groupValues));
      });
    });
  };

  const removeMembers = (jobData, cb) => {
    client.execute(q(jobData.keyspace, 'removeMembers'), [jobData.group], (err) => {
      if (err) return cb(err);
      cb(null, { status: 'removed' });
    });
  };

  const removeMembersByUser = (keyspace, user, next) => {
    client.execute(q(keyspace, 'selectGroupsForUser'), [user], (err, results) => {
      if (err) return next(err);
      async.each(results, (member, cb) => {
        client.execute(q(keyspace, 'removeMember'), [member.group, user], cb);
      }, next);
    });
  };

  const removeGroup = (keyspace, userAltid, user, group, next) => {
    getGroup(keyspace, group, (err, result) => {
      if (err) { return next(err); }
      if (userAltid.toString() !== result.groupdata.admin) {
        return next(new Error('Unable to remove the group, only admin can remove it.'));
      }
      const jobData = {
        keyspace,
        user,
        group,
      };

      const _removeMembers = (cb) => {
        if (messaging.enabled) {
          messaging.submit('seguir-remove-members', jobData, cb);
        } else {
          removeMembers(jobData, cb);
        }
      };
      const _removeGroup = (cb) => {
        client.execute(q(keyspace, 'removeGroup'), [group], (err) => {
          if (err) return cb(err);
          cb(null, { status: 'removed' });
        });
      };
      async.series([
        _removeMembers,
        _removeGroup,
      ], next);
    });
  };

  const getGroupsByUser = (keyspace, user, next) => {
    client.execute(q(keyspace, 'selectGroupsForUser'), [user], (err, results) => {
      if (err) return next(err);

      if (results && results.length > 0) {
        async.map(results, (group, cb) => {
          getGroup(keyspace, group.group, (err, result) => {
            if (err) {
              return cb(null, null);
            }
            cb(null, result);
          });
        }, (err, groups) => {
          if (err) { return next(err); }
          const existingGroups = _filter(groups, (group) => {
            return group !== null;
          });
          next(null, existingGroups);
        });
      } else {
        next(null, []);
      }
    });
  };

  const getGroupsBySupergroupId = (keyspace, supergroupId, liu, options, next) => {
    if (!next) {
      next = options;
      options = {};
    }
    const pageState = options.pageState;
    const pageSize = options.pageSize || DEFAULT_PAGESIZE;

    client.execute(q(keyspace, 'selectGroupsBySupergroupId'), [supergroupId], { pageState, pageSize }, (err, data, nextPageState) => {
      if (err) { return next(err); }

      if (data && data.length > 0) {
        async.map(data, (item, cb) => {
          api.common.isUserGroupMember(keyspace, liu, item.group, (err) => {
            if (!err) {
              item.isMember = true;
            }
            cb();
          });
        }, () => {
          next(null, data, nextPageState);
        });
      } else {
        next(null, []);
      }
    });
  };

  const getGroupMembers = (keyspace, group, next) => {
    client.execute(q(keyspace, 'selectGroupMembers'), [group], {}, (err, groupMembers) => {
      if (err) { return next(err); }

      async.mapSeries(groupMembers, (member, cb) => {
        api.user.mapUserIdToUser(keyspace, member, ['user'], cb);
      }, next);
    });
  };

  const leaveGroup = (keyspace, group, user, cb) => {
    const memberValues = [group, user];
    client.execute(q(keyspace, 'removeMember'), memberValues, (err) => {
      if (err) return cb(err);
      cb(null, { status: 'removed' });
    });
  };

  return {
    addGroup,
    getGroup,
    getGroups,
    joinGroup,
    leaveGroup,
    updateGroup,
    removeGroup,
    removeMembers,
    getGroupsByUser,
    getGroupsBySupergroupId,
    getGroupMembers,
    removeMembersByUser,
  };
};
