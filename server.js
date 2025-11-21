const path = require('path');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { db, runMigrations } = require('./src/db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
const TOKEN_EXPIRY = '12h';

runMigrations();

app.use(cors());
app.use(express.json());

const formatUser = (row) => ({
  user_id: row.user_id,
  username: row.username,
  email: row.email,
  full_name: row.full_name,
  phone: row.phone,
  role: row.role_name || (row.role_id === 1 ? 'admin' : 'customer'),
  created_at: row.created_at,
});

const generateToken = (user) =>
  jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const [, token] = header.split(' ');
  if (!token) {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db
      .prepare(
        `SELECT u.*, r.role_name
         FROM users u
         JOIN roles r ON r.role_id = u.role_id
         WHERE u.user_id = ?`
      )
      .get(payload.user_id);

    if (!user) {
      return res.status(401).json({ message: 'Session expired' });
    }

    req.user = formatUser(user);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ---------- Auth Routes ----------
app.post('/api/auth/register', (req, res) => {
  const { full_name, email, phone, username, password } = req.body;

  if (!full_name || !email || !username || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const insert = db.prepare(
      `INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
       VALUES (@username, @email, @password_hash, @full_name, @phone, @role_id)`
    );

    const result = insert.run({
      username,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      full_name,
      phone: phone || null,
      role_id: 2, // customer
    });

    const createdUser = db
      .prepare(
        `SELECT u.*, r.role_name
         FROM users u
         JOIN roles r ON r.role_id = u.role_id
         WHERE u.user_id = ?`
      )
      .get(result.lastInsertRowid);

    const token = generateToken(formatUser(createdUser));
    return res.status(201).json({ token, user: formatUser(createdUser) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'Email or username already exists' });
    }
    return res.status(500).json({ message: 'Unable to register user' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = db
    .prepare(
      `SELECT u.*, r.role_name
       FROM users u
       JOIN roles r ON r.role_id = u.role_id
       WHERE u.email = ? OR u.username = ?`
    )
    .get(email.toLowerCase(), email);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const formatted = formatUser(user);
  const token = generateToken(formatted);
  return res.json({ token, user: formatted });
});

app.get('/api/auth/profile', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

// ---------- Event Routes ----------
app.get('/api/events', (req, res) => {
  const statusFilter = req.query.status || 'active';
  const includeAll = req.query.includeInactive === 'true';

  const events = db
    .prepare(
      `SELECT e.*, u.full_name AS created_by_name
       FROM events e
       LEFT JOIN users u ON u.user_id = e.created_by
       WHERE (? = 1) OR e.status = ?
       ORDER BY e.event_date ASC`
    )
    .all(includeAll ? 1 : 0, statusFilter);

  return res.json(events);
});

app.get('/api/events/:id', (req, res) => {
  const event = db
    .prepare(
      `SELECT e.*, u.full_name AS created_by_name
       FROM events e
       LEFT JOIN users u ON u.user_id = e.created_by
       WHERE e.event_id = ?`
    )
    .get(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  return res.json(event);
});

app.post('/api/events', authenticate, requireAdmin, (req, res) => {
  const {
    event_name,
    event_type,
    venue,
    event_date,
    event_time,
    total_seats,
    price_per_ticket,
    description,
    status,
    banner_url,
  } = req.body;

  if (
    !event_name ||
    !event_type ||
    !venue ||
    !event_date ||
    !event_time ||
    !total_seats ||
    !price_per_ticket
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const insert = db.prepare(
    `INSERT INTO events (
      event_name, event_type, venue, event_date, event_time,
      total_seats, available_seats, price_per_ticket,
      description, created_by, status, banner_url
    ) VALUES (
      @event_name, @event_type, @venue, @event_date, @event_time,
      @total_seats, @available_seats, @price_per_ticket,
      @description, @created_by, @status, @banner_url
    )`
  );

  const result = insert.run({
    event_name,
    event_type,
    venue,
    event_date,
    event_time,
    total_seats,
    available_seats: total_seats,
    price_per_ticket,
    description: description || null,
    created_by: req.user.user_id,
    status: status || 'active',
    banner_url: banner_url || null,
  });

  const createdEvent = db
    .prepare('SELECT * FROM events WHERE event_id = ?')
    .get(result.lastInsertRowid);

  return res.status(201).json(createdEvent);
});

app.put('/api/events/:id', authenticate, requireAdmin, (req, res) => {
  const eventId = req.params.id;
  const existing = db.prepare('SELECT * FROM events WHERE event_id = ?').get(eventId);

  if (!existing) {
    return res.status(404).json({ message: 'Event not found' });
  }

  const payload = {
    event_name: req.body.event_name ?? existing.event_name,
    event_type: req.body.event_type ?? existing.event_type,
    venue: req.body.venue ?? existing.venue,
    event_date: req.body.event_date ?? existing.event_date,
    event_time: req.body.event_time ?? existing.event_time,
    total_seats: req.body.total_seats ?? existing.total_seats,
    available_seats:
      req.body.total_seats && req.body.total_seats < existing.total_seats
        ? Math.max(existing.available_seats - (existing.total_seats - req.body.total_seats), 0)
        : req.body.available_seats ?? existing.available_seats,
    price_per_ticket: req.body.price_per_ticket ?? existing.price_per_ticket,
    description: req.body.description ?? existing.description,
    status: req.body.status ?? existing.status,
    banner_url: req.body.banner_url ?? existing.banner_url,
  };

  db.prepare(
    `UPDATE events SET
      event_name=@event_name,
      event_type=@event_type,
      venue=@venue,
      event_date=@event_date,
      event_time=@event_time,
      total_seats=@total_seats,
      available_seats=@available_seats,
      price_per_ticket=@price_per_ticket,
      description=@description,
      status=@status,
      banner_url=@banner_url
     WHERE event_id=@event_id`
  ).run({ ...payload, event_id: eventId });

  const updated = db.prepare('SELECT * FROM events WHERE event_id = ?').get(eventId);
  return res.json(updated);
});

app.delete('/api/events/:id', authenticate, requireAdmin, (req, res) => {
  const eventId = req.params.id;
  const bookingCount = db
    .prepare('SELECT COUNT(1) as total FROM bookings WHERE event_id = ?')
    .get(eventId).total;

  if (bookingCount > 0) {
    return res.status(400).json({ message: 'Cannot delete event with existing bookings' });
  }

  const info = db.prepare('DELETE FROM events WHERE event_id = ?').run(eventId);
  if (info.changes === 0) {
    return res.status(404).json({ message: 'Event not found' });
  }

  return res.status(204).send();
});

// ---------- Booking Routes ----------
app.get('/api/bookings', authenticate, (req, res) => {
  const scope = req.query.scope;
  const isAdminScope = scope === 'all';

  if (isAdminScope && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const baseQuery = `
    SELECT b.*, e.event_name, e.event_date, e.banner_url, e.venue,
           u.full_name AS user_name, u.email AS user_email
    FROM bookings b
    JOIN events e ON e.event_id = b.event_id
    JOIN users u ON u.user_id = b.user_id
    WHERE ${isAdminScope ? '1=1' : 'b.user_id = @user_id'}
    ORDER BY b.booking_date DESC
  `;

  const rows = db.prepare(baseQuery).all({ user_id: req.user.user_id });
  return res.json(rows);
});

const generateSeatNumbers = (quantity) => {
  const seats = [];
  for (let i = 0; i < quantity; i += 1) {
    const row = String.fromCharCode(65 + Math.floor(Math.random() * 10));
    const seat = Math.floor(Math.random() * 50) + 1;
    seats.push(`${row}${seat}`);
  }
  return seats;
};

app.post('/api/bookings', authenticate, (req, res) => {
  const { event_id, num_tickets } = req.body;
  if (!event_id || !num_tickets) {
    return res.status(400).json({ message: 'Event and ticket quantity are required' });
  }

  const event = db.prepare('SELECT * FROM events WHERE event_id = ?').get(event_id);
  if (!event || event.status !== 'active') {
    return res.status(404).json({ message: 'Event not available' });
  }

  if (event.available_seats < num_tickets) {
    return res.status(400).json({ message: 'Not enough seats available' });
  }

  const totalAmount = event.price_per_ticket * num_tickets;
  const seats = JSON.stringify(generateSeatNumbers(num_tickets));

  const insert = db.prepare(
    `INSERT INTO bookings (
      user_id, event_id, num_tickets, total_amount, seat_numbers
    ) VALUES (@user_id, @event_id, @num_tickets, @total_amount, @seat_numbers)`
  );

  const result = db.transaction(() => {
    const booking = insert.run({
      user_id: req.user.user_id,
      event_id,
      num_tickets,
      total_amount: totalAmount,
      seat_numbers: seats,
    });

    db.prepare(
      `UPDATE events
       SET available_seats = available_seats - ?
       WHERE event_id = ?`
    ).run(num_tickets, event_id);

    return booking.lastInsertRowid;
  })();

  const createdBooking = db
    .prepare(
      `SELECT b.*, e.event_name, e.banner_url, e.event_date
       FROM bookings b
       JOIN events e ON e.event_id = b.event_id
       WHERE b.booking_id = ?`
    )
    .get(result);

  return res.status(201).json(createdBooking);
});

app.patch('/api/bookings/:id/cancel', authenticate, (req, res) => {
  const bookingId = req.params.id;
  const booking = db.prepare('SELECT * FROM bookings WHERE booking_id = ?').get(bookingId);

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  if (req.user.role !== 'admin' && booking.user_id !== req.user.user_id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  if (booking.booking_status === 'cancelled') {
    return res.status(400).json({ message: 'Booking already cancelled' });
  }

  db.transaction(() => {
    db.prepare(
      `UPDATE bookings
       SET booking_status = 'cancelled'
       WHERE booking_id = ?`
    ).run(bookingId);

    db.prepare(
      `UPDATE events
       SET available_seats = available_seats + ?
       WHERE event_id = ?`
    ).run(booking.num_tickets, booking.event_id);
  })();

  return res.json({ message: 'Booking cancelled successfully' });
});

// ---------- Feedback Routes ----------
app.post('/api/feedback', authenticate, (req, res) => {
  const { event_id, rating, category, message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Feedback message is required' });
  }

  const insert = db.prepare(
    `INSERT INTO feedback (user_id, event_id, rating, category, message)
     VALUES (@user_id, @event_id, @rating, @category, @message)`
  );

  const result = insert.run({
    user_id: req.user.user_id,
    event_id: event_id || null,
    rating: rating || null,
    category: category || 'general',
    message,
  });

  const created = db
    .prepare(
      `SELECT f.*, u.full_name, e.event_name
       FROM feedback f
       JOIN users u ON u.user_id = f.user_id
       LEFT JOIN events e ON e.event_id = f.event_id
       WHERE f.feedback_id = ?`
    )
    .get(result.lastInsertRowid);

  return res.status(201).json(created);
});

app.get('/api/feedback', authenticate, (req, res) => {
  const scope = req.query.scope || (req.user.role === 'admin' ? 'all' : 'mine');
  if (scope === 'all' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const rows = db
    .prepare(
      `SELECT f.*, u.full_name, u.email, e.event_name
       FROM feedback f
       JOIN users u ON u.user_id = f.user_id
       LEFT JOIN events e ON e.event_id = f.event_id
       WHERE ${scope === 'mine' ? 'f.user_id = @user_id' : '1=1'}
       ORDER BY f.created_at DESC`
    )
    .all({ user_id: req.user.user_id });

  return res.json(rows);
});

app.patch('/api/feedback/:id', authenticate, requireAdmin, (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['new', 'in_review', 'resolved'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const info = db
    .prepare('UPDATE feedback SET status = ? WHERE feedback_id = ?')
    .run(status, req.params.id);

  if (info.changes === 0) {
    return res.status(404).json({ message: 'Feedback not found' });
  }

  return res.json({ message: 'Feedback updated' });
});

// ---------- Admin Utilities ----------
app.post('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  const { full_name, email, phone, username, password, role } = req.body;
  if (!full_name || !email || !username || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const targetRole = role === 'admin' ? 1 : 2;
  try {
    const result = db
      .prepare(
        `INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
         VALUES (@username, @email, @password_hash, @full_name, @phone, @role_id)`
      )
      .run({
        username,
        email: email.toLowerCase(),
        password_hash: bcrypt.hashSync(password, 10),
        full_name,
        phone: phone || null,
        role_id: targetRole,
      });

    const createdUser = db
      .prepare(
        `SELECT u.*, r.role_name
         FROM users u
         JOIN roles r ON r.role_id = u.role_id
         WHERE u.user_id = ?`
      )
      .get(result.lastInsertRowid);

    return res.status(201).json(formatUser(createdUser));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'Email or username already exists' });
    }
    return res.status(500).json({ message: 'Unable to create admin user' });
  }
});

app.get('/api/admin/overview', authenticate, requireAdmin, (req, res) => {
  const totals = {
    events: db.prepare('SELECT COUNT(1) as total FROM events').get().total,
    activeEvents: db
      .prepare("SELECT COUNT(1) as total FROM events WHERE status = 'active'")
      .get().total,
    bookings: db.prepare('SELECT COUNT(1) as total FROM bookings').get().total,
    revenue: db.prepare('SELECT IFNULL(SUM(total_amount),0) as total FROM bookings').get()
      .total,
    feedbackOpen: db
      .prepare("SELECT COUNT(1) as total FROM feedback WHERE status != 'resolved'")
      .get().total,
  };

  const topEvents = db
    .prepare(
      `SELECT e.event_id, e.event_name, e.event_date,
              SUM(b.num_tickets) as tickets_sold,
              SUM(b.total_amount) as revenue
       FROM events e
       LEFT JOIN bookings b ON b.event_id = e.event_id AND b.booking_status = 'confirmed'
       GROUP BY e.event_id
       ORDER BY tickets_sold DESC NULLS LAST
       LIMIT 5`
    )
    .all();

  return res.json({ totals, topEvents });
});

// ---------- Static Assets ----------
app.use(express.static(__dirname));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`TicketBooker server running on http://localhost:${PORT}`);
});

