const { all, get, run, withTransaction } = require('../db');
const { AppError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { generateSeatNumbers } = require('../utils/seatUtils');
const seatLockService = require('./seatLock.service');
const logger = require('../utils/logger');

const formatBooking = (row) => ({
  ...row,
  seat_numbers:
    typeof row.seat_numbers === 'string'
      ? row.seat_numbers
      : JSON.stringify(row.seat_numbers || []),
});

const listBookings = async ({ scope, user }) => {
  if (scope === 'all' && user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  const isAdminScope = scope === 'all' && user.role === 'admin';
  const params = [];
  let where = '';
  if (!isAdminScope) {
    params.push(user.user_id);
    where = 'WHERE b.user_id = ?';
  }

  const rows = all(
    `
    SELECT b.*, e.event_name, e.event_date, e.banner_url, e.venue,
           u.full_name AS user_name, u.email AS user_email,
           datetime(b.booking_date) AS booking_date
    FROM bookings b
    JOIN events e ON e.event_id = b.event_id
    JOIN users u ON u.user_id = b.user_id
    ${where}
    ORDER BY b.booking_date DESC
    `,
    params
  );
  return rows.map(formatBooking);
};

const fetchLockForBooking = async ({ lockId, eventId, numTickets, userId }) => {
  if (lockId) {
    const lock = get(`SELECT * FROM seat_locks WHERE lock_id = ?`, [lockId]);
    if (!lock) {
      throw new NotFoundError('Seat lock not found');
    }
    if (lock.user_id !== userId) {
      throw new ForbiddenError('Seat lock does not belong to user');
    }
    if (lock.event_id !== eventId) {
      throw new AppError('Seat lock does not match event', 400);
    }
    if (lock.status !== 'locked') {
      throw new AppError('Seat lock already used or released', 400);
    }
    if (new Date(lock.expires_at) <= new Date()) {
      await seatLockService.releaseLock(lockId, 'expired');
      throw new AppError('Seat lock expired', 400);
    }
    if (numTickets && Number(numTickets) !== Number(lock.num_tickets)) {
      throw new AppError('Ticket quantity mismatch with lock', 400);
    }
    return lock;
  }

  const lock = await seatLockService.createLock({ userId, eventId, numTickets });
  return { ...lock, lock_id: lock.lock_id };
};

const createBooking = async ({ user, eventId, numTickets, lockId }) => {
  const lock = await fetchLockForBooking({
    lockId,
    eventId,
    numTickets,
    userId: user.user_id,
  });

  const createdTempLock = !lockId;

  try {
    const bookingId = await withTransaction(async (client) => {
      const event = client.get(
        `SELECT event_id, event_name, status, price_per_ticket
         FROM events
         WHERE event_id = ?`,
        [eventId]
      );
      if (!event || event.status !== 'active') {
        throw new AppError('Event not available', 400);
      }
      const totalAmount = Number(event.price_per_ticket) * lock.num_tickets;
      const seatNumbers = generateSeatNumbers(lock.num_tickets);

      const insertResult = client.run(
        `INSERT INTO bookings (
          user_id, event_id, num_tickets, total_amount, seat_numbers, lock_id
        ) VALUES (?,?,?,?,?,?)`,
        [
          user.user_id,
          eventId,
          lock.num_tickets,
          totalAmount,
          JSON.stringify(seatNumbers),
          lock.lock_id,
        ]
      );

      await seatLockService.markConsumed(lock.lock_id, client);
      logger.info(
        `Booking ${insertResult.lastInsertRowid} confirmed for user ${user.user_id} on event ${event.event_id}`
      );

      return insertResult.lastInsertRowid;
    });

    const booking = get(
      `SELECT b.*, e.event_name, e.banner_url, e.event_date,
              datetime(b.booking_date) AS booking_date
       FROM bookings b
       JOIN events e ON e.event_id = b.event_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    return formatBooking(booking);
  } catch (error) {
    if (createdTempLock) {
      try {
        await seatLockService.releaseLock(lock.lock_id, 'booking_failed');
      } catch (releaseError) {
        logger.error('Failed to release seat lock after booking error', releaseError);
      }
    }
    throw error;
  }
};

const cancelBooking = async ({ bookingId, user }) => {
  const booking = get(`SELECT * FROM bookings WHERE booking_id = ?`, [bookingId]);
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (user.role !== 'admin' && booking.user_id !== user.user_id) {
    throw new ForbiddenError('Unauthorized');
  }

  if (booking.booking_status === 'cancelled') {
    throw new AppError('Booking already cancelled', 400);
  }

  await withTransaction(async (client) => {
    client.run(
      `UPDATE bookings
       SET booking_status = 'cancelled', payment_status = 'refunded'
       WHERE booking_id = ?`,
      [bookingId]
    );

    client.run(
      `UPDATE events
       SET available_seats = available_seats + ?,
           status = CASE
             WHEN available_seats + ? > 0 AND status = 'sold_out' THEN 'active'
             ELSE status
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE event_id = ?`,
      [booking.num_tickets, booking.num_tickets, booking.event_id]
    );
  });

  logger.warn(`Booking ${bookingId} cancelled by user ${user.user_id}`);
};

module.exports = {
  listBookings,
  createBooking,
  cancelBooking,
};


