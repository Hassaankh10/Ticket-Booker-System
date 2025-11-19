const bcrypt = require('bcryptjs');
const { db } = require('./index');
const logger = require('../utils/logger');

const ensureRoles = (db) => {
  const stmt = db.prepare('INSERT OR IGNORE INTO roles (role_id, role_name) VALUES (?, ?)');
  stmt.run(1, 'admin');
  stmt.run(2, 'customer');
};

const ensureAdminUser = (db) => {
  const existing = db.prepare('SELECT user_id FROM users WHERE username = ?').get('admin');
  if (existing) {
    return existing.user_id;
  }

  const passwordHash = bcrypt.hashSync('Admin@123', 10);
  const insert = db.prepare(
    `INSERT INTO users (username, email, password_hash, full_name, phone, role_id, status)
     VALUES (@username, @email, @password_hash, @full_name, @phone, @role_id, 'active')`
  );

  const result = insert.run({
    username: 'admin',
    email: 'admin@ticketbook.com',
    password_hash: passwordHash,
    full_name: 'System Administrator',
    phone: '03001234567',
    role_id: 1,
  });

  return result.lastInsertRowid;
};

const ensureSampleEvents = (db, adminId) => {
  const count = db.prepare('SELECT COUNT(1) as total FROM events').get().total;
  if (count > 0) {
    return;
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

  const sampleEvents = [
    {
      event_name: 'Karachi Music Festival 2025',
      event_type: 'Concert',
      venue: 'Expo Centre Karachi',
      event_date: '2025-10-15',
      event_time: '19:00',
      total_seats: 5000,
      available_seats: 4950,
      price_per_ticket: 2500,
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
      price_per_ticket: 500,
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
      price_per_ticket: 5000,
      description: 'Latest trends in technology and software development.',
      status: 'active',
      banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    },
  ];

  const insertMany = db.transaction((events) => {
    events.forEach((event) => insert.run({ ...event, created_by: adminId }));
  });

  insertMany(sampleEvents);
};

const seedDatabase = () => {
  try {
    ensureRoles(db);
    const adminId = ensureAdminUser(db);
    ensureSampleEvents(db, adminId);
  } catch (error) {
    logger.error('Failed to seed database', error);
    throw error;
  }
};

module.exports = seedDatabase;


