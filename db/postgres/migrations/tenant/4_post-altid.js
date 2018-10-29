function apply(keyspace, api, next) {
  // Exists to keep schema versions in sync
  next();
}

function rollback(keyspace, api, next) {
  next();
}

module.exports = {
  apply,
  rollback,
};

