const jwt = require('jsonwebtoken');
const config = require('./config');
const { UnauthorizedError } = require('./errors');

const signToken = (payload, options = {}) => {
  const secret = config.jwt.secret;
  if (!secret || secret === 'build-time-placeholder' || secret === 'fallback-secret-please-set-jwt-secret') {
    throw new Error('JWT_SECRET environment variable is required. Please set JWT_SECRET in your Vercel environment variables.');
  }
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.expiresIn,
    ...options,
  });
};

const verifyToken = (token) => {
  const secret = config.jwt.secret;
  if (!secret || secret === 'build-time-placeholder' || secret === 'fallback-secret-please-set-jwt-secret') {
    throw new UnauthorizedError('JWT_SECRET environment variable is required. Please set JWT_SECRET in your Vercel environment variables.');
  }
  return jwt.verify(token, secret);
};

module.exports = {
  signToken,
  verifyToken,
};


