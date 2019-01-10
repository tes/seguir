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

  return {
    addInterest,
  };
};
