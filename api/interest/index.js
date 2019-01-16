const async = require('async');

module.exports = (api) => {
  const client = api.client;
  const q = client.queries;

  const upsertInterests = (keyspace, user, interests, next) => {
    client.execute(q(keyspace, 'selectUserInterests'), [user], {}, (err, results) => {
      if(err) { return next(err); }
      async.each(results, ({ user, type, keyword }, cb) => {
        client.execute(q(keyspace, 'deleteUserInterest'), [user, type, keyword], {}, cb);
      }, (err) => {
        if(err) { return next(err); }
        async.each(interests, ({ type, keyword }, cb) => {
          const interestValues = [user, type, keyword];
          client.execute(q(keyspace, 'upsertInterest'), interestValues, {}, cb);
        }, next);
      });
    });
  };

  const getUsers = (keyspace, type, keyword, next) => {
    client.execute(q(keyspace, 'selectUsersByInterest'), [type, keyword], {}, (err, results) => {
      if (err) { return next(err); }
      next(null, results);
    });
  };

  return {
    upsertInterests,
    getUsers,
  };
};
