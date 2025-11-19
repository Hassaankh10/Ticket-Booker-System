const { errorResponse } = require('../../../src/utils/response');
const { authenticate, requireAdmin, validateRequest } = require('../../../src/lib/api-helpers');
const logger = require('../../../src/utils/logger');
const adminService = require('../../../src/services/admin.service');
const { createUserSchema } = require('../../../src/validators/admin.validator');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const user = await authenticate(req);
    requireAdmin(user);
    const validatedData = validateRequest(createUserSchema, 'body')(req);
    const newUser = await adminService.createUser(validatedData);
    return res.status(201).json(newUser);
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}
module.exports = handler;
module.exports.default = handler;
