/**
 * This renames the like column 'item' to 'uri'
 */
function apply (keyspace, api, next) {
  next(null);
}

function rollback (keyspace, api, next) {
  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
