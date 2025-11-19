const path = require('path');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

// Only check JWT_SECRET at runtime, not during build
// Vercel builds don't have access to environment variables during build phase
// Check NEXT_PHASE to detect build time vs runtime
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NEXT_PHASE === 'phase-production-compile';

if (!isBuildTime && !process.env.JWT_SECRET) {
  throw new Error('Environment variable JWT_SECRET is required but missing');
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  },
  db: {
    sqlitePath: process.env.DB_PATH
      ? path.resolve(process.env.DB_PATH)
      : path.resolve(__dirname, '..', '..', 'ticket_booking_system.db'),
  },
  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
      : ['*'],
  },
  security: {
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 200),
  },
  seatLock: {
    ttlMs: Number(process.env.SEAT_LOCK_TTL_MS || 5 * 60 * 1000),
    sweepIntervalMs: Number(process.env.SEAT_LOCK_SWEEP_MS || 60 * 1000),
  },
  paths: {
    root: path.resolve(__dirname, '..', '..'),
    public: path.resolve(__dirname, '..', '..'),
  },
};

module.exports = config;


