#!/usr/bin/env node

/**
 * Command line client for seguir - used to setup a server.
 */
var inquirer = require('inquirer');
var setupSeguir = require('../setup/setupSeguir');
var setupKeyspace = require('../setup/setupKeyspace');
var config = require('../server/config');
var cassandra = require('cassandra-driver');
var client = require('../api/db/client')(config);
var api = require('../index')(client, config.keyspace);

var tasks = [
  'Check current setup',
  'Initialise a new cassandra instance',
  'Add a new application',
  'Reset token for existing application'
];

inquirer.prompt([
  {
    type: 'list',
    message: 'What would you like to do:',
    name: 'task',
    choices: [
      'Check current setup',
      'Initialise a new cassandra instance',
      'Add a new application',
      'Reset token for existing application'
    ]
  }
], function( answer ) {
  if(answer.task == tasks[0]) {
    console.dir('Check')
  }
  if(answer.task == tasks[1]) {
    inquirer.prompt([
      {
        type: 'confirrm',
        message: 'This will DROP the existing keyspace if it already exists, are you sure you want to proceed?',
        name: 'confirm'
      }
    ], function( confirm ) {
      if(confirm.confirm == 'y' || confirm.confirm == 'Y') {
        setupSeguir(client, config.keyspace, function() {
          console.log("Completed basic setup, you now need to create an application.");
          process.exit();
        });
      }
    });
  }
  if(answer.task == tasks[2]) {
    inquirer.prompt([
      {
        type: 'input',
        message: 'Enter application name (e.g. app-name):',
        name: 'appName'
      }
    ], function( application ) {
      var appName = application.appName;
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
    });
  }

});

function checkSetup() {

  // Check that the DB exists
  var api = require('../index')({}, 'seguir');

}
