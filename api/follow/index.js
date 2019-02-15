const _ = require('lodash');
const async = require('async');

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
  const q = client.queries;

  const addFollower = (keyspace, user, user_follower, timestamp, visibility, backfill, next) => {
    if (!next) {
      next = backfill;
      backfill = null;
    }
    if (user.toString() === user_follower.toString()) {
      return next({ statusCode: 500, message: 'You are not allowed to follow yourself.' });
    }

    const mapFollowResponse = (follower) => {
      api.user.mapUserIdToUser(keyspace, follower, ['user', 'user_follower'], (err, follow) => {
        if (err) return next(err);
        return next(null, follow);
      });
    };

    const backfillFeed = (follow) => {
      api.feed.seedFeed(keyspace, user_follower, user, backfill, follow, (err) => {
        if (err) return next(err);
        mapFollowResponse(follow);
      });
    };

    const addBidirectionalFeedItem = (follow, cb) => {
      api.feed.addFeedItem(keyspace, user, follow, 'follow', (err) => {
        if (err) { return next(err); }
        api.feed.addFeedItem(keyspace, user_follower, follow, 'follow', (err, result) => {
          if (err) { return next(err); }
          cb(null, result);
        });
      });
    };

    isFollower(keyspace, user, user_follower, (err, isFollower, followerSince, follow) => {
      if (err) { return next(err); }
      if (isFollower) {
        return mapFollowResponse(follow);
      }

      const newFollowId = client.generateId();
      const followerData = [newFollowId, user, user_follower, timestamp, visibility];
      const isPublic = api.visibility.isPublic(visibility);
      const isPersonal = api.visibility.isPersonal(visibility);
      const isPrivate = api.visibility.isPrivate(visibility);
      const timelineData = [newFollowId, user, user_follower, client.generateTimeId(timestamp), timestamp, isPrivate, isPersonal, isPublic];
      const newFollow = _.zipObject(['follow', 'user', 'user_follower', 'since', 'visibility'], followerData);

      client.batch
        .addQuery(q(keyspace, 'upsertFollower'), followerData)
        .addQuery(q(keyspace, 'upsertFollowerTimeline'), timelineData)
        .addQuery(q(keyspace, 'upsertFollowingTimeline'), timelineData)
        .execute((err) => {
          /* istanbul ignore if */
          if (err) { return next(err); }
          alterFollowCounts(keyspace, user, user_follower, 1, () => {
            addBidirectionalFeedItem(newFollow, (err) => {
              if (err) { return next(err); }
              client.deleteCacheItem(`follow:${user}:${user_follower}`, () => {
                if (backfill) {
                  backfillFeed(newFollow);
                } else {
                  mapFollowResponse(newFollow);
                }
              });
            });
          });
        });
      api.metrics.increment('follower.add');
    });
  };

  const alterFollowCounts = (keyspace, user, user_follower, count, next) => {
    const alterCount = (type, item, cb) => {
      const data = [count, item.toString()];
      client.execute(q(keyspace, 'updateCounter', { TYPE: type }), data, { cacheKey: `count:${type}:${item.toString()}` }, cb);
    };

    async.parallel([
      (cb) => { alterCount('followers', user, cb); },
      (cb) => { alterCount('following', user_follower, cb); },
    ], next);
  };

  const followCounts = (keyspace, user, next) => {
    async.parallel(
      [
        (cb) => { followerCount(keyspace, user, cb); },
        (cb) => { followingCount(keyspace, user, cb); },
      ],
      (err, results) => {
        next(err, {
          followers: results[0] && results[0].count ? +results[0].count.toString() : 0,
          following: results[1] && results[1].count ? +results[1].count.toString() : 0,
        });
      });
  };

  const followerCount = (keyspace, user, next) => {
    count('followers', keyspace, user, next);
  };

  const followingCount = (keyspace, user, next) => {
    count('following', keyspace, user, next);
  };

  const count = (followType, keyspace, user, next) => {
    const noop = () => { };
    next = next || noop;
    const data = [user.toString()];
    const cacheKey = `count:${followType}:${user.toString()}`;
    const queryName = followType === 'followers' ? 'selectFollowersCount' : 'selectFollowingCount';
    client.get(q(keyspace, queryName, {}), data, { cacheKey }, (err, count) => {
      if (err) {
        return next(err);
      }
      if (!count) {
        // Manually set the cache as the default won't set a null
        client.setCacheItem(cacheKey, { _: 0 }, () =>
          next(null, 0)
        );
      } else {
        return next(null, count);
      }
    });
  };

  const removeFollower = (keyspace, user, user_follower, next) => {
    getFollowerTimeline(keyspace, user, user_follower, (err, followerTimeline) => {
      if (err) { return next(err); }
      if (!followerTimeline) { return next({ statusCode: 404, message: 'Cant unfollow a user you dont follow' }); }
      const deleteData = [user, user_follower];
      const deleteFollowerTimedata = [user, followerTimeline.time];
      const deleteFollowingTimedata = [user_follower, followerTimeline.time];

      client.batch
        .addQuery(q(keyspace, 'removeFollower'), deleteData, `follow:${followerTimeline.follow}`)
        .addQuery(q(keyspace, 'removeFollowerTimeline'), deleteFollowerTimedata, `follower_timeline:${user}:${user_follower}`)
        .addQuery(q(keyspace, 'removeFollowingTimeline'), deleteFollowingTimedata, `follower_timeline:${user}:${user_follower}`)
        .execute((err) => {
          if (err) return next(err);
          alterFollowCounts(keyspace, user, user_follower, -1, () => {
            api.feed.removeFeedsForItem(keyspace, followerTimeline.follow, (err) => {
              if (err) return next(err);
              client.deleteCacheItem(`follow:${user}:${user_follower}`, () => {
                next(null, { status: 'removed' });
              });
            });
          });
        });
      api.metrics.increment('follower.remove');
    });
  };

  const getFollowerTimeline = (keyspace, user, user_follower, next) => {
    if (!user || !user_follower) { return next(null, null); }
    const cacheKey = `follower_timeline:${user}:${user_follower}`;
    client.get(q(keyspace, 'selectFollowFromTimeline'), [user, user_follower], { cacheKey }, (err, followerTimeline) => {
      if (err) { return next(err); }
      if (!followerTimeline) {
        // Manually set the cache as the default won't set a null
        client.setCacheItem(cacheKey, { _: 0 }, () =>
          next()
        );
      } else {
        next(null, followerTimeline);
      }
    });
  };

  const isFollower = (keyspace, user, user_follower, next) => {
    if (!user || !user_follower) { return next(null, false, null, null); }
    if (user.toString() === user_follower.toString()) {
      return next(null, false, null, {});
    }
    const cacheKey = `follow:${user}:${user_follower}`;
    client.get(q(keyspace, 'isFollower'), [user, user_follower], { cacheKey }, (err, follow) => {
      if (err) { return next(null, false, null, {}); }
      if (!follow) {
        // Manually set the cache as the default won't set a null
        client.setCacheItem(cacheKey, { _: 0 }, () =>
          next(null, false, null, {})
        );
      } else {
        const isFollower = !!(follow && follow.follow);
        const isFollowerSince = isFollower ? follow.since : null;
        return next(null, isFollower, isFollowerSince, follow || null);
      }
    });
  };

  const getFollowFromObject = (keyspace, liu, item, next) => {
    const followObject = api.common.expandEmbeddedObject(item, 'follow', 'follow');
    api.friend.userCanSeeItem(keyspace, liu, followObject, ['user', 'user_follower'], (err) => {
      if (err) { return next(err); }
      api.user.mapUserIdToUser(keyspace, item, ['user', 'user_follower'], (err, objectWithUsers) => {
        if (err) { return next(err); }
        followObject.user = objectWithUsers.user;
        followObject.user_follower = objectWithUsers.user_follower;
        next(null, followObject);
      });
    });
  };

  const getFollow = (keyspace, liu, follow, expandUser, next) => {
    if (!next) {
      next = expandUser;
      expandUser = true;
    }
    client.get(q(keyspace, 'selectFollow'), [follow], { cacheKey: `follow:${follow}` }, (err, follower) => {
      /* istanbul ignore if */
      if (err) { return next(err); }
      if (!follower) { return next({ statusCode: 404, message: 'Follow not found' }); }
      api.friend.userCanSeeItem(keyspace, liu, follower, ['user', 'user_follower'], (err) => {
        if (err) { return next(err); }
        api.user.mapUserIdToUser(keyspace, follower, ['user', 'user_follower'], expandUser, next);
      });
    });
  };

  const getFollows = (keyspace, query, liu, user, options, next) => {
    if (!next) {
      next = options;
      options = {};
    }

    const pageState = options.pageState;
    const pageSize = options.pageSize || 50;
    const queryField = query.field;

    const isUser = liu && user && liu.toString() === user.toString();
    api.friend.isFriend(keyspace, liu, user, (err, isFriend) => {
      if (err) {
        return next(err);
      }

      const privacyQuery = api.visibility.mapToQuery(isUser, isFriend);
      // note this is only needed for postgres - remove when(if) postgres goes
      const visibility = api.visibility.mapToParameters(isUser, isFriend);
      const selectOptions = { pageState, pageSize };

      client.execute(q(keyspace, query.name, _.merge({ PRIVACY: privacyQuery }, visibility)), [user], selectOptions, (err, follows, nextPageState) => {
        if (err) {
          return next(err);
        }

        // For each follow, check if the liu is following them or being following by tem if we are logged in
        if (liu) {
          async.map(follows, (follow, cb) => {
            followCounts(keyspace, follow[queryField], (err, counts) => {
              if (err) {
                return cb(err);
              }

              follow.followerCount = counts && counts.followers ? counts.followers : 0;
              follow.followingCount = counts && counts.following ? counts.following : 0;
              if (follow[queryField].toString() === liu.toString()) {
                follow.liuIsFollowing = true;
                follow.liuIsUser = true;
                return cb(null, follow);
              }

              isFollower(keyspace, follow[queryField], liu, (err, isFollower) => {
                if (err) {
                  return cb(err);
                }
                follow.liuIsFollowing = isFollower;
                follow.liuIsUser = false;
                cb(null, follow);
              });
            });
          }, (err) => {
            if (err) { return next(err); }
            api.user.mapUserIdToUser(keyspace, follows, [queryField], (err, mappedFollowers) => {
              if (err) { return next(err); }
              next(null, { follows: mappedFollowers, pageState: nextPageState });
            });
          });
        } else {
          async.map(follows, (follow, cb) => {
            followCounts(keyspace, follow[queryField], (err, followCount) => {
              if (err) {
                return cb(err);
              }
              follow.followerCount = followCount && followCount.followers ? followCount.followers : 0;
              follow.followingCount = followCount && followCount.following ? followCount.following : 0;
              cb(null, follow);
            });
          }, (err) => {
            if (err) {
              return next(err);
            }
            api.user.mapUserIdToUser(keyspace, follows, [queryField], (err, mappedFollowers) => {
              if (err) {
                return next(err);
              }
              next(null, { follows: mappedFollowers, pageState: nextPageState });
            });
          });
        }
      });
    });
  };

  /**
   * @callback getFollowersCallback
   * @param {Error} err
   * @param followers list of followers
   * @param pageState pageState for the next page. Should be returned unmodified to fetch the next page.
   */

  /**
   * Get the followers of a user sorted DESC by time.  Uses the relationship between the liu and user
   * to determine what to return.
   * user === liu - return all followers.
   * user is friend of liu - return all public and personal followers.
   * otherwise only return public follows.
   * @param {String} keyspace The keyspace to select from
   * @param {uuid} liu Logged in user.  Can be null to indicate a non-logged in user.
   * @param {uuid} user User to find followers of
   * @param {{ [pageState]: String, [pageSize]: String }} [options]
   *    pageState The next page to be rendered. This will be passed into next(err, followers, pageState). To get the next page you should pass in the pageState unmodified.
   *    pageSize Number of results to return
   * @param {getFollowersCallback} next
   */
  // TODO: erk.  This method needs more async love (or promises)
  const getFollowers = (keyspace, liu, user, options, next) => {
    const query = { name: 'selectFollowersTimeline', field: 'user_follower' };
    getFollows(keyspace, query, liu, user, options, next);
    api.metrics.increment('follower.listFollowers');
  };

  /**
   * @callback getFollowingCallback
   * @param {Error} err
   * @param following list of following
   * @param pageState pageState for the next page. Should be returned unmodified to fetch the next page.
   */

  /**
   * Get the following of a user sorted DESC by time.  Uses the relationship between the liu and user
   * to determine what to return.
   * user === liu - return all following.
   * user is friend of liu - return all public and personal following.
   * otherwise only return public follows.
   * @param {String} keyspace The keyspace to select from
   * @param {uuid} liu Logged in user.  Can be null to indicate a non-logged in user.
   * @param {uuid} user User to find following of
   * @param {{ [pageState]: String, [pageSize]: String }} [options]
   *    pageState The next page to be rendered. This will be passed into next(err, following, pageState). To get the next page you should pass in the pageState unmodified.
   *    pageSize Number of results to return
   * @param {getFollowingCallback} next
   */
  const getFollowing = (keyspace, liu, user, options, next) => {
    const query = { name: 'selectFollowingTimeline', field: 'user' };
    getFollows(keyspace, query, liu, user, options, next);
    api.metrics.increment('follower.listFollowing');
  };

  // can't use pageState as per usual, as we are removing values. simply use it as indicator of more records
  const removeAllFollowersByUser = (keyspace, user, next) => {
    getFollowers(keyspace, user, user, {}, (err, { follows: followers, pageState }) => {
      if (err) { return next(err); }
      async.map(followers, (follower, cb) => {
        removeFollower(keyspace, user, follower.user_follower.user, cb);
      }, (err) => {
        if (err) { return next(err); }
        if (pageState) { return removeAllFollowersByUser(keyspace, user, next); }
        return next(null);
      });
    });
  };

  const removeAllFollowingByUser = (keyspace, user, next) => {
    getFollowing(keyspace, user, user, {}, (err, { follows: followings, pageState }) => {
      if (err) { return next(err); }
      async.map(followings, (following, cb) => {
        removeFollower(keyspace, following.user.user, user, cb);
      }, (err) => {
        if (err) { return next(err); }
        if (pageState) { return removeAllFollowingByUser(keyspace, user, next); }
        return next(null);
      });
    });
  };

  return {
    removeAllFollowersByUser,
    removeAllFollowingByUser,
    addFollower,
    removeFollower,
    getFollowers,
    getFollowing,
    getFollow,
    getFollowFromObject,
    isFollower,
    followerCount,
    followingCount,
  };
};
