const morgan = require('morgan');
const logger = require('../utils/logger');

const requestLogger = morgan('combined', {
  stream: logger.stream,
});

module.exports = requestLogger;


