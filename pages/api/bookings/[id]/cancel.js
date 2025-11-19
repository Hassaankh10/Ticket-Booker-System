const { errorResponse } = require('../../../src/utils/response');
const { authenticate } = require('../../../src/lib/api-helpers');
const logger = require('../../../src/utils/logger');
const bookingService = require('../../../src/services/booking.service');

async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const user = await authenticate(req);
    const { id } = req.query;
    await bookingService.cancelBooking({
      bookingId: id,
      user,
    });
    return res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}
module.exports = handler;
module.exports.default = handler;
