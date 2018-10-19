const fs = require('fs');
const path = require('path');

module.exports = (next) => {
  let config;
  if (process.env.SEGUIR_CONFIG) {
    const configPath = path.resolve(process.env.SEGUIR_CONFIG);
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
  next(null, config);
};
