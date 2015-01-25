var config;
var fs = require('fs');
var path = require('path');
if(process.env.SEGUIR_CONFIG) {
  var configPath = path.resolve(process.env.SEGUIR_CONFIG);
  console.log('Using config in: ' + configPath);
  if(fs.existsSync(configPath)) {
    config = require(configPath);
  } else {
    console.log('You have specified a config file that doesnt exist! Exiting.');
    process.exit();
  }
} else {
  config = require('./seguir.json');
}
module.exports = config;
