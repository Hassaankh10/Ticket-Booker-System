const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

const notFoundHandler = (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return errorResponse(res, { message: 'Route not found' }, 404);
  }
  return next();
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err);
  const statusCode = err.statusCode || 500;
  return errorResponse(res, err, statusCode);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};


