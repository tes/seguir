Migrations for the tenant (application) keyspace are placed here, of the form:

```
// 1_migration-description.js

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
```
