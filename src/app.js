const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const routes = require('./routes');
const config = require('./utils/config');
const requestLogger = require('./middleware/logger.middleware');
const rateLimiter = require('./middleware/rateLimit.middleware');
const sanitizeRequest = require('./middleware/sanitize.middleware');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (config.cors.origins.includes('*') || config.cors.origins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https://images.unsplash.com", "https://unsplash.com", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
// hpp() may have compatibility issues with Express 5's read-only req.query
// app.use(hpp());
// xss-clean may also have compatibility issues with Express 5
// app.use(xssClean());
app.use(sanitizeRequest);
app.use(requestLogger);

app.use('/api', rateLimiter);
app.use('/api', routes);

const publicDir = config.paths.public;
app.use(express.static(publicDir));

app.get(/.*/, (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Route not found' });
  }
  return res.sendFile(path.join(publicDir, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;


