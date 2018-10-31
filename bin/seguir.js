#!/usr/bin/env node
/**
 * Command line client for seguir - used to setup a server.
 */
const inquirer = require('inquirer');
const program = require('commander');
const _ = require('lodash');
const path = require('path');

program
  .version('0.0.1')
  .option('-s, --setup [file]', 'Use setup file')
  .option('-c, --config [file]', 'Use config file')
  .option('-d, --database [database]', 'Use database type cassandra|postgres')
  .parse(process.argv);

const database = program.database || 'cassandra';
const defaultConfig = `../config/${database}`;
let configFn;

if (program.config) {
  const configFile = path.resolve('.', program.config);
  try {
    configFn = require(configFile);
  } catch (ex) {
    console.log(`Cant open config: ${ex.message}`);
    process.exit(1);
  }
} else {
  const originalConfig = require(defaultConfig);
  configFn = next => {
    next(null, originalConfig);
  };
}

const error = (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
};

// Async load config
configFn((err, config) => {
  if (err) return error(err);

  require('../api')(config, (err, api) => {
    if (err) { return process.exit(0); }

    let setupFile = program.setup;

    if (setupFile) {
      let setup;

      setupFile = path.resolve('.', setupFile);

      try {
        setup = require(setupFile);
      } catch (ex) {
        console.log(`Cant open setup file: ${ex.message}`);
        process.exit(1);
      }

      console.log(`Setting up seguir based on: ${setupFile}`);
      api.client.setup.setupSeguir(api.client, setup.keyspace, () => {
        setupAccount(setup.account, (err, account) => {
          if (err) return error(err);
          setupAccountUser(account.account, setup.account, setup.user, setup.password, setup.admin, err => {
            if (err) return error(err);
            setupApplication(account.account, setup.application, true, (err, application) => {
              if (err) return error(err);
              setupApplicationToken(application, setup.application, setup.appid, setup.appsecret, err => {
                if (err) return error(err);
                process.exit(0);
              });
            });
          });
        });
      });
    } else {
      const tasks = {
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
        '[tokens]  Enable / disable application token': disableApplicationToken,
      };

      inquirer.prompt([
        {
          type: 'list',
          message: `What would you like to do [DB: ${database.green}]:`,
          name: 'task',
          choices: _.keys(tasks),
        },
      ], answer => {
        tasks[answer.task]();
      });
    }

    const checkSetup = () => {
      // Check that the DB exists
      console.log(`Checking ${api.client.type}: ${JSON.stringify(config[api.client.type])}`);
      api.auth.getAccounts((err, accounts) => {
        if (err) {
          console.log(`An error was encountered: ${err.message}`);
          if (err.message === 'Keyspace / schema seguir does not exist') {
            console.log('It looks like you need to initialise this instance, please re-run this command and select that option.');
          }
        } else {
          if (accounts.length === 0) {
            console.log('It looks like you need to create your first account, please re-run this command and select that option.');
          } else {
            console.log(`Configuration looks OK on the surface, ${accounts.length} accounts were found.`);
          }
        }
        process.exit();
      });
    };

    const migration = () => {
      api.migrations.getMigrationsToApply((err, migrations) => {
        if (err) return error(err);
        if (migrations.length === 0) {
          console.log('No database migrations to apply - everything is up to date.');
          return process.exit();
        }
        console.log('\nMigrations to apply:\n');
        migrations.forEach((migration) => {
          console.log(`${migration.type.green} [${migration.keyspace.cyan}]: ${migration.version} ${migration.description}`);
        });
        console.log('');
        confirmMigration(migrations);
      });
    };

    const confirmMigration = (migrations) => {
      inquirer.prompt([
        {
          type: 'confirm',
          message: 'Do you want to apply these migrations now?',
          name: 'confirm',
        },
      ], confirm => {
        if (confirm.confirm) {
          api.migrations.applyMigrations(migrations, err => {
            console.dir(err);
            if (err) return error(err);
            console.log('Database migrations complete.');
            process.exit();
          });
        } else {
          process.exit();
        }
      });
    };

    const listUsers = () => {
      selectAccount((err, account, name) => {
        if (err) return error(err);
        console.log(`${name} users:`);
        api.auth.getAccountUsers(account, (err, users) => {
          if (err) return error(err);
          if (users) {
            users.forEach(user => {
              console.log(` - ${user.username}`);
            });
          } else {
            console.log(' > No users for this account!');
          }
          process.exit();
        });
      });
    };

    const listApplications = () => {
      selectAccount((err, account, name) => {
        if (err) return error(err);
        console.log(`${name} applications:`);
        api.auth.getApplications(account, (err, apps) => {
          if (err) return error(err);
          if (apps) {
            apps.forEach(app => {
              console.log(` - [${app.name}] appid: ${app.appid}`);
            });
          } else {
            console.log(' > No apps for this account!');
          }
          process.exit();
        });
      });
    };

    const addToken = () => {
      selectAccount((err, account) => {
        if (err) return error(err);
        selectApplication(account, (err, application, name, appkeyspace) => {
          if (err) return error(err);
          inquirer.prompt([
            {
              type: 'input',
              message: 'Enter a token description:',
              name: 'description',
            },
          ], output => {
            if (!output.description) { return; }
            api.auth.addApplicationToken(application, appkeyspace, output.description, (err, token) => {
              if (err) return error(err);
              if (token) {
                console.log(` Added token: ${output.description}`);
                console.log(` - tokenid: ${token.tokenid} / tokensecret: ${token.tokensecret}`);
              }
              process.exit();
            });
          });
        });
      });
    };

    const listTokens = () => {
      selectAccount((err, account) => {
        if (err) return error(err);
        selectApplication(account, (err, application, name) => {
          if (err) return error(err);
          console.log(`${name} applications:`);
          api.auth.getApplicationTokens(application, (err, tokens) => {
            if (err) return error(err);
            if (tokens) {
              tokens.forEach(token => {
                console.log(` - [${token.description} - (${token.enabled ? 'ENABLED' : 'DISABLED'})] - tokenid: ${token.tokenid} / tokensecret: ${token.tokensecret}`);
              });
            } else {
              console.log(' > No tokens for this account!');
            }
            process.exit();
          });
        });
      });
    };

    const promptToken = (next) => {
      selectAccount((err, account) => {
        if (err) return error(err);
        selectApplication(account, (err, application) => {
          if (err) return error(err);
          selectApplicationToken(application, (err, token) => {
            if (err) return error(err);
            next(null, token);
          });
        });
      });
    };

    const resetApplicationToken = () => {
      promptToken((err, token) => {
        if (err) return error(err);
        confirmResetToken(token);
      });
    };

    const disableApplicationToken = () => {
      promptToken((err, token) => {
        if (err) return error(err);
        confirmDisableToken(token);
      });
    };

    const selectAccount = (next) => {
      api.auth.getAccounts((err, accounts) => {
        if (err) return error(err);
        const accs = _.pluck(accounts, 'name');
        inquirer.prompt([
          {
            type: 'list',
            message: 'Select an account:',
            name: 'name',
            choices: accs,
          },
        ], answer => {
          next(null, _.result(_.find(accounts, { name: answer.name }), 'account'), answer.name);
        });
      });
    };

    const selectApplication = (account, next) => {
      api.auth.getApplications(account, (err, applications) => {
        if (err) return error(err);
        const apps = _.pluck(applications, 'name');
        inquirer.prompt([
          {
            type: 'list',
            message: 'Select an application:',
            name: 'name',
            choices: apps,
          },
        ], answer => {
          const application = _.find(applications, { name: answer.name });
          next(null, _.result(application, 'appid'), answer.name, _.result(application, 'appkeyspace'));
        });
      });
    };

    const selectApplicationToken = (application, next) => {
      api.auth.getApplicationTokens(application, (err, tokens) => {
        if (err) return error(err);
        const tokenDescriptions = _.pluck(tokens, 'description');
        inquirer.prompt([
          {
            type: 'list',
            message: 'Select an application token:',
            name: 'description',
            choices: tokenDescriptions,
          },
        ], answer => {
          const token = _.find(tokens, { description: answer.description });
          next(null, token);
        });
      });
    };

    const confirmResetToken = token => {
      inquirer.prompt([
        {
          type: 'confirm',
          message: 'This will modify the tokensecret so that the consumer using that token can no longer access seguir?',
          name: 'confirm',
        },
      ], confirm => {
        if (confirm.confirm) {
          api.auth.updateApplicationTokenSecret(token.tokenid, (err, token) => {
            if (!err) {
              console.log('Token updated, update the client application if you still want it to have access!');
              console.log(`tokenid:     ${token.tokenid}`);
              console.log(`tokensecret: ${token.tokensecret}`);
            } else {
              console.log(`ERROR: ${err.message}`);
            }
            process.exit();
          });
        } else {
          process.exit();
        }
      });
    };

    const confirmDisableToken = token => {
      const message = token.enabled ? 'This will disable a token so that any applications using it can no longer access seguir - they will immediately stop working - continue?' : 'Re-enable token?';
      inquirer.prompt([
        {
          type: 'confirm',
          message,
          name: 'confirm',
        },
      ], confirm => {
        if (confirm.confirm) {
          api.auth.updateApplicationToken(token.tokenid, !token.enabled, token.description, (err, token) => {
            if (!err) {
              console.log(`Token is now: (${token.enabled ? 'ENABLED' : 'DISABLED'})`);
            } else {
              console.log(`ERROR: ${err.message}`);
            }
            process.exit();
          });
        } else {
          process.exit();
        }
      });
    };

    const coreSetup = () => {
      inquirer.prompt([
        {
          type: 'confirm',
          message: 'This will DROP the existing keyspace if it already exists, are you sure you want to proceed?',
          name: 'confirm',
        },
      ], confirm => {
        if (confirm.confirm) {
          api.client.setup.setupSeguir(api.client, config.keyspace, () => {
            console.log('Completed basic setup, you now need to create your first account and application.');
            promptAccount();
          });
        }
      });
    };

    const addUser = () => {
      selectAccount((err, account, name) => {
        if (err) return error(err);
        promptAccountUser(account, name, err => {
          if (err) return error(err);
          process.exit(0);
        });
      });
    };

    const addApplication = () => {
      selectAccount((err, account, name) => {
        if (err) return error(err);
        promptApplication(account, name, err => {
          if (err) return error(err);
          process.exit(0);
        });
      });
    };

    const promptAccount = () => {
      inquirer.prompt([
        {
          type: 'input',
          message: 'Enter an account name:',
          name: 'name',
        },
      ], acc => {
        setupAccount(acc.name, (err, account) => {
          if (err) return error(err);
          promptAccountUser(account.account, account.name, err => {
            if (err) return error(err);
            promptApplication(account.account, account.name, err => {
              if (err) return error(err);
              process.exit(0);
            });
          });
        });
      });
    };

    const setupAccount = (accName, next) => {
      api.auth.addAccount(accName, true, true, (err, account) => {
        if (err) {
          console.log(err.message);
          process.exit(0);
        }
        next(null, account);
      });
    };

    const promptAccountUser = (account, name, next) => {
      inquirer.prompt([
        {
          type: 'input',
          message: `Enter name of user to add to account ${name}:`,
          name: 'username',
        },
        {
          type: 'input',
          message: 'Enter password for this user:',
          name: 'password',
        },
        {
          type: 'input',
          message: 'Are they an administrator of the account (y/n)?',
          name: 'isadmin',
        },
      ], user => {
        setupAccountUser(account, name, user.username, user.password, user.isadmin === 'y', next);
      });
    };

    const setupAccountUser = (account, name, username, password, isadmin, next) => {
      api.auth.addAccountUser(account, username, password, isadmin, err => {
        if (err) {
          console.log(err.message);
          process.exit(0);
        }
        next();
      });
    };

    const promptApplication = (account, name, next) => {
      inquirer.prompt([
        {
          type: 'input',
          message: `Enter application name (e.g. app-name) to add to account ${name}:`,
          name: 'name',
        },
      ], application => {
        setupApplication(account, application.name, next);
      });
    };

    const promptApplicationToken = (application, next) => {
      inquirer.prompt([
        {
          type: 'input',
          message: `Enter application token description (e.g. first-consumer) to add to application ${application.name}:`,
          name: 'name',
        },
      ], token => {
        setupApplicationToken(application, token.name, next);
      });
    };

    const setupApplication = (account, name, noToken, next) => {
      if (!next) { next = noToken; noToken = false; }
      console.log(' ... creating schema ...');
      api.auth.addApplication(account, name, (err, application) => {
        if (err) {
          console.log(err.message);
          process.exit(0);
        }
        if (noToken) return next(null, application);
        promptApplicationToken(application, next);
      });
    };

    const setupApplicationToken = (application, name, tokenid, tokensecret, next) => {
      if (!next) { next = tokensecret; tokensecret = null; }
      if (!next) { next = tokenid; tokenid = null; }
      api.auth.addApplicationToken(application.appid, application.appkeyspace, name, tokenid, tokensecret, (err, token) => {
        if (err) {
          console.log(err.message);
          process.exit(0);
        }
        console.log('Token details are:');
        console.log(`description: ${token.description}`);
        console.log(`tokenid: ${token.tokenid}`);
        console.log(`tokensecret: ${token.tokensecret}`);
        next();
      });
    };
  });
});
