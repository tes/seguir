const moment = require('moment');
const async = require('async');
const _ = require('lodash');
const pressure = require('pressure-stream');
const debug = require('debug')('seguir:feed');

const MENTION = new RegExp('@[a-zA-Z0-9]+', 'g');
const FEEDS = ['feed_timeline', 'user_timeline'];
const DEFAULT_PAGESIZE = 50;

/**
 * This is a collection of methods that allow you to create, update and delete social items.
 *
 * These methods all exclude the 'loggedinuser' parameter as they are all carried out only by
 * the currently logged in user and / or system level calls (e.g. adding a user via integration
 * with an SSO flow).
 *
 * TODO: Exception may be creating a post on someone elses feed.
 *
 */
module.exports = (api) => {
  const client = api.client;
  const messaging = api.messaging;
  const q = client.queries;

  const insertFollowersTimeline = (jobData, next) => {
    let read = 0;
    let finished = 0;
    let done = false;

    const nextIfFinished = (doNotIncrement, cb) => {
      if (!doNotIncrement) { finished++; }
      if (read === finished && done) {
        async.each(jobData.propagateTo, (user, cb) => {
          upsertTimeline(jobData.keyspace, 'feed_timeline', user, jobData.id, jobData.type, jobData.timestamp, jobData.visibility, null, () => cb());
        }, next);
      } else {
        cb();
      }
    };

    // If you are the recipient of a follow, do not copy this out to your follow graph - it will appear in your feed only
    if (jobData.type === 'follow' && (jobData.user.toString() === jobData.object.user.toString())) { return next(); }

    // If you the action is personal do not copy out to followers feeds
    if (jobData.visibility === api.visibility.PERSONAL) { return next(); }

    client.stream(q(jobData.keyspace, 'selectFollowers'), [jobData.user], (err, stream) => {
      if (err) { return next(err); }

      const processRow = (row, cb) => {
        const isPrivate = jobData.visibility === api.visibility.PRIVATE;
        const followerIsFollower = jobData.type === 'follow' && (row.user_follower.toString() === jobData.object.user_follower.toString());

        // Follow is added to followers feed directly, not via the follow relationship
        if (followerIsFollower) {
          return nextIfFinished(false, cb);
        }
        api.friend.isFriend(jobData.keyspace, row.user, row.user_follower, (err, isFriend) => {
          if (err) {
            console.log(`error while fetching is friend (${row.user}:${row.user_follower})`);
            return nextIfFinished(false, cb);
          }
          if (!isPrivate || (isPrivate && isFriend)) {
            upsertTimeline(jobData.keyspace, 'feed_timeline', row.user_follower, jobData.id, jobData.type, jobData.timestamp, jobData.visibility, row.follow, () => { nextIfFinished(false, cb); });
          } else {
            nextIfFinished(false, cb);
          }
        });
      };

      stream
        .pipe(pressure(processRow, { high: 10, low: 5, max: 20 }));

      stream
        .on('data', () => {
          read++;
        })
        .on('end', () => {
          done = true;
          nextIfFinished(true, () => {});
        })
        .on('error', err => {
          next(err);
        });
    });
  };

  const insertMembersTimeline = (jobData, next) => {
    let read = 0;
    let finished = 0;
    let done = false;

    const nextIfFinished = (doNotIncrement, cb) => {
      if (!doNotIncrement) { finished++; }
      if (read === finished && done) { next(); } else {
        cb();
      }
    };

    const processRow = (row, cb) => {
      upsertFeedTimelineFromGroup(jobData.keyspace, row.user, jobData.id, jobData.type, jobData.timestamp, jobData.group, () => { nextIfFinished(false, cb); });
    };

    client.stream(q(jobData.keyspace, 'selectGroupMembers'), [jobData.group], (err, stream) => {
      if (err) { return next(err); }

      stream
        .pipe(pressure(processRow, { high: 10, low: 5, max: 20 }));

      stream
        .on('data', () => {
          read++;
        })
        .on('end', () => {
          done = true;
          nextIfFinished(true, () => {});
        })
        .on('error', err => {
          next(err);
        });
    });
  };

  const insertInterestedUsersTimelines = (jobData, next) => {
    const propagationBatchSize = 100;
    const selectUsersByInterest = (memo, interest, cb) => {
      api.interest.getUsers(jobData.keyspace, interest, memo, cb);
    };
    const upsertPostToFeedTimeline = (context) => (user, index, cb) => {
      upsertTimeline(jobData.keyspace, 'feed_timeline', user, jobData.id, jobData.type, jobData.timestamp, api.visibility.PERSONAL, (error) => {
        if (error) { return cb(error); }
        if (index % propagationBatchSize === 0) {
          api.logger.info('Job for insertInterestedUsersTimelines is in progress', Object.assign({ }, context, { index }));
        }
        cb();
      });
    };

    const context = { jobData };
    api.logger.info('Processing job for insertInterestedUsersTimelines', context);
    if (jobData.interests.length === 1) {
      api.interest.eachUsers(jobData.keyspace, jobData.interests[0], (error, users, nextUsers) => {
        if (error) {
          api.logger.error('Failed to process job for insertInterestedUsersTimelines', Object.assign({}, context, { error }));
          api.metrics.increment('feed.interested_users_timeline.propagation.error', undefined, ['error_type:failed_to_find_target_audience']);
          return next(error);
        }

        async.eachOfLimit(users, propagationBatchSize, upsertPostToFeedTimeline(context), (err) => {
          if (err) {
            api.logger.error('Failed to process job for insertInterestedUsersTimelines', Object.assign({}, context, { error }));
            api.metrics.increment('feed.interested_users_timeline.propagation.error', undefined, ['error_type:failed_to_propagate']);
            return next(err);
          }
          if (nextUsers) {
            return nextUsers();
          }

          api.metrics.increment('feed.interested_users_timeline.propagation');
          api.logger.info('Processed job for insertInterestedUsersTimelines', context);
          return next();
        });
      });
    } else {
      async.reduce(jobData.interests, [], selectUsersByInterest, (error, users) => {
        if (error) {
          api.logger.error('Failed to process job for insertInterestedUsersTimelines', Object.assign({}, context, { error }));
          api.metrics.increment('feed.interested_users_timeline.propagation.error', undefined, ['error_type:failed_to_find_target_audience']);
          return next(error);
        }
        const interestedUsers = _.uniq(users);
        const subContext = Object.assign({}, context, { numberOfInterestedUsers: interestedUsers.length });
        api.logger.info('Propagating post for insertInterestedUsersTimelines', subContext);
        async.eachOfLimit(interestedUsers, propagationBatchSize, upsertPostToFeedTimeline(subContext), (err) => {
          if (err) {
            api.logger.error('Failed to process job for insertInterestedUsersTimelines', Object.assign({}, subContext, { error }));
            api.metrics.increment('feed.interested_users_timeline.propagation.error', undefined, ['error_type:failed_to_propagate']);
            return next(err);
          }
          api.metrics.increment('feed.interested_users_timeline.propagation');
          api.logger.info('Processed job for insertInterestedUsersTimelines', subContext);
          next();
        });
      });
    }
  };

  const insertMentionedTimeline = (jobData, next) => {
    const getPost = cb => {
      api.post.getPost(jobData.keyspace, jobData.user, jobData.id, (err, post) => {
        if (err || !post || post.content_type !== 'text/html') return cb();
        cb(null, post.content);
      });
    };

    const getMentionedUsers = (content, cb) => {
      if (!cb) {
        return content();
      } // no mentioned users
      let users = content.match(MENTION);
      if (users && users.length > 0) {
        users = users.map(user => user.replace('@', ''));
        async.map(users, (username, cb2) => {
          api.user.getUserByName(jobData.keyspace, username, (err, mentionedUser) => {
            if (err || !mentionedUser) {
              return cb2();
            }
            api.friend.isFriend(jobData.keyspace, mentionedUser.user, jobData.user, (err, isFriend) => {
              if (err) return cb2(err);
              mentionedUser.isFriend = isFriend;
              cb2(null, mentionedUser);
            });
          });
        }, cb);
      } else {
        return cb();
      }
    };

    const getMentionedNotFollowers = (mentioned, cb) => {
      if (!cb) {
        return mentioned();
      } // no mentioned users
      client.execute(q(jobData.keyspace, 'selectFollowers'), [jobData.user], {}, (err, data) => {
        if (err) {
          return cb(err);
        }
        const followers = _.map(_.map(data || [], 'user_follower'), item => item.toString());
        const mentionedNotFollowers = _.filter(mentioned, mentionedUser => !(_.includes(followers, mentionedUser.user.toString()) || mentionedUser.user.toString() === jobData.user.toString()));
        cb(null, mentionedNotFollowers);
      });
    };

    const insertMentioned = (users, cb) => {
      if (!cb) {
        return users();
      } // no mentioned users
      async.map(users, (mentionedUser, cb2) => {
        const isPrivate = jobData.visibility === api.visibility.PRIVATE;
        if (!isPrivate || (isPrivate && mentionedUser.isFriend)) {
          upsertTimeline(jobData.keyspace, 'feed_timeline', mentionedUser.user, jobData.id, jobData.type, client.generateTimeId(jobData.timestamp), jobData.visibility, cb2);
        } else {
          cb2();
        }
      }, cb);
    };

    async.waterfall([
      getPost,
      getMentionedUsers,
      getMentionedNotFollowers,
      insertMentioned,
    ], next);
  };

  const addFeedItem = (keyspace, user, object, type, propagateTo, next) => {
    if (!next) {
      next = propagateTo;
      propagateTo = [];
    }

    const jobData = {
      keyspace,
      user,
      object,
      id: object[type],
      type,
      timestamp: client.generateTimeId(object.timestamp),
      visibility: object.visibility,
      propagateTo,
    };

    debug('Adding feed item', user, object, type);

    const _insertFollowersTimeline = cb => {
      if (messaging.enabled) {
        messaging.submit('seguir-publish-to-followers', jobData, cb);
      } else {
        insertFollowersTimeline(jobData, cb);
      }
    };

    const _insertMentionedTimeline = cb => {
      if (type !== 'post' || jobData.ispersonal) {
        return cb();
      }
      if (messaging.enabled) {
        messaging.submit('seguir-publish-mentioned', jobData, cb);
      } else {
        insertMentionedTimeline(jobData, cb);
      }
    };

    const insertUserTimelines = cb => {
      async.map(FEEDS, (timeline, cb2) => {
        upsertTimeline(keyspace, timeline, jobData.user, jobData.id, jobData.type, jobData.timestamp, jobData.visibility, cb2);
      }, cb);
    };

    async.series([
      insertUserTimelines,
      _insertFollowersTimeline,
      _insertMentionedTimeline,
    ], next);
  };

  const addFeedItemToGroup = (keyspace, group, user, object, type, next) => {
    const jobData = {
      keyspace,
      group,
      user,
      object,
      id: object[type],
      type,
      timestamp: client.generateTimeId(object.timestamp),
      visibility: object.visibility,
    };

    debug('Adding feed item to group', group, user, object, type);

    const insertUserTimelines = cb => {
      async.parallel([
        cb2 => {
          upsertFeedTimelineFromGroup(keyspace, jobData.user, jobData.id, jobData.type, jobData.timestamp, jobData.group, cb2);
        },
        cb2 => {
          upsertUserTimelineFromGroup(keyspace, jobData.user, jobData.id, jobData.type, jobData.timestamp, cb2);
        },
      ], cb);
    };

    const insertGroupTimeline = cb => {
      upsertGroupTimeline(jobData.keyspace, jobData.group, jobData.id, jobData.type, jobData.timestamp, cb);
    };

    const _insertMembersTimeline = cb => {
      if (messaging.enabled) {
        messaging.submit('seguir-publish-to-members', jobData, cb);
      } else {
        insertMembersTimeline(jobData, cb);
      }
    };

    async.series([
      insertUserTimelines,
      insertGroupTimeline,
      _insertMembersTimeline,
    ], next);
  };

  const addFeedItemToInterestedUsers = (keyspace, user, object, interests, type, next) => {
    const jobData = {
      keyspace,
      user,
      interests,
      content_type: object.content_type,
      id: object[type],
      type,
      timestamp: client.generateTimeId(object.timestamp),
      visibility: object.visibility,
    };

    debug('Adding feed item', user, object, type);

    upsertTimeline(jobData.keyspace, 'feed_timeline', user, jobData.id, jobData.type, jobData.timestamp, api.visibility.PERSONAL, (error) => {
      if (error) { return next(error); }
      if (messaging.enabled) {
        messaging.submit('seguir-publish-to-interested-users', jobData, next);
      } else {
        insertInterestedUsersTimelines(jobData, next);
      }
    });
  };

  const notify = (keyspace, action, user, item) => {
    const NOTIFY_Q = 'seguir-notify';
    if (!messaging.enabled || !messaging.feed) { return; }
    if (action === 'feed-add') {
      const expander = feedExpanders[item.type];
      if (expander) {
        api.user.getUser(keyspace, user, (err, userObject) => {
          if (err) { return; }
          expander(keyspace, user, item, (err, expandedItem) => {
            if (err) { return; }
            if (!expandedItem) {
              console.log(`Unable to expand for notification user: ${user}, item: ${JSON.stringify(item)}`);
              return;
            }
            // Do not notify a user about things that they post or where they are the follower
            const isUser = expandedItem.type === 'follow'
              ? userObject.user.toString() === expandedItem.user_follower.user.toString()
              : userObject.user.toString() === expandedItem.user.user.toString();
            if (!isUser) {
              messaging.submit(NOTIFY_Q, {
                action,
                item,
                user: userObject,
                data: expandedItem,
              });
            }
          });
        });
      }
    }
    if (action === 'feed-remove') {
      api.user.getUser(keyspace, user, (err, userObject) => {
        if (err) { return; }
        messaging.submit(NOTIFY_Q, { action, user: userObject, item });
      });
    }
    if (action === 'feed-view') {
      api.user.getUser(keyspace, user, (err, userObject) => {
        if (err) { return; }
        messaging.submit(NOTIFY_Q, { action, user: userObject });
      });
    }
  };

  const upsertTimeline = (keyspace, timeline, user, item, type, time, visibility, from_follow, next) => {
    if (!next) {
      next = from_follow;
      from_follow = null;
    }
    visibility = visibility || api.visibility.PUBLIC;
    const data = [user, item, type, time, visibility, from_follow];
    if (timeline === 'feed_timeline') notify(keyspace, 'feed-add', user, { item, type });
    debug('Upsert into timeline: ', timeline, user, item, type, time, visibility);
    client.execute(q(keyspace, 'upsertUserTimeline', { TIMELINE: timeline }), data, {}, next);
    api.metrics.increment(`feed.${timeline}.${type}`);
  };

  const upsertFeedTimelineFromGroup = (keyspace, user, item, type, time, from_group, next) => {
    const visibility = api.visibility.PERSONAL;
    const data = [user, item, type, time, visibility, from_group];
    notify(keyspace, 'feed-add', user, { item, type });
    debug('Upsert into timeline: ', 'feed_timeline', user, item, type, time, visibility, from_group);
    client.execute(q(keyspace, 'upsertFeedTimelineFromGroup'), data, {}, next);
    api.metrics.increment(`feed.feed_timeline.${type}`);
  };

  const upsertUserTimelineFromGroup = (keyspace, user, item, type, time, next) => {
    const visibility = api.visibility.PERSONAL;
    const data = [user, item, type, time, visibility];
    debug('Upsert into timeline: ', 'user_timeline', user, item, type, time, visibility);
    client.execute(q(keyspace, 'upsertUserTimelineFromGroup'), data, {}, next);
    api.metrics.increment(`feed.user_timeline.${type}`);
  };

  const upsertGroupTimeline = (keyspace, group, item, type, time, next) => {
    const data = [group, item, type, time];
    debug('Upsert into timeline: ', 'group_timeline', group, item, type, time);
    client.execute(q(keyspace, 'upsertGroupTimeline'), data, {}, next);
    api.metrics.increment(`feed.group_timeline.${type}`);
  };

  const removeFeedsForItem = (keyspace, item, next) => {
    async.map(FEEDS, (timeline, cb) => {
      _removeFeedsForItemFromTimeline(keyspace, timeline, item, cb);
    }, next);
  };

  const _removeFeedsForItemFromTimeline = (keyspace, timeline, item, next) => {
    const queryData = [item];
    client.execute(q(keyspace, 'selectAllItems', { TIMELINE: timeline }), queryData, {}, (err, data) => {
      /* istanbul ignore if */
      if (err || data.length === 0) { return next(err); }
      async.map(data, (row, cb) => {
        _removeFeedItemFromTimeline(keyspace, timeline, row.user, row.time, item, cb);
      }, err => {
        next(err);
      });
    });
  };

  const removeFeedsOlderThan = (keyspace, user, time, next) => {
    async.map(FEEDS, (timeline, cb) => {
      _removeFeedsOlderThanFromTimeline(keyspace, timeline, user, time, cb);
    }, next);
  };

  const _removeFeedsOlderThanFromTimeline = (keyspace, timeline, user, time, next) => {
    const options = { raw: true, olderThan: client.generateTimeId(time), pageSize: 1000 };
    _getFeed(keyspace, user, timeline, user, options, (err, feed) => {
      if (err) return next(err);
      async.map(feed, (row, cb) => {
        _removeFeedItemFromTimeline(keyspace, timeline, user, row.time, row.item, cb);
      }, next);
    });
  };

  const _removeFeedItemFromTimeline = (keyspace, timeline, user, time, item, next) => {
    const deleteData = [user, time];
    if (timeline === 'feed_timeline') notify(keyspace, 'feed-remove', user, { item, type: item.type });
    client.execute(q(keyspace, 'removeFromTimeline', { TIMELINE: timeline }), deleteData, {}, err => {
      if (err) return next(err);
      next(null, { status: 'removed' });
    });
  };

  const getUserFeed = (keyspace, liu, user, options, next) => {
    if (!next) {
      next = options;
      options = {};
    }
    _getFeed(keyspace, liu, 'user_timeline', user, options, next);
  };

  const getFeed = (keyspace, liu, user, options, next) => {
    if (!next) {
      next = options;
      options = {};
    }
    if (liu && liu.toString() === user.toString()) notify(keyspace, 'feed-view', user, {});
    _getFeed(keyspace, liu, 'feed_timeline', user, options, next);
  };

  const getGroupFeed = (keyspace, liu, group, options, next) => {
    if (!next) {
      next = options;
      options = {};
    }
    api.common.isUserGroupMember(keyspace, liu, group, err => {
      if (err) { return next(err); }
      _getFeed(keyspace, liu, 'group_timeline', group, options, next);
    });
  };

  const getGroupPreview = (keyspace, group, next) => {
    _getFeed(keyspace, null, 'group_timeline', group, {}, next);
  };

  const getRawFeed = (keyspace, liu, user, options, next) => {
    if (!next) {
      next = options;
      options = {};
    }
    _.merge(options, { raw: 'raw' });
    _getFeed(keyspace, liu, 'feed_timeline', user, options, next);
  };

  const getReversedUserFeed = (keyspace, liu, user, options, next) => {
    if (!next) {
      next = options;
      options = {};
    }
    _.merge(options, { raw: 'raw-reverse' });
    _getFeed(keyspace, liu, 'user_timeline', user, options, next);
  };

  /**
   * A collection of helpers based on type that will expand an item in the feed
   */
  const silentlyDropError = (err, item, next) => {
    if (err && (err.statusCode === 403 || err.statusCode === 404)) {
      next(); // Silently drop posts from the feed
    } else {
      if (err) {
        return next(err);
      }
      next(null, item);
    }
  };

  const expandPost = (keyspace, liu, item, expandUser, cb) => {
    if (!cb) {
      cb = expandUser;
      expandUser = true;
    }
    const hasEmbeddedPost = !!item.post_post;
    if (hasEmbeddedPost) {
      api.post.getPostFromObject(keyspace, liu, item, (err, post) => {
        silentlyDropError(err, post, cb);
      });
    } else {
      api.post.getPost(keyspace, liu, item.item, expandUser, (err, post) => {
        silentlyDropError(err, post, cb);
      });
    }
  };

  const expandLike = (keyspace, liu, item, expandUser, cb) => {
    if (!cb) {
      cb = expandUser;
      expandUser = true;
    }
    const hasEmbeddedLike = !!item.like_like;
    if (hasEmbeddedLike) {
      api.like.getLikeFromObject(keyspace, item, cb);
    } else {
      api.like.getLike(keyspace, item.item, expandUser, cb);
    }
  };

  const expandFollow = (keyspace, liu, item, expandUser, cb) => {
    if (!cb) {
      cb = expandUser;
      expandUser = true;
    }
    const hasEmbeddedFollow = !!item.follow_follow;
    if (hasEmbeddedFollow) {
      api.follow.getFollowFromObject(keyspace, liu, item, (err, follow) => {
        silentlyDropError(err, follow, cb);
      });
    } else {
      api.follow.getFollow(keyspace, liu, item.item, expandUser, (err, follow) => {
        silentlyDropError(err, follow, cb);
      });
    }
  };

  const expandFriend = (keyspace, liu, item, expandUser, cb) => {
    if (!cb) {
      cb = expandUser;
      expandUser = true;
    }
    const hasEmbeddedFriend = !!item.friend_friend;
    if (hasEmbeddedFriend) {
      api.friend.getFriendFromObject(keyspace, liu, item, (err, friend) => {
        silentlyDropError(err, friend, cb);
      });
    } else {
      api.friend.getFriend(keyspace, liu, item.item, expandUser, (err, friend) => {
        silentlyDropError(err, friend, cb);
      });
    }
  };

  const feedExpanders = {
    post: expandPost,
    like: expandLike,
    follow: expandFollow,
    friend: expandFriend,
  };

  const ensureFollowStillActive = (keyspace, liu, item, cb) => {
    if (!item.from_follow) { return cb(); }
    api.follow.getFollow(keyspace, liu, item.from_follow, err => {
      if (err) { return cb(err); }
      cb();
    });
  };

  const _getFeed = (keyspace, liu, timeline, userOrGroup, options, next) => {
    const raw = options.raw;
    const feedType = options.type;
    const feedOlder = options.olderThan;
    const pageState = options.pageState;
    const pageSize = options.pageSize || DEFAULT_PAGESIZE;
    let typeQuery = '';
    let olderThanQuery = '';
    const data = [userOrGroup];

    if (feedType) {
      typeQuery = q(keyspace, 'typeQuery');
      data.push(feedType);
    }

    if (feedOlder && !feedType) {
      // Only allow one optional filter due to issue with postgres param numbering
      olderThanQuery = q(keyspace, 'olderThanQuery');
      data.push(feedOlder);
    }

    const queryName = (timeline === 'group_timeline') ? 'selectGroupTimeline' : 'selectTimeline';

    const query = q(keyspace, queryName, { TIMELINE: timeline, TYPEQUERY: typeQuery, OLDERTHANQUERY: olderThanQuery });

    api.metrics.increment(`feed.${timeline}.list`);

    client.execute(query, data, { pageState, pageSize }, (err, data, nextPageState) => {
      if (err) { return next(err); }

      if (data && data.length > 0) {
        if (raw) { return next(null, data); }

        const timeline = data;
        let followCache = {};
        const expandUser = false;

        const expand = (item, cb) => {
          const expander = feedExpanders[item.type];
          if (expander) {
            return expander(keyspace, liu, item, expandUser, cb);
          }
          console.log(`Unable to expand unknown feed item type: ${item.type}`);
          cb();
        };

        async.mapSeries(timeline, (item, cb) => {
          if (!item.from_follow) {
            return expand(item, cb);
          }

          const cachedFollowStatus = followCache[item.from_follow.toString()];
          if (cachedFollowStatus) {
            debug('follow cache HIT', item.from_follow.toString());
            if (cachedFollowStatus === 'active') {
              return expand(item, cb);
            }
            return cb();
          }

          debug('follow cache MISS', item.from_follow.toString());
          ensureFollowStillActive(keyspace, liu, item, err => {
            if (err) {
              followCache[item.from_follow.toString()] = 'not-active';
              return cb();
            }
            followCache[item.from_follow.toString()] = 'active';
            expand(item, cb);
          });
        }, (err, results) => {
          /* Ensure caches clear */
          followCache = null;

          /* istanbul ignore if */
          if (err || !results) { return next(err); }

          api.user.mapUserIdToUser(keyspace, results, ['user', 'user_follower', 'user_friend'], (err, resultsWithUsers) => {
            if (err) { return next(err); }

            const feed = [];
            resultsWithUsers.forEach((result, index) => {
              if (result) {
                const currentResult = result;

                // Copy elements from feed
                currentResult._item = timeline[index].item;
                currentResult.type = timeline[index].type;
                currentResult.timeuuid = timeline[index].time;
                currentResult.date = timeline[index].date;
                currentResult.fromNow = moment(currentResult.date).fromNow();
                currentResult.visibility = timeline[index].visibility || api.visibility.PUBLIC;
                currentResult.isPrivate = currentResult.visibility === api.visibility.PRIVATE;
                currentResult.isPersonal = currentResult.visibility === api.visibility.PERSONAL;
                currentResult.isPublic = currentResult.visibility === api.visibility.PUBLIC;

                // Calculated fields to make rendering easier
                currentResult.fromSomeoneYouFollow = currentResult.user.user.toString() !== userOrGroup.toString();
                currentResult.isLike = currentResult.type === 'like';
                currentResult.isPost = currentResult.type === 'post';
                currentResult.isFollow = currentResult.type === 'follow';
                currentResult.isFriend = currentResult.type === 'friend';

                const currentUserIsUser = liu && currentResult.user.user.toString() === liu.toString();
                const currentUserIsFollower = liu && currentResult.user_follower ? currentResult.user_follower.user.toString() === liu.toString() : false;
                currentResult.isUsersItem = currentUserIsUser || currentUserIsFollower;
                currentResult.isFollower = currentUserIsFollower;

                feed.push(currentResult);
              }
            });


            next(null, { feed, nextPageState });
          });
        });
      } else {
        if (err) { return next(err); }
        next(null, { feed: [] });
      }
    });
  };

  const seedFeed = (keyspace, user, userFollowing, backfill, follow, next) => {
    const feedOptions = { pageSize: Number(backfill), type: 'post' };
    getReversedUserFeed(keyspace, user, userFollowing, feedOptions, (err, feed) => {
      if (err) { return next(err); }
      async.map(feed, (item, cb) => {
        if (item.visibility !== api.visibility.PUBLIC) return cb();
        upsertTimeline(keyspace, 'feed_timeline', user, item.item, item.type, item.time, item.visibility, follow.follow, cb);
      }, next);
    });
  };

  return {
    addFeedItem,
    addFeedItemToGroup,
    addFeedItemToInterestedUsers,
    removeFeedsForItem,
    removeFeedsOlderThan,
    insertMembersTimeline,
    insertFollowersTimeline,
    insertMentionedTimeline,
    insertInterestedUsersTimelines,
    upsertTimeline,
    getFeed,
    getGroupFeed,
    getUserFeed,
    getRawFeed,
    getGroupPreview,
    seedFeed,
  };
};
