const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'ticket_booking_system.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS roles (
  role_id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE IF NOT EXISTS events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name VARCHAR(200) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  venue VARCHAR(200) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  total_seats INTEGER NOT NULL,
  available_seats INTEGER NOT NULL,
  price_per_ticket DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_by INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  banner_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  num_tickets INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  booking_status VARCHAR(20) DEFAULT 'confirmed',
  payment_status VARCHAR(20) DEFAULT 'completed',
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  seat_numbers TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE IF NOT EXISTS feedback (
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_id INTEGER,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  category VARCHAR(50) DEFAULT 'general',
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  transaction_ref VARCHAR(120),
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS booking_status_log (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by_user_id INTEGER,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
  FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS feedback_summary (
  event_id INTEGER PRIMARY KEY,
  total_feedback INTEGER DEFAULT 0,
  avg_rating REAL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(event_id)
);

DROP TRIGGER IF EXISTS trg_bookings_validate_inventory;
CREATE TRIGGER trg_bookings_validate_inventory
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.num_tickets <= 0 THEN
      RAISE(ABORT, 'Ticket quantity must be positive')
    WHEN NOT EXISTS (
      SELECT 1 FROM events
      WHERE event_id = NEW.event_id AND status = 'active'
    ) THEN
      RAISE(ABORT, 'Event not available')
    WHEN (
      SELECT available_seats FROM events WHERE event_id = NEW.event_id
    ) < NEW.num_tickets THEN
      RAISE(ABORT, 'Not enough seats available')
  END;
END;

DROP TRIGGER IF EXISTS trg_bookings_decrement_seats;
CREATE TRIGGER trg_bookings_decrement_seats
AFTER INSERT ON bookings
FOR EACH ROW
WHEN NEW.booking_status = 'confirmed'
BEGIN
  UPDATE events
  SET available_seats = available_seats - NEW.num_tickets
  WHERE event_id = NEW.event_id;
END;

DROP TRIGGER IF EXISTS trg_bookings_restore_seats;
CREATE TRIGGER trg_bookings_restore_seats
AFTER UPDATE OF booking_status ON bookings
FOR EACH ROW
WHEN OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled'
BEGIN
  UPDATE events
  SET available_seats = available_seats + OLD.num_tickets
  WHERE event_id = OLD.event_id;
END;

DROP TRIGGER IF EXISTS trg_booking_status_audit;
CREATE TRIGGER trg_booking_status_audit
AFTER UPDATE OF booking_status ON bookings
FOR EACH ROW
WHEN OLD.booking_status != NEW.booking_status
BEGIN
  INSERT INTO booking_status_log (
    booking_id,
    previous_status,
    new_status,
    changed_by_user_id
  ) VALUES (
    NEW.booking_id,
    OLD.booking_status,
    NEW.booking_status,
    NEW.user_id
  );
END;

DROP TRIGGER IF EXISTS trg_payments_update_booking;
CREATE TRIGGER trg_payments_update_booking
AFTER INSERT ON payment_transactions
FOR EACH ROW
BEGIN
  UPDATE bookings
  SET payment_status = NEW.status,
      booking_status = CASE
        WHEN NEW.status = 'completed' THEN 'confirmed'
        WHEN NEW.status = 'refunded' THEN 'cancelled'
        ELSE booking_status
      END
  WHERE booking_id = NEW.booking_id;
END;

DROP TRIGGER IF EXISTS trg_feedback_summary_insert;
CREATE TRIGGER trg_feedback_summary_insert
AFTER INSERT ON feedback
FOR EACH ROW
WHEN NEW.rating IS NOT NULL AND NEW.event_id IS NOT NULL
BEGIN
  INSERT INTO feedback_summary (event_id, total_feedback, avg_rating, last_updated)
  VALUES (NEW.event_id, 1, NEW.rating, CURRENT_TIMESTAMP)
  ON CONFLICT(event_id) DO UPDATE SET
    total_feedback = total_feedback + 1,
    avg_rating = ROUND(
      ((avg_rating * (total_feedback)) + NEW.rating) / (total_feedback + 1),
      2
    ),
    last_updated = CURRENT_TIMESTAMP;
END;

DROP TRIGGER IF EXISTS trg_feedback_summary_update;
CREATE TRIGGER trg_feedback_summary_update
AFTER UPDATE OF rating ON feedback
FOR EACH ROW
WHEN NEW.rating IS NOT NULL AND NEW.event_id IS NOT NULL
BEGIN
  INSERT INTO feedback_summary (event_id, total_feedback, avg_rating, last_updated)
  VALUES (
    NEW.event_id,
    (SELECT COUNT(1) FROM feedback WHERE event_id = NEW.event_id AND rating IS NOT NULL),
    (SELECT ROUND(IFNULL(AVG(rating), 0), 2) FROM feedback WHERE event_id = NEW.event_id),
    CURRENT_TIMESTAMP
  )
  ON CONFLICT(event_id) DO UPDATE SET
    total_feedback = excluded.total_feedback,
    avg_rating = excluded.avg_rating,
    last_updated = CURRENT_TIMESTAMP;
END;
`;

const ensureRoles = () => {
  const stmt = db.prepare('INSERT OR IGNORE INTO roles(role_id, role_name) VALUES (?, ?)');
  stmt.run(1, 'admin');
  stmt.run(2, 'customer');
};

const ensureAdminUser = () => {
  const existing = db.prepare('SELECT user_id FROM users WHERE username = ?').get('admin');
  if (existing) {
    return existing.user_id;
  }
  const passwordHash = bcrypt.hashSync('Admin@123', 10);
  const result = db
    .prepare(
      `INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
       VALUES (@username, @email, @password_hash, @full_name, @phone, @role_id)`
    )
    .run({
      username: 'admin',
      email: 'admin@ticketbook.com',
      password_hash: passwordHash,
      full_name: 'System Administrator',
      phone: '03001234567',
      role_id: 1,
    });

  return result.lastInsertRowid;
};

const ensureSeedEvents = (adminId) => {
  const eventCount = db.prepare('SELECT COUNT(1) as total FROM events').get().total;
  if (eventCount > 0) {
    return;
  }

  const insertStmt = db.prepare(
    `INSERT INTO events (
      event_name, event_type, venue, event_date, event_time, total_seats,
      available_seats, price_per_ticket, description, created_by, status, banner_url
    ) VALUES (
      @event_name, @event_type, @venue, @event_date, @event_time, @total_seats,
      @available_seats, @price_per_ticket, @description, @created_by, @status, @banner_url
    )`
  );

  const sampleEvents = [
    {
      event_name: 'Karachi Music Festival 2025',
      event_type: 'Concert',
      venue: 'Expo Centre Karachi',
      event_date: '2025-10-15',
      event_time: '19:00',
      total_seats: 5000,
      available_seats: 4950,
      price_per_ticket: 2500.0,
      description:
        'Annual music festival featuring top artists from Pakistan and around the world.',
      status: 'active',
      banner_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
    },
    {
      event_name: 'Lahore Food Festival',
      event_type: 'Food Festival',
      venue: 'Fortress Stadium Lahore',
      event_date: '2025-09-25',
      event_time: '17:00',
      total_seats: 3000,
      available_seats: 2980,
      price_per_ticket: 500.0,
      description: 'Taste the best food from across Pakistan and international cuisines.',
      status: 'active',
      banner_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    },
    {
      event_name: 'Tech Conference 2025',
      event_type: 'Conference',
      venue: 'PC Hotel Karachi',
      event_date: '2025-11-20',
      event_time: '09:00',
      total_seats: 500,
      available_seats: 480,
      price_per_ticket: 5000.0,
      description: 'Latest trends in technology and software development.',
      status: 'active',
      banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    },
  ];

  const insertMany = db.transaction((rows) => {
    rows.forEach((row) => insertStmt.run({ ...row, created_by: adminId }));
  });

  insertMany(sampleEvents);
};

const runMigrations = () => {
  db.exec(MIGRATIONS);
  ensureRoles();
  const adminId = ensureAdminUser();
  ensureSeedEvents(adminId);
};

module.exports = {
  db,
  runMigrations,
};

