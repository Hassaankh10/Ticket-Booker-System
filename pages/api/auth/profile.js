const { errorResponse } = require('src/utils/response');
const { authenticate } = require('src/lib/api-helpers');
const logger = require('src/utils/logger');
const authService = require('src/services/auth.service');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const user = await authenticate(req);
    const profile = await authService.getProfile(user.user_id);
    return res.status(200).json({ user: profile });
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}

module.exports = handler;
module.exports.default = handler;
