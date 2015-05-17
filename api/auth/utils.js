/**
 * Auth utils
 */
var bcrypt = require('bcrypt');
var crypto = require("crypto");

function generateAuthorization(appid, appsecret) {
  var d = new Date().toUTCString();
  var signature = generateHmac(d, appsecret);
  return {
    'date':d,
    'authorization': 'Seguir ' + appid + ':' + generateHmac(d, appsecret)
  }
}

function validateAuthorization(headers, appid, appsecret) {
  var d = headers.date;
  var hmac = headers.authorization.split(":")[1];
  return hmac === generateHmac(d, appsecret);
}

function generateSecret(appid, next) {
  return crypto.createHash('sha256').update(appid).update('salt').digest('hex');
}

function hashPassword(password, next) {
  bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, next);
  });
}

function checkPassword(password, hash, next) {
  bcrypt.compare(password, hash, next);
}

module.exports = {
  generateSecret: generateSecret,
  hashPassword: hashPassword,
  checkPassword: checkPassword,
  generateAuthorization: generateAuthorization,
  validateAuthorization: validateAuthorization
}

function generateHmac (data, secret, algorithm, encoding) {
  encoding = encoding || "base64";
  algorithm = algorithm || "sha256";
  return crypto.createHmac(algorithm, secret).update(data).digest(encoding);
}

