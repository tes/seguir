module.exports = (api) => {
  const client = api.client;
  const q = client.queries;

  const addInterest = (keyspace, user, type, keyword, next) => {
    const interestValues = [user, type, keyword];
    client.execute(q(keyspace, 'upsertInterest'), interestValues, { cacheKey: `interest:${user}:${type}:${keyword}` }, (err) => {
      if (err) { return next(err); }
      next(null, { user, type, keyword });
    });
  };

  const getUsers = (keyspace, type, keyword, next) => {
    client.get(q(keyspace, 'selectUsersByInterest'), [type, keyword], { cacheKey: `interest:users:${type}:${keyword}` }, (err, result) => {
      if (err) { return next(err); }
      if (!result) { return next(api.common.error(404, `Unable to find users by interest: ${type}:${keyword}`)); }
      next(null, result);
    });
  };

  return {
    addInterest,
    getUsers,
  };
};
