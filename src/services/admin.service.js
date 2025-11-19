const bcrypt = require('bcryptjs');
const { get, all, run } = require('../db');
const eventService = require('./event.service');
const userService = require('./user.service');
const { AppError } = require('../utils/errors');

const createUser = async ({ full_name, email, phone, username, password, role }) => {
  const existing = get(
    `SELECT 1 FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)`,
    [email, username]
  );

  if (existing) {
    throw new AppError('Email or username already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const targetRole = role === 'admin' ? 1 : 2;

  const result = run(
    `INSERT INTO users (username, email, password_hash, full_name, phone, role_id, status)
     VALUES (?,?,?,?,?,?,'active')`,
    [username, email.toLowerCase(), passwordHash, full_name, phone || null, targetRole]
  );

  return userService.findById(result.lastInsertRowid);
};

const getOverview = async () => {
  const totalsQuery = get(
    `SELECT
       (SELECT COUNT(1) FROM events WHERE status != 'deleted') AS events,
       (SELECT COUNT(1) FROM events WHERE status = 'active') AS active_events,
       (SELECT COUNT(1) FROM bookings) AS bookings,
       (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE booking_status = 'confirmed') AS revenue,
       (SELECT COUNT(1) FROM feedback WHERE status != 'resolved') AS feedback_open
     `
  );

  const topEvents = all(
    `SELECT e.event_id, e.event_name, e.event_date,
            COALESCE(SUM(b.num_tickets),0) AS tickets_sold,
            COALESCE(SUM(b.total_amount),0) AS revenue
     FROM events e
     LEFT JOIN bookings b ON b.event_id = e.event_id AND b.booking_status = 'confirmed'
     GROUP BY e.event_id
     ORDER BY tickets_sold DESC
     LIMIT 5`
  );

  return {
    totals: {
      events: Number(totalsQuery.events),
      activeEvents: Number(totalsQuery.active_events),
      bookings: Number(totalsQuery.bookings),
      revenue: Number(totalsQuery.revenue),
      feedbackOpen: Number(totalsQuery.feedback_open),
    },
    topEvents: topEvents.map((event) => ({
      ...event,
      tickets_sold: Number(event.tickets_sold),
      revenue: Number(event.revenue),
    })),
  };
};

const getRevenueReport = async () => {
  const total = get(
    `SELECT COALESCE(SUM(total_amount),0) AS total_revenue
     FROM bookings
     WHERE booking_status = 'confirmed'`
  );

  const perEvent = all(
    `SELECT e.event_id, e.event_name,
            COALESCE(SUM(b.total_amount),0) AS revenue,
            COALESCE(SUM(b.num_tickets),0) AS tickets_sold
     FROM events e
     LEFT JOIN bookings b ON b.event_id = e.event_id AND b.booking_status = 'confirmed'
     WHERE e.status != 'deleted'
     GROUP BY e.event_id
     ORDER BY revenue DESC`
  );

  return {
    totalRevenue: Number(total.total_revenue),
    revenuePerEvent: perEvent.map((row) => ({
      event_id: row.event_id,
      event_name: row.event_name,
      revenue: Number(row.revenue),
      ticketCount: Number(row.tickets_sold),
    })),
  };
};

const getPopularEvents = async () => {
  const result = all(
    `SELECT e.event_id, e.event_name, e.event_date,
            COUNT(b.booking_id) AS booking_count,
            COALESCE(SUM(b.num_tickets),0) AS tickets_sold
     FROM events e
     LEFT JOIN bookings b ON b.event_id = e.event_id AND b.booking_status = 'confirmed'
     WHERE e.status != 'deleted'
     GROUP BY e.event_id
     ORDER BY tickets_sold DESC
     LIMIT 5`
  );
  return result.map((row) => ({
    ...row,
    booking_count: Number(row.booking_count),
    tickets_sold: Number(row.tickets_sold),
  }));
};

const getUserStats = async () => {
  const mostActiveUsers = all(
    `SELECT u.user_id, u.full_name, u.email,
            COUNT(b.booking_id) AS bookings,
            COALESCE(SUM(b.total_amount),0) AS spend
     FROM users u
     LEFT JOIN bookings b ON b.user_id = u.user_id
     GROUP BY u.user_id
     ORDER BY bookings DESC
     LIMIT 5`
  );

  const totalBookingsPerUser = all(
    `SELECT u.user_id, u.full_name,
            COUNT(b.booking_id) AS bookings
     FROM users u
     LEFT JOIN bookings b ON b.user_id = u.user_id
     GROUP BY u.user_id
     ORDER BY bookings DESC`
  );

  return {
    mostActiveUsers: mostActiveUsers.map((row) => ({
      ...row,
      bookings: Number(row.bookings),
      spend: Number(row.spend),
    })),
    totalBookingsPerUser: totalBookingsPerUser.map((row) => ({
      ...row,
      bookings: Number(row.bookings),
    })),
  };
};

const getEventsStatus = async () => {
  const result = all(
    `SELECT 
      status,
      COUNT(*) AS count
     FROM events
     WHERE status != 'deleted'
     GROUP BY status
     ORDER BY status`
  );

  const total = get(
    `SELECT COUNT(*) AS total FROM events WHERE status != 'deleted'`
  );

  return {
    total: Number(total.total),
    byStatus: result.map((row) => ({
      status: row.status,
      count: Number(row.count),
    })),
  };
};

const softDeleteEvent = (eventId) => eventService.softDeleteEvent(eventId);
const updateEventStatus = (eventId, status) => eventService.updateEventStatus(eventId, status);

module.exports = {
  createUser,
  getOverview,
  getRevenueReport,
  getPopularEvents,
  getUserStats,
  getEventsStatus,
  softDeleteEvent,
  updateEventStatus,
};


