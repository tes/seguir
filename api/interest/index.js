module.exports = (api) => {
  const client = api.client;
  const q = client.queries;

  const addInterest = (keyspace, user, type, keyword, next) => {
    const interestValues = [user, type, keyword];
    client.execute(q(keyspace, 'upsertInterest'), interestValues, {}, (err) => {
      if (err) { return next(err); }
      next(null, { user, type, keyword });
    });
  };

  const getUsers = (keyspace, type, keyword, next) => {
    client.execute(q(keyspace, 'selectUsersByInterest'), [type, keyword], {}, (err, results) => {
      if (err) { return next(err); }
      next(null, results);
    });
  };

  return {
    addInterest,
    getUsers,
  };
};
