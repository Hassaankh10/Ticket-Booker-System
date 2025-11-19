const { errorResponse } = require('src/utils/response');
const { validateRequest } = require('src/lib/api-helpers');
const logger = require('src/utils/logger');
const authService = require('src/services/auth.service');
const { registerSchema } = require('src/validators/auth.validator');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const validatedData = validateRequest(registerSchema, 'body')(req);
    const result = await authService.register(validatedData);
    return res.status(201).json(result);
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}

module.exports = handler;
module.exports.default = handler;
