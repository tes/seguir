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
var client = require('../api/db/client')(config);
var api = require('../index')(client, config.keyspace);

var tasks = [
  'Check current setup',
  'Initialise a new cassandra instance',
  'Add a new application',
  'List applications',
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
    promptApplication();
  }
  if(answer.task == tasks[3]) {
    listApplications();
  }
  if(answer.task == tasks[4]) {
    resetApplication();
  }

});

function checkSetup() {
  // Check that the DB exists
  console.log('Checking Cassandra: ' + JSON.stringify(config.cassandra));
  api.auth.selectApplications(function(err, applications) {
    if(err) {
      console.log('An error was encountered: ' + err.message);
      if(err.message == 'Keyspace seguir does not exist') {
        console.log('It looks like you need to initialise this cassandra instance, please re-run this command and select that option.');
      }
    } else {
      if(applications.length == 0) {
       console.log('It looks like you need to create your first application, please re-run this command and select that option.');
      } else {
        console.log('Cassandra looks OK, ' + applications.length + ' applications found.');
      }
    }
    process.exit();
  })
}

function listApplications() {
  api.auth.selectApplications(function(err, applications) {
    applications.forEach(function(application) {
      console.log(application.name + ': ' + application.apptoken);
    });
    process.exit();
  });
}

function resetApplication() {
  api.auth.selectApplications(function(err, applications) {
    var apps = _.pluck(applications,'name');
    inquirer.prompt([
      {
        type: 'list',
        message: 'What application would you like to revoke access:',
        name: 'name',
        choices: apps
      }
    ], function( answer ) {
      confirmReset(answer.name);
    });

  });
}

function confirmReset(appName) {
  inquirer.prompt([
    {
      type: 'confirrm',
      message: 'This will modify the appToken so that the application can no longer access seguir?',
      name: 'confirm'
    }
  ], function( confirm ) {
    if(confirm.confirm == 'y' || confirm.confirm == 'Y') {
        var appToken = cassandra.types.uuid();
        api.auth.updateApplicationToken(appName, appToken, function(err, application) {
          if(!err) {
            console.log('Token updated, update the client application if you still want it to have access!');
            console.log(appName + ': ' + appToken);
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
        console.log("Completed basic setup, you now need to create your first application.");
        promptApplication();
      });
    }
  });
}

function promptApplication() {
 inquirer.prompt([
    {
      type: 'input',
      message: 'Enter application name (e.g. app-name):',
      name: 'appName'
    }
  ], function( application ) {
    setupApplication(application.appName)
  });
}

function setupApplication(appName) {
  var appToken = cassandra.types.uuid();
  api.auth.addApplication(appName, appToken, function(err, application) {
    var keyspace = config.keyspace + '_' + appName;
    setupKeyspace(client, keyspace, function() {
       console.log("Application details are:");
       console.log("appName: " + appName);
       console.log("appToken: " + appToken);
       process.exit();
    });
  });
}
