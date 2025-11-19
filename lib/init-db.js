// Initialize database on server startup
if (typeof window === 'undefined') {
  const { runMigrations } = require('../src/db');
  const seedDatabase = require('../src/db/seed');
  const { startExpirationWorker } = require('../src/services/seatLock.service');
  
  try {
    runMigrations();
    seedDatabase();
    startExpirationWorker();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}
