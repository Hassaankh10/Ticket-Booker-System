const { ValidationError } = require('../utils/errors');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Validation helper for Next.js API routes
const validateRequest = (schema, property = 'body') => {
  return (req) => {
    const data = property === 'body' ? req.body : req.query;
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      throw new ValidationError('Validation failed', error.details);
    }
    return value;
  };
};

// Authentication helper for Next.js API routes
const authenticate = async (req) => {
  const { verifyToken } = require('../utils/jwt');
  const { UnauthorizedError } = require('../utils/errors');
  const userService = require('../services/user.service');

  const header = req.headers.authorization;
  if (!header) {
    throw new UnauthorizedError('Authorization header missing');
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError('Invalid authorization header');
  }

  const payload = verifyToken(token);
  const user = await userService.findById(payload.user_id);
  if (!user) {
    throw new UnauthorizedError('Session expired');
  }

  return user;
};

// Admin check helper
const requireAdmin = (user) => {
  const { ForbiddenError } = require('../utils/errors');
  if (!user || user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  return user;
};

// API route handler wrapper for Next.js
const apiHandler = (handler) => {
  return async (req, res) => {
    try {
      const result = await handler(req, res);
      // If handler already sent response, don't send again
      if (!res.headersSent && result !== undefined) {
        return res.status(200).json(result);
      }
    } catch (error) {
      logger.error(error);
      if (!res.headersSent) {
        const statusCode = error.statusCode || 500;
        return errorResponse(res, error, statusCode);
      }
    }
  };
};

module.exports = {
  validateRequest,
  authenticate,
  requireAdmin,
  apiHandler,
};

