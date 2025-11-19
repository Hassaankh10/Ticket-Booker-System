// Database initialization script for Next.js
require('dotenv').config();
const { runMigrations } = require('../src/db');
const seedDatabase = require('../src/db/seed');
const { startExpirationWorker } = require('../src/services/seatLock.service');
const logger = require('../src/utils/logger');

const initDatabase = () => {
  try {
    runMigrations();
    seedDatabase();
    startExpirationWorker();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;

