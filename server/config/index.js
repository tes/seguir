var fs = require('fs');
var path = require('path');

module.exports = function () {
  var config;
  if (process.env.SEGUIR_CONFIG) {
    var configPath = path.resolve(process.env.SEGUIR_CONFIG);
    console.log('Using config in: ' + configPath);
    if (fs.existsSync(configPath)) {
      config = require(configPath);
    } else {
      console.log('You have specified a config file that doesnt exist! Using default cassandra configuration.');
      config = require(__dirname + '/cassandra.json');
    }
  } else {
    config = require(__dirname + '/cassandra.json');
  }
  return config;
};
