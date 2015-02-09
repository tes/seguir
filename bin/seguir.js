#!/usr/bin/env node

/**
 * Command line client for seguir - used to setup a server.
 */
var inquirer = require('inquirer');
var setupSeguir = require('../setup/setupSeguir');
var setupKeyspace = require('../setup/setupKeyspace');
var config = require('../server/config');
var cassandra = require('cassandra-driver');
var _ = require('lodash');
var async = require('async');
var client = require('../api/db/client')(config);
var api = require('../index')(client, config.keyspace);

var tasks = [
  'Check current setup',
  'Initialise a new cassandra instance',
  'Add a new account, user and application',
  'List users for account',
  'Add a new user to an account',
  'List applications for account',
  'Add a new application to an account',
  'Reset application token'
];

inquirer.prompt([
  {
    type: 'list',
    message: 'What would you like to do:',
    name: 'task',
    choices: tasks
  }
], function( answer ) {
  if(answer.task == tasks[0]) {
    checkSetup();
  }
  if(answer.task == tasks[1]) {
    coreSetup();
  }
  if(answer.task == tasks[2]) {
    promptAccount();
  }
  if(answer.task == tasks[3]) {
    listUsers();
  }
  if(answer.task == tasks[4]) {
    addUser();
  }
  if(answer.task == tasks[5]) {
    listApplications();
  }
  if(answer.task == tasks[6]) {
    addApplication();
  }
  if(answer.task == tasks[7]) {
    resetApplication();
  }

});

function checkSetup() {
  // Check that the DB exists
  console.log('Checking Cassandra: ' + JSON.stringify(config.cassandra));
  api.auth.getAccounts(function(err, accounts) {
    if(err) {
      console.log('An error was encountered: ' + err.message);
      if(err.message == 'Keyspace seguir does not exist') {
        console.log('It looks like you need to initialise this cassandra instance, please re-run this command and select that option.');
      }
    } else {
      if(accounts.length == 0) {
       console.log('It looks like you need to create your first account, please re-run this command and select that option.');
      } else {
        console.log('Configuration looks OK on the surface, ' + accounts.length + ' accounts were found.');
      }
    }
    process.exit();
  })
}

function listUsers() {
  selectAccount(function(err, account, name) {
    console.log(name + ' users:');
    api.auth.getAccountUsers(account, function(err, users) {
      if(users) {
        users.forEach(function(user) {
          console.log(' - ' + user.username);
        });
      } else {
        console.log(' > No users for this account!');
      }
      process.exit();
    });
  });
}

function listApplications() {
  selectAccount(function(err, account, name) {
    console.log(name + ' applications:');
    api.auth.getApplications(account, function(err, apps) {
      if(apps) {
        apps.forEach(function(app) {
          console.log(' - [' + app.name + '] appid: ' + app.appid + ' / appsecret: ' + app.appsecret);
        });
      } else {
        console.log(' > No apps for this account!');
      }
      process.exit();
    });
  });
}

function resetApplication() {
  selectAccount(function(err, account) {
    selectApplication(account, function(err, application) {
        confirmReset(application);
    });
  });
}

function selectAccount(next) {
   api.auth.getAccounts(function(err, accounts) {
    var accs = _.pluck(accounts,'name');
    inquirer.prompt([
      {
        type: 'list',
        message: 'Select an account:',
        name: 'name',
        choices: accs
      }
    ], function( answer ) {
      next(null, _.result(_.find(accounts, { 'name': answer.name }), 'account'), answer.name);
    });
  });
}

function selectApplication(account, next) {
   api.auth.getApplications(account, function(err, applications) {
    var apps = _.pluck(applications,'name');
    inquirer.prompt([
      {
        type: 'list',
        message: 'Select an application:',
        name: 'name',
        choices: apps
      }
    ], function( answer ) {
      next(null, _.result(_.find(applications, { 'name': answer.name }), 'appid'), answer.name);
    });
  });
}

function selectAccountUser(account, next) {
   api.auth.getAccountUsers(account, function(err, users) {
    var usrs = _.pluck(applications,'username');
    inquirer.prompt([
      {
        type: 'list',
        message: 'Select a user:',
        name: 'name',
        choices: usrs
      }
    ], function( answer ) {
      next(null, answer.name);
    });
  });
}

function confirmReset(appid) {
  inquirer.prompt([
    {
      type: 'confirrm',
      message: 'This will modify the appsecret so that the application can no longer access seguir?',
      name: 'confirm'
    }
  ], function( confirm ) {
    if(confirm.confirm == 'y' || confirm.confirm == 'Y') {
        var appToken = cassandra.types.uuid();
        api.auth.updateApplicationSecret(appid, function(err, application) {
          if(!err) {
            console.log('Token updated, update the client application if you still want it to have access!');
            console.log('appid:     ' + application.appid);
            console.log('appsecret: ' + application.appsecret);
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

function coreSetup() {
  inquirer.prompt([
    {
      type: 'confirrm',
      message: 'This will DROP the existing keyspace if it already exists, are you sure you want to proceed?',
      name: 'confirm'
    }
  ], function( confirm ) {
    if(confirm.confirm == 'y' || confirm.confirm == 'Y') {
      setupSeguir(client, config.keyspace, function() {
        console.log("Completed basic setup, you now need to create your first account and application.");
        promptAccount();
      });
    }
  });
}

function addUser() {
  selectAccount(function(err, account, name) {
    promptAccountUser(account, name, function(err) {
      process.exit(0);
    })
  });
}

function addApplication() {
  selectAccount(function(err, account, name) {
    promptApplication(account, name, function(err) {
      process.exit(0);
    })
  });
}

function promptAccount() {
 inquirer.prompt([
    {
      type: 'input',
      message: 'Enter an account name:',
      name: 'name'
    }
  ], function( account ) {
    setupAccount(account.name)
  });
}

function setupAccount(accName) {
  api.auth.addAccount(accName, true, true, function(err, account) {
    if(err) {
      console.log(err.message);
      process.exit(0);
    }
    promptAccountUser(account.account, accName, function(err) {
        promptApplication(account.account, accName, function(err) {
          process.exit(0);
        });
    });
  });
}

function promptAccountUser(account, name, next) {
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
  ], function( user ) {
    setupApplicationUser(account, name, user.username, user.password, user.isadmin === 'y' ? true : false, next);
  });
}

function setupApplicationUser(account, name, username, password, isadmin, next) {
  api.auth.addAccountUser(account, username, password, isadmin, function(err, user) {
    if(err) {
        console.log(err.message);
        process.exit(0);
    }
    next();
  });
}

function promptApplication(account, name, next) {
 inquirer.prompt([
    {
      type: 'input',
      message: 'Enter application name (e.g. app-name) to add to account ' + name + ':',
      name: 'name'
    }
  ], function( application ) {
    setupApplication(account, application.name, next)
  });
}

function setupApplication(account, name, next) {
  api.auth.addApplication(account, name, function(err, application) {
      if(err) {
        console.log(err.message);
        process.exit(0);
      }
     console.log("Application details are:");
     console.log("appid: " + application.appid);
     console.log("appsecret: " + application.appsecret);
     next();
  });
}
