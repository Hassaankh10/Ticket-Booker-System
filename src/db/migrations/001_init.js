const up = `
CREATE TABLE IF NOT EXISTS roles (
  role_id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);

CREATE TABLE IF NOT EXISTS events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  venue TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  total_seats INTEGER NOT NULL CHECK(total_seats > 0),
  available_seats INTEGER NOT NULL CHECK(available_seats >= 0),
  price_per_ticket REAL NOT NULL CHECK(price_per_ticket >= 0),
  description TEXT,
  created_by INTEGER,
  status TEXT DEFAULT 'active',
  banner_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  CHECK(status IN ('active','inactive','sold_out','deleted'))
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

CREATE TABLE IF NOT EXISTS seat_locks (
  lock_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  num_tickets INTEGER NOT NULL CHECK(num_tickets > 0),
  status TEXT DEFAULT 'locked',
  expires_at DATETIME NOT NULL,
  released_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  CHECK(status IN ('locked','released','expired','consumed'))
);

CREATE INDEX IF NOT EXISTS idx_seat_locks_event ON seat_locks(event_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_expires ON seat_locks(expires_at);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  num_tickets INTEGER NOT NULL CHECK(num_tickets > 0),
  total_amount REAL NOT NULL CHECK(total_amount >= 0),
  booking_status TEXT DEFAULT 'confirmed',
  payment_status TEXT DEFAULT 'completed',
  booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  seat_numbers TEXT,
  lock_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id),
  FOREIGN KEY (lock_id) REFERENCES seat_locks(lock_id),
  CHECK(booking_status IN ('confirmed','cancelled')),
  CHECK(payment_status IN ('pending','completed','failed','refunded'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);

CREATE TABLE IF NOT EXISTS feedback (
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_id INTEGER,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  category TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE SET NULL,
  CHECK(status IN ('new','in_review','resolved'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
`;

module.exports = { up };
