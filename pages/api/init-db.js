// Database initialization API route
let initialized = false;

async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (initialized) {
    return res.status(200).json({ success: true, message: 'Already initialized' });
  }

  try {
    const { runMigrations } = require('src/db');
    const seedDatabase = require('src/db/seed');
    const { startExpirationWorker } = require('src/services/seatLock.service');

    // Run migrations first
    runMigrations();
    
    // Seed database (seed.js is synchronous, not async)
    seedDatabase();
    
    // Start expiration worker
    startExpirationWorker();
    
    initialized = true;
    return res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully',
      note: 'Admin credentials: admin@ticketbook.com / Admin@123'
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize database', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

module.exports = handler;
module.exports.default = handler;
