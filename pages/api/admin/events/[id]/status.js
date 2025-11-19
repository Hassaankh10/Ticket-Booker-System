const { errorResponse } = require('../../../../src/utils/response');
const { authenticate, requireAdmin, validateRequest } = require('../../../../src/lib/api-helpers');
const logger = require('../../../../src/utils/logger');
const adminService = require('../../../../src/services/admin.service');
const { statusSchema } = require('../../../../src/validators/event.validator');

async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const user = await authenticate(req);
    requireAdmin(user);
    const { id } = req.query;
    const validatedData = validateRequest(statusSchema, 'body')(req);
    const event = await adminService.updateEventStatus(id, validatedData.status);
    return res.status(200).json(event);
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}
module.exports = handler;
module.exports.default = handler;
