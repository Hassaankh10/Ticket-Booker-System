const jwt = require('jsonwebtoken');
const config = require('./config');

const signToken = (payload, options = {}) =>
  jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    ...options,
  });

const verifyToken = (token) => jwt.verify(token, config.jwt.secret);

module.exports = {
  signToken,
  verifyToken,
};


