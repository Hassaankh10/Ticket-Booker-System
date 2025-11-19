const { errorResponse } = require('src/utils/response');
const { authenticate } = require('src/lib/api-helpers');
const logger = require('src/utils/logger');
const seatLockService = require('src/services/seatLock.service');
const { ForbiddenError } = require('src/utils/errors');

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const user = await authenticate(req);
    const { lockId } = req.query;
    const lock = await seatLockService.getLock(lockId);
    
    if (lock.user_id !== user.user_id && user.role !== 'admin') {
      throw new ForbiddenError('Unauthorized');
    }
    
    await seatLockService.releaseLock(lockId, 'manual');
    return res.status(200).json({ message: 'Seat lock released' });
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}
module.exports = handler;
module.exports.default = handler;
