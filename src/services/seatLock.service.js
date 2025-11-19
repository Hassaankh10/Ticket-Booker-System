const crypto = require('crypto');
const { get, all, withTransaction } = require('../db');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { AppError, NotFoundError } = require('../utils/errors');

const createLock = async ({ userId, eventId, numTickets }) => {
  const expiresAt = new Date(Date.now() + config.seatLock.ttlMs);

  return withTransaction(async (client) => {
    const event = client.get(
      `SELECT event_id, available_seats, status
       FROM events
       WHERE event_id = ?`,
      [eventId]
    );

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.status !== 'active') {
      throw new AppError('Event not available for booking', 400);
    }

    if (event.available_seats < numTickets) {
      throw new AppError('Not enough seats available', 400);
    }

    client.run(
      `UPDATE events
       SET available_seats = available_seats - ?,
           status = CASE
             WHEN available_seats - ? <= 0 THEN 'sold_out'
             ELSE status
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE event_id = ?`,
      [numTickets, numTickets, eventId]
    );

    const lockId = crypto.randomUUID();

    client.run(
      `INSERT INTO seat_locks (
        lock_id, user_id, event_id, num_tickets, status, expires_at
      ) VALUES (?,?,?,?, 'locked', ?)`,
      [lockId, userId, eventId, numTickets, expiresAt.toISOString()]
    );

    return {
      lock_id: lockId,
      event_id: eventId,
      num_tickets: numTickets,
      expires_at: expiresAt.toISOString(),
    };
  });
};

const getLock = async (lockId) => {
  const lock = get('SELECT * FROM seat_locks WHERE lock_id = ?', [lockId]);
  if (!lock) {
    throw new NotFoundError('Seat lock not found');
  }
  return lock;
};

const releaseLock = async (lockId, reason = 'released') => {
  await withTransaction(async (client) => {
    const lock = client.get(
      `SELECT lock_id, event_id, num_tickets, status
       FROM seat_locks
       WHERE lock_id = ?`,
      [lockId]
    );

    if (!lock) {
      throw new NotFoundError('Seat lock not found');
    }

    if (lock.status !== 'locked') {
      return;
    }

    client.run(
      `UPDATE seat_locks
       SET status = 'released', released_reason = ?, updated_at = CURRENT_TIMESTAMP
       WHERE lock_id = ?`,
      [reason, lockId]
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
      [lock.num_tickets, lock.num_tickets, lock.event_id]
    );
  });
};

const markConsumed = async (lockId, client) => {
  if (!client) {
    throw new AppError('Database client required to consume lock', 500);
  }

  const lock = client.get(
    `SELECT status FROM seat_locks
     WHERE lock_id = ?`,
    [lockId]
  );

  if (!lock) {
    throw new NotFoundError('Seat lock not found');
  }

  if (lock.status !== 'locked') {
    throw new AppError('Seat lock already used or released', 400);
  }

  client.run(
    `UPDATE seat_locks
     SET status = 'consumed', updated_at = CURRENT_TIMESTAMP
     WHERE lock_id = ?`,
    [lockId]
  );
};

const releaseExpiredLocks = async () => {
  const locks = all(
    `SELECT lock_id
     FROM seat_locks
     WHERE status = 'locked' AND expires_at <= CURRENT_TIMESTAMP`
  );

  if (!locks.length) {
    return;
  }

  await Promise.all(locks.map((row) => releaseLock(row.lock_id, 'expired')));
};

let sweepInterval;
const startExpirationWorker = () => {
  if (sweepInterval) {
    return;
  }
  sweepInterval = setInterval(async () => {
    try {
      await releaseExpiredLocks();
    } catch (error) {
      logger.error('Failed to release expired seat locks', error);
    }
  }, config.seatLock.sweepIntervalMs);
};

module.exports = {
  createLock,
  getLock,
  releaseLock,
  markConsumed,
  releaseExpiredLocks,
  startExpirationWorker,
};


