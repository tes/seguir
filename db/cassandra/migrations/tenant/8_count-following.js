function apply (keyspace, api, next) {
  var selectFollowerQuery = 'SELECT DISTINCT user_follower FROM ' + keyspace + '.following_timeline;';
  var selectCountQuery = 'SELECT COUNT(1) FROM ' + keyspace + '.following_timeline WHERE user_follower = ?;';
  var insertCountQuery = 'UPDATE ' + keyspace + '.counts SET count = count + ? WHERE item = ? AND type = \'following\';';
  var read = 0;
  var write = 0;
  var done = false;

  api.client._client.eachRow(selectFollowerQuery, [], {autoPage: true}, function (index, row) {
    read++;
    api.client.execute(selectCountQuery, [row.user_follower], {prepare: true}, function (err, result) {
      if (err) {
        throw err;
      }
      console.log('result ', result[0].count);
      api.client.execute(insertCountQuery, [result[0].count, row.user_follower.toString()], {prepare: true}, function (err1, result1) {
        if (err1) {
          throw err1;
        }

        if (read === ++write && done) {
          next();
        }
      });
    });
  }, function () {
    done = true;
  });
}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
