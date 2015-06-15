/**
 * This renames the like column 'item' to 'uri'
 */
function apply (version, description, api, next) {

  console.log('APPLY ' + version + ' ' + description);
  next();

}

function rollback (version, description, api, next) {

  next();
}

module.exports = {
  apply: apply,
  rollback: rollback
};
