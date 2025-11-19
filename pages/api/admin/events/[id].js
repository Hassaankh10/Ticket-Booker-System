const { errorResponse } = require('src/utils/response');
const { authenticate, requireAdmin } = require('src/lib/api-helpers');
const logger = require('src/utils/logger');
const adminService = require('src/services/admin.service');

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const user = await authenticate(req);
    requireAdmin(user);
    const { id } = req.query;
    await adminService.softDeleteEvent(id);
    return res.status(200).json({ message: 'Event soft deleted' });
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}
module.exports = handler;
module.exports.default = handler;
