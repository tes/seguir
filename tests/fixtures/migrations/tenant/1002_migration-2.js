/**
 * This renames the like column 'item' to 'uri'
 */
const apply = (keyspace, api, next) => {
  next();
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply,
  rollback,
};
