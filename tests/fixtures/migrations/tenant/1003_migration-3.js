/**
 * This renames the like column 'item' to 'uri'
 */
const apply = (keyspace, api, next) => {
  next(new Error('example error'));
};

const rollback = (keyspace, api, next) => {
  next();
};

module.exports = {
  apply: apply,
  rollback: rollback
};
