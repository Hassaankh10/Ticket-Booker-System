import '../public/style.css';

// Initialize database on server startup
if (typeof window === 'undefined') {
  try {
    const { runMigrations } = require('../src/db');
    const seedDatabase = require('../src/db/seed');
    const { startExpirationWorker } = require('../src/services/seatLock.service');
    
    runMigrations();
    seedDatabase();
    startExpirationWorker();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
