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

