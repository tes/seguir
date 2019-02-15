const async = require('async');

module.exports = (api) => {
  const client = api.client;
  const q = client.queries;

  const upsertInterests = (keyspace, user, interests, next) => {
    client.execute(q(keyspace, 'selectUserInterests'), [user], {}, (err, results) => {
      if (err) { return next(err); }
      async.each(results, ({ user, type, keyword }, cb) => {
        client.execute(q(keyspace, 'deleteUserInterest'), [user, type, keyword], {}, cb);
      }, (err) => {
        if (err) { return next(err); }
        async.each(interests, ({ type, keyword }, cb) => {
          const interestValues = [user, type, keyword];
          client.execute(q(keyspace, 'upsertInterest'), interestValues, {}, cb);
        }, next);
      });
    });
  };

  const getUsers = (keyspace, interest, memo, options, next) => {
    if (!next) { // getAllUsers(keyspace, interest, memo, next)
      next = options;
      options = {};
    }
    if (!next) { // getAllUsers(keyspace, interest, next)
      next = memo;
      memo = [];
    }

    const { type, keyword } = interest;
    const { pageState } = options;
    const context = { interest, pageState };
    api.logger.info('Finding users by interest', context);
    client.execute(q(keyspace, 'selectUsersByInterest'), [type, keyword], { pageState }, (error, results, nextPageState) => {
      if (error) {
        api.logger.error('Error finding users by interest', Object.assign({}, context, { error }));
        return next(error);
      }
      const users = memo.concat(results.map(({ user }) => user));
      api.logger.info('Found users by interest', Object.assign({}, context, { found: results.length, numberOfInterestedUsers: users.length }));
      if (nextPageState) {
        return getUsers(keyspace, interest, users, { pageState: nextPageState }, next);
      }
      return next(null, users);
    });
  };

  const eachUsers = (keyspace, interest, options, next) => {
    if (!next) { // eachUsers(keyspace, interest, next)
      next = options;
      options = {};
    }

    const { type, keyword } = interest;
    const { pageState } = options;
    const context = { interest, pageState };
    api.logger.info('Paging users by interest', context);
    client.execute(q(keyspace, 'selectUsersByInterest'), [type, keyword], { pageState }, (error, results, nextPageState) => {
      if (error) {
        api.logger.error('Error paging users by interest', Object.assign({}, context, { error }));
        return next(error);
      }
      const users = results.map(({ user }) => user);
      api.logger.info('Paged users by interest', Object.assign({}, context, { found: results.length }));
      next(null, users, nextPageState && (() => {
        eachUsers(keyspace, interest, { pageState: nextPageState }, next);
      }));
    });
  };

  return {
    upsertInterests,
    getUsers,
    eachUsers,
  };
};
