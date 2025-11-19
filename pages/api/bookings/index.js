const { errorResponse } = require('src/utils/response');
const { authenticate, validateRequest } = require('src/lib/api-helpers');
const logger = require('src/utils/logger');
const bookingService = require('src/services/booking.service');
const { createBookingSchema } = require('src/validators/booking.validator');

async function handler(req, res) {
  try {
    const user = await authenticate(req);

    if (req.method === 'GET') {
      const bookings = await bookingService.listBookings({
        scope: req.query.scope,
        user,
      });
      return res.status(200).json(bookings);
    }

    if (req.method === 'POST') {
      const validatedData = validateRequest(createBookingSchema, 'body')(req);
      const booking = await bookingService.createBooking({
        user,
        eventId: validatedData.event_id,
        numTickets: validatedData.num_tickets,
        lockId: validatedData.lock_id,
      });
      return res.status(201).json(booking);
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}
module.exports = handler;
module.exports.default = handler;
