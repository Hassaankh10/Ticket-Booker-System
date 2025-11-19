import '../public/style.css';

// Initialize database on server startup (only at runtime, not during build)
// Skip initialization during build phase to avoid requiring environment variables
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NEXT_PHASE === 'phase-production-compile';

if (typeof window === 'undefined' && !isBuildTime) {
  try {
    // Only initialize if JWT_SECRET is available (runtime check)
    if (process.env.JWT_SECRET) {
      const { runMigrations } = require('../src/db');
      const seedDatabase = require('../src/db/seed');
      const { startExpirationWorker } = require('../src/services/seatLock.service');
      
      runMigrations();
      seedDatabase();
      startExpirationWorker();
      console.log('Database initialized successfully');
    }
  } catch (error) {
    // Don't fail build if database initialization fails
    // It will be initialized on first API request via /api/init-db
    console.warn('Database initialization skipped (will initialize on first API request):', error.message);
  }
}

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
