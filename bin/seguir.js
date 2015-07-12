#!/usr/bin/env node

/**
 * Command line client for seguir - used to setup a server.
 */
var inquirer = require('inquirer');
var program = require('commander');
var _ = require('lodash');
var path = require('path');

program
  .version('0.0.1')
  .option('-s, --setup [file]', 'Use setup file')
  .option('-c, --config [file]', 'Use config file')
  .option('-d, --database [database]', 'Use database type cassandra|postgres')
  .parse(process.argv);

var database = program.database || 'cassandra';
var defaultConfig = '../server/config/' + database;
var configFn;

if (program.config) {
  var configFile = path.resolve('.', program.config);
  try {
    configFn = require(configFile);
  } catch(ex) {
    console.log('Cant open config: ' + ex.message);
    process.exit(1);
  }
} else {
  var originalConfig = require(defaultConfig);
  configFn = function (next) {
    next(null, originalConfig);
  };
}

function error (err) {
  console.log('Error: ' + err.message);
  process.exit(1);
}

// Async load config
configFn(function (err, config) {

  if (err) return error(err);

  require('../api')(config, function (err, api) {

    if (err) { return process.exit(0); }

    var setupFile = program.setup;

    if (setupFile) {

      var setup;

      setupFile = path.resolve('.', setupFile);

      try {
        setup = require(setupFile);
      } catch(ex) {
        console.log('Cant open setup file: ' + ex.message);
        process.exit(1);
      }

      console.log('Setting up seguir based on: ' + setupFile);
      api.client.setup.setupSeguir(api.client, setup.keyspace, function () {
        setupAccount(setup.account, function (err, account) {
          if (err) return error(err);
          setupAccountUser(account.account, setup.account, setup.user, setup.password, setup.admin, function (err, user) {
            if (err) return error(err);
            setupApplication(account.account, setup.application, setup.appid, setup.appsecret, function () {
              process.exit(0);
            });
          });
        });
      });

    } else {

      var tasks = {
        '[setup]   Check current setup': checkSetup,
        '[setup]   Initialise a new database instance': coreSetup,
        '[setup]   Add a new account, user and application': promptAccount,
        '[migrate] Check and apply database migrations': migration,
        '[account] List users for account': listUsers,
        '[account] Add a new user to an account': addUser,
        '[apps]    List applications for account': listApplications,
        '[apps]    Add a new application to an account': addApplication,
        '[tokens]  List application tokens': listTokens,
        '[tokens]  Add a token to an application': addToken,
        '[tokens]  Reset application token': resetApplicationToken,
        '[tokens]  Enable / disable application token': disableApplicationToken
      };

      inquirer.prompt([
        {
          type: 'list',
          message: 'What would you like to do [DB: ' + database.green + ']:',
          name: 'task',
          choices: _.keys(tasks)
        }
      ], function (answer) {
        tasks[answer.task]();
      });

    }

    function checkSetup () {
      // Check that the DB exists
      console.log('Checking ' + api.client.type + ': ' + JSON.stringify(config[api.client.type]));
      api.auth.getAccounts(function (err, accounts) {
        if (err) {
          console.log('An error was encountered: ' + err.message);
          if (err.message === 'Keyspace / schema seguir does not exist') {
            console.log('It looks like you need to initialise this instance, please re-run this command and select that option.');
          }
        } else {
          if (accounts.length === 0) {
            console.log('It looks like you need to create your first account, please re-run this command and select that option.');
          } else {
            console.log('Configuration looks OK on the surface, ' + accounts.length + ' accounts were found.');
          }
        }
        process.exit();
      });
    }

    function migration () {
      api.migrations.getMigrationsToApply(function (err, migrations) {
        if (err) return error(err);
        if (migrations.length === 0) {
          console.log('No database migrations to apply - everything is up to date.');
          return process.exit();
        }
        console.log('\nMigrations to apply:\n');
        migrations.forEach(function (migration) {
          console.log(migration.type.green + '[' + migration.keyspace.cyan + ']: ' + migration.version + ' ' + migration.description);
        });
        console.log('');
        confirmMigration(migrations);
      });
    }

    function confirmMigration (migrations) {
      inquirer.prompt([
        {
          type: 'confirm',
          message: 'Do you want to apply these migrations now?',
          name: 'confirm'
        }
      ], function (confirm) {
        if (confirm.confirm) {
          api.migrations.applyMigrations(migrations, function (err) {
            console.dir(err);
            if (err) return error(err);
            console.log('Database migrations complete.');
            process.exit();
          });
        } else {
          process.exit();
        }
      });
    }

    function listUsers () {
      selectAccount(function (err, account, name) {
        if (err) return error(err);
        console.log(name + ' users:');
        api.auth.getAccountUsers(account, function (err, users) {
          if (err) return error(err);
          if (users) {
            users.forEach(function (user) {
              console.log(' - ' + user.username);
            });
          } else {
            console.log(' > No users for this account!');
          }
          process.exit();
        });
      });
    }

    function listApplications () {
      selectAccount(function (err, account, name) {
        if (err) return error(err);
        console.log(name + ' applications:');
        api.auth.getApplications(account, function (err, apps) {
          if (err) return error(err);
          if (apps) {
            apps.forEach(function (app) {
              console.log(' - [' + app.name + '] appid: ' + app.appid);
            });
          } else {
            console.log(' > No apps for this account!');
          }
          process.exit();
        });
      });
    }

    function addToken () {
      selectAccount(function (err, account, name) {
        if (err) return error(err);
        selectApplication(account, function (err, application, name, appkeyspace) {
          if (err) return error(err);
          inquirer.prompt([
            {
              type: 'input',
              message: 'Enter a token description:',
              name: 'description'
            }
          ], function (output) {
            if (!output.description) { return; }
            api.auth.addApplicationToken(application, appkeyspace, output.description, function (err, token) {
              if (err) return error(err);
              if (token) {
                console.log(' Added token: ' + output.description);
                console.log(' - tokenid: ' + token.tokenid + ' / tokensecret: ' + token.tokensecret);
              }
              process.exit();
            });
          });

        });
      });
    }

    function listTokens () {
      selectAccount(function (err, account, name) {
        if (err) return error(err);
        selectApplication(account, function (err, application, name) {
          if (err) return error(err);
          console.log(name + ' applications:');
          api.auth.getApplicationTokens(application, function (err, tokens) {
            if (err) return error(err);
            if (tokens) {
              tokens.forEach(function (token) {
                console.log(' - [' + token.description + ' - ' + (token.enabled ? 'ENABLED' : 'DISABLED') + '] - tokenid: ' + token.tokenid + ' / tokensecret: ' + token.tokensecret);
              });
            } else {
              console.log(' > No tokens for this account!');
            }
            process.exit();
          });
        });
      });
    }

    function promptToken (next) {
      selectAccount(function (err, account) {
        if (err) return error(err);
        selectApplication(account, function (err, application) {
          if (err) return error(err);
          selectApplicationToken(application, function (err, token) {
            if (err) return error(err);
            next(null, token);
          });
        });
      });
    }

    function resetApplicationToken () {
      promptToken(function (err, token) {
        if (err) return error(err);
        confirmResetToken(token);
      });
    }

    function disableApplicationToken () {
      promptToken(function (err, token) {
        if (err) return error(err);
        confirmDisableToken(token);
      });
    }

    function selectAccount (next) {
      api.auth.getAccounts(function (err, accounts) {
        if (err) return error(err);
        var accs = _.pluck(accounts, 'name');
        inquirer.prompt([
          {
            type: 'list',
            message: 'Select an account:',
            name: 'name',
            choices: accs
          }
        ], function (answer) {
          next(null, _.result(_.find(accounts, { 'name': answer.name }), 'account'), answer.name);
        });
      });
    }

    function selectApplication (account, next) {
      api.auth.getApplications(account, function (err, applications) {
        if (err) return error(err);
        var apps = _.pluck(applications, 'name');
        inquirer.prompt([
          {
            type: 'list',
            message: 'Select an application:',
            name: 'name',
            choices: apps
          }
        ], function (answer) {
          var application = _.find(applications, { 'name': answer.name });
          next(null, _.result(application, 'appid'), answer.name, _.result(application, 'appkeyspace'));
        });
      });
    }

    function selectApplicationToken (application, next) {
      api.auth.getApplicationTokens(application, function (err, tokens) {
        if (err) return error(err);
        var tokenDescriptions = _.pluck(tokens, 'description');
        inquirer.prompt([
          {
            type: 'list',
            message: 'Select an application token:',
            name: 'description',
            choices: tokenDescriptions
          }
        ], function (answer) {
          var token = _.find(tokens, { 'description': answer.description });
          next(null, token);
        });
      });
    }

    function confirmResetToken (token) {
      inquirer.prompt([
        {
          type: 'confirm',
          message: 'This will modify the tokensecret so that the consumer using that token can no longer access seguir?',
          name: 'confirm'
        }
      ], function (confirm) {
        if (confirm.confirm) {
          api.auth.updateApplicationTokenSecret(token.tokenid, function (err, token) {
            if (!err) {
              console.log('Token updated, update the client application if you still want it to have access!');
              console.log('tokenid:     ' + token.tokenid);
              console.log('tokensecret: ' + token.tokensecret);
            } else {
              console.log('ERROR: ' + err.message);
            }
            process.exit();
          });
        } else {
          process.exit();
        }
      });
    }

    function confirmDisableToken (token) {
      var message = token.enabled ? 'This will disable a token so that any applications using it can no longer access seguir - they will immediately stop working - continue?' : 'Re-enable token?';
      inquirer.prompt([
        {
          type: 'confirm',
          message: message,
          name: 'confirm'
        }
      ], function (confirm) {
        if (confirm.confirm) {
          api.auth.updateApplicationToken(token.tokenid, !token.enabled, token.description, function (err, token) {
            if (!err) {
              console.log('Token is now: ' + (token.enabled ? 'ENABLED' : 'DISABLED'));
            } else {
              console.log('ERROR: ' + err.message);
            }
            process.exit();
          });
        } else {
          process.exit();
        }
      });
    }

    function coreSetup () {
      inquirer.prompt([
        {
          type: 'confirm',
          message: 'This will DROP the existing keyspace if it already exists, are you sure you want to proceed?',
          name: 'confirm'
        }
      ], function (confirm) {
        if (confirm.confirm) {
          api.client.setup.setupSeguir(api.client, config.keyspace, function () {
            console.log('Completed basic setup, you now need to create your first account and application.');
            promptAccount();
          });
        }
      });
    }

    function addUser () {
      selectAccount(function (err, account, name) {
        if (err) return error(err);
        promptAccountUser(account, name, function (err) {
          if (err) return error(err);
          process.exit(0);
        });
      });
    }

    function addApplication () {
      selectAccount(function (err, account, name) {
        if (err) return error(err);
        promptApplication(account, name, function (err) {
          if (err) return error(err);
          process.exit(0);
        });
      });
    }

    function promptAccount () {
      inquirer.prompt([
        {
          type: 'input',
          message: 'Enter an account name:',
          name: 'name'
        }
      ], function (acc) {
        setupAccount(acc.name, function (err, account) {
          if (err) return error(err);
          promptAccountUser(account.account, account.name, function (err) {
            if (err) return error(err);
            promptApplication(account.account, account.name, function (err, application) {
              if (err) return error(err);
              process.exit(0);
            });
          });
        });
      });
    }

    function setupAccount (accName, next) {
      api.auth.addAccount(accName, true, true, function (err, account) {
        if (err) {
          console.log(err.message);
          process.exit(0);
        }
        next(null, account);
      });
    }

    function promptAccountUser (account, name, next) {
      inquirer.prompt([
        {
          type: 'input',
          message: 'Enter name of user to add to account ' + name + ':',
          name: 'username'
        },
        {
          type: 'input',
          message: 'Enter password for this user:',
          name: 'password'
        },
        {
          type: 'input',
          message: 'Are they an administrator of the account (y/n)?',
          name: 'isadmin'
        }
      ], function (user) {
        setupAccountUser(account, name, user.username, user.password, user.isadmin === 'y', next);
      });
    }

    function setupAccountUser (account, name, username, password, isadmin, next) {
      api.auth.addAccountUser(account, username, password, isadmin, function (err, user) {
        if (err) {
          console.log(err.message);
          process.exit(0);
        }
        next();
      });
    }

    function promptApplication (account, name, next) {
      inquirer.prompt([
        {
          type: 'input',
          message: 'Enter application name (e.g. app-name) to add to account ' + name + ':',
          name: 'name'
        }
      ], function (application) {
        setupApplication(account, application.name, null, null, next);
      });
    }

    function promptApplicationToken (application, next) {
      inquirer.prompt([
        {
          type: 'input',
          message: 'Enter application token description (e.g. first-consumer) to add to application ' + application.name + ':',
          name: 'name'
        }
      ], function (token) {
        setupApplicationToken(application, token.name, next);
      });
    }

    function setupApplication (account, name, appid, appsecret, next) {
      console.log(' ... creating schema ...');
      api.auth.addApplication(account, name, appid, function (err, application) {
        if (err) {
          console.log(err.message);
          process.exit(0);
        }
        promptApplicationToken(application, next);
      });
    }

    function setupApplicationToken (application, name, next) {
      api.auth.addApplicationToken(application.appid, application.appkeypsace, name, function (err, token) {
        if (err) {
          console.log(err.message);
          process.exit(0);
        }
        console.log('Token details are:');
        console.log('description: ' + token.description);
        console.log('tokenid: ' + token.tokenid);
        console.log('tokensecret: ' + token.tokensecret);
        next();
      });
    }

  });

});
