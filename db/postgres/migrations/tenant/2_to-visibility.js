function apply(keyspace, api, next) {
  next();
}

function rollback(keyspace, api, next) {
  next();
}

module.exports = {
  apply,
  rollback,
};
