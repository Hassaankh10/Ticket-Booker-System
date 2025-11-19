const { all, get, run, withTransaction } = require('../db');
const { AppError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const buildEventSelect = () => `
  SELECT e.*, u.full_name AS created_by_name
  FROM events e
  LEFT JOIN users u ON u.user_id = e.created_by
`;

const listEvents = async ({ includeInactive = false, status = 'active' }) => {
  const where = [];
  const params = [];

  if (status !== 'deleted') {
    where.push('e.status != ?');
    params.push('deleted');
  }

  if (!includeInactive && status && status !== 'all') {
    where.push('e.status = ?');
    params.push(status);
  } else if (!includeInactive && (!status || status === 'all')) {
    where.push('e.status = ?');
    params.push('active');
  } else if (status && status !== 'all') {
    where.push('e.status = ?');
    params.push(status);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `${buildEventSelect()} ${whereClause} ORDER BY e.event_date ASC`;
  return all(sql, params);
};

const getEventById = async (eventId) => {
  const row = get(`${buildEventSelect()} WHERE e.event_id = ?`, [eventId]);
  if (!row) {
    throw new NotFoundError('Event not found');
  }
  return row;
};

const createEvent = async (payload, userId) => {
  const {
    event_name,
    event_type,
    venue,
    event_date,
    event_time,
    total_seats,
    price_per_ticket,
    description,
    status = 'active',
    banner_url,
  } = payload;

  const result = run(
    `INSERT INTO events (
      event_name, event_type, venue, event_date, event_time,
      total_seats, available_seats, price_per_ticket,
      description, created_by, status, banner_url
    ) VALUES (
      ?,?,?,?,?,?,?,?,?,?,?,?
    )`,
    [
      event_name,
      event_type,
      venue,
      event_date,
      event_time,
      total_seats,
      total_seats,
      price_per_ticket,
      description || null,
      userId,
      status,
      banner_url || null,
    ]
  );

  return getEventById(result.lastInsertRowid);
};

const updateEvent = async (eventId, payload) => {
  const current = get('SELECT * FROM events WHERE event_id = ?', [eventId]);
  if (!current) {
    throw new NotFoundError('Event not found');
  }
  const totalSeats = payload.total_seats ?? current.total_seats;
  let availableSeats = payload.available_seats ?? current.available_seats;
  if (payload.total_seats) {
    const seatsSold = current.total_seats - current.available_seats;
    availableSeats = Math.max(totalSeats - seatsSold, 0);
  }

  run(
    `UPDATE events SET
      event_name = ?,
      event_type = ?,
      venue = ?,
      event_date = ?,
      event_time = ?,
      total_seats = ?,
      available_seats = ?,
      price_per_ticket = ?,
      description = ?,
      status = ?,
      banner_url = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE event_id = ?`,
    [
      payload.event_name ?? current.event_name,
      payload.event_type ?? current.event_type,
      payload.venue ?? current.venue,
      payload.event_date ?? current.event_date,
      payload.event_time ?? current.event_time,
      totalSeats,
      availableSeats,
      payload.price_per_ticket ?? current.price_per_ticket,
      payload.description ?? current.description,
      payload.status ?? current.status,
      payload.banner_url ?? current.banner_url,
      eventId,
    ]
  );

  return getEventById(eventId);
};

const softDeleteEvent = async (eventId) => {
  // Get all confirmed bookings for this event
  const bookings = all(
    `SELECT booking_id, num_tickets, total_amount, user_id
     FROM bookings
     WHERE event_id = ? AND booking_status = 'confirmed'`,
    [eventId]
  );

  // Refund all confirmed bookings
  if (bookings.length > 0) {
    const totalRefund = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
    await withTransaction(async (client) => {
      // Mark all bookings as cancelled and refunded
      client.run(
        `UPDATE bookings
         SET booking_status = 'cancelled',
             payment_status = 'refunded'
         WHERE event_id = ? AND booking_status = 'confirmed'`,
        [eventId]
      );

      // Calculate total seats to release
      const totalSeats = bookings.reduce((sum, b) => sum + Number(b.num_tickets), 0);

      // Release seats back to the event
      client.run(
        `UPDATE events
         SET available_seats = available_seats + ?,
             status = CASE
               WHEN available_seats + ? > 0 AND status = 'sold_out' THEN 'active'
               ELSE status
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE event_id = ?`,
        [totalSeats, totalSeats, eventId]
      );
    });
    logger.info(`Event ${eventId} deleted: Refunded ${bookings.length} bookings totaling PKR ${totalRefund.toLocaleString()}`);
  }

  const result = run(
    `UPDATE events
     SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE event_id = ? AND status != 'deleted'`,
    [eventId]
  );

  if (result.changes === 0) {
    throw new NotFoundError('Event not found or already deleted');
  }
};

const updateEventStatus = async (eventId, status) => {
  const allowed = ['active', 'inactive', 'sold_out', 'deleted'];
  if (!allowed.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  // If event is being inactivated or deleted, refund all confirmed bookings
  if (status === 'inactive' || status === 'deleted') {
    const bookings = all(
      `SELECT booking_id, num_tickets, total_amount, user_id
       FROM bookings
       WHERE event_id = ? AND booking_status = 'confirmed'`,
      [eventId]
    );

    if (bookings.length > 0) {
      const totalRefund = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
      await withTransaction(async (client) => {
        // Mark all bookings as cancelled and refunded
        client.run(
          `UPDATE bookings
           SET booking_status = 'cancelled',
               payment_status = 'refunded'
           WHERE event_id = ? AND booking_status = 'confirmed'`,
          [eventId]
        );

        // Calculate total seats to release
        const totalSeats = bookings.reduce((sum, b) => sum + Number(b.num_tickets), 0);

        // Release seats back to the event (only if not deleting)
        if (status !== 'deleted') {
          client.run(
            `UPDATE events
             SET available_seats = available_seats + ?,
                 status = CASE
                   WHEN available_seats + ? > 0 AND status = 'sold_out' THEN 'active'
                   ELSE status
                 END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE event_id = ?`,
            [totalSeats, totalSeats, eventId]
          );
        }
      });
      logger.info(`Event ${eventId} status changed to ${status}: Refunded ${bookings.length} bookings totaling PKR ${totalRefund.toLocaleString()}`);
    }
  }

  const result = run(
    `UPDATE events
     SET status = ?, updated_at = CURRENT_TIMESTAMP,
         deleted_at = CASE WHEN ? = 'deleted' THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE event_id = ?`,
    [status, status, eventId]
  );

  if (result.changes === 0) {
    throw new NotFoundError('Event not found');
  }

  return getEventById(eventId);
};

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  softDeleteEvent,
  updateEventStatus,
};


