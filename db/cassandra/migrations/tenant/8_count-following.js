const apply = (keyspace, api, next) => {
  const selectFollowerQuery = 'SELECT DISTINCT user_follower FROM ' + keyspace + '.following_timeline;';
  const selectCountQuery = 'SELECT COUNT(1) FROM ' + keyspace + '.following_timeline WHERE user_follower = ?;';
  const insertCountQuery = 'UPDATE ' + keyspace + '.counts SET count = count + ? WHERE item = ? AND type = \'following\';';
  let read = 0;
  let write = 0;
  let done = false;

  api.client._client.eachRow(selectFollowerQuery, [], {autoPage: true}, (index, row) => {
    read++;
    api.client.execute(selectCountQuery, [row.user_follower], {prepare: true}, (err, result) => {
      if (err) {
        throw err;
      }
      console.log('result ', result[0].count);
      api.client.execute(insertCountQuery, [result[0].count, row.user_follower.toString()], {prepare: true}, (err1, result1) => {
        if (err1) {
          throw err1;
        }

        if (read === ++write && done) {
          next();
        }
      });
    });
  }, () => {
    done = true;
  });
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply,
  rollback
};
