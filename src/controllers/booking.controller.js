const bookingService = require('../services/booking.service');
const seatLockService = require('../services/seatLock.service');
const { ForbiddenError } = require('../utils/errors');

const listBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.listBookings({
      scope: req.query.scope,
      user: req.user,
    });
    return res.json(bookings);
  } catch (error) {
    return next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking({
      user: req.user,
      eventId: req.body.event_id,
      numTickets: req.body.num_tickets,
      lockId: req.body.lock_id,
    });
    return res.status(201).json(booking);
  } catch (error) {
    return next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    await bookingService.cancelBooking({
      bookingId: req.params.id,
      user: req.user,
    });
    return res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    return next(error);
  }
};

const createSeatLock = async (req, res, next) => {
  try {
    const lock = await seatLockService.createLock({
      userId: req.user.user_id,
      eventId: req.body.event_id,
      numTickets: req.body.num_tickets,
    });
    return res.status(201).json(lock);
  } catch (error) {
    return next(error);
  }
};

const releaseSeatLock = async (req, res, next) => {
  try {
    const lock = await seatLockService.getLock(req.params.lockId);
    if (lock.user_id !== req.user.user_id && req.user.role !== 'admin') {
      throw new ForbiddenError('Unauthorized');
    }
    await seatLockService.releaseLock(req.params.lockId, 'manual');
    return res.json({ message: 'Seat lock released' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listBookings,
  createBooking,
  cancelBooking,
  createSeatLock,
  releaseSeatLock,
};


