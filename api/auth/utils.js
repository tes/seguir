/**
 * Auth utils
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const generateAuthorization = (appid, appsecret, type) => {
  const d = new Date().toUTCString();
  type = type || 'SeguirApp';
  return {
    'date': d,
    'authorization': type + ' ' + appid + ':' + generateHmac(d, appsecret)
  };
};

const validateAuthorization = (headers, appid, appsecret) => {
  const d = headers.date;
  const hmac = headers.authorization.split(':')[1];
  return hmac === generateHmac(d, appsecret);
};

const generateSecret = (appid, next) => {
  return crypto.createHash('sha256').update(appid.toString()).update('salt').digest('hex');
};

const hashPassword = (password, next) => {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(password, salt, next);
  });
};

const checkPassword = (password, hash, next) => {
  bcrypt.compare(password, hash, next);
};

module.exports = {
  generateSecret,
  hashPassword,
  checkPassword,
  generateAuthorization,
  validateAuthorization
};

const generateHmac = (data, secret, algorithm, encoding) => {
  encoding = encoding || 'base64';
  algorithm = algorithm || 'sha256';
  return crypto.createHmac(algorithm, secret).update(data).digest(encoding);
};

