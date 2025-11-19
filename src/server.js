const app = require('./app');
const config = require('./utils/config');
const logger = require('./utils/logger');
const { runMigrations } = require('./db');
const seedDatabase = require('./db/seed');
const seatLockService = require('./services/seatLock.service');

const startServer = async () => {
  try {
    runMigrations();
    await seedDatabase();
    seatLockService.startExpirationWorker();

    app.listen(config.port, () => {
      logger.info(`TicketBooker server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();


