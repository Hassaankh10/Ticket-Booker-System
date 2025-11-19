const { errorResponse } = require('src/utils/response');
const { authenticate, validateRequest } = require('src/lib/api-helpers');
const logger = require('src/utils/logger');
const seatLockService = require('src/services/seatLock.service');
const { seatLockSchema } = require('src/validators/booking.validator');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const user = await authenticate(req);
    const validatedData = validateRequest(seatLockSchema, 'body')(req);
    const lock = await seatLockService.createLock({
      userId: user.user_id,
      eventId: validatedData.event_id,
      numTickets: validatedData.num_tickets,
    });
    return res.status(201).json(lock);
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}
module.exports = handler;
module.exports.default = handler;
