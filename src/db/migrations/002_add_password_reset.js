const up = `
-- Add password reset fields to users table if they don't exist
-- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we use a workaround
-- This migration is safe to run multiple times

-- Check if password_reset_token column exists, if not add it
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- We'll handle this in the migration runner or just let it fail gracefully
`;

const addPasswordResetFields = (db) => {
  try {
    // Try to add password_reset_token column
    db.exec(`ALTER TABLE users ADD COLUMN password_reset_token TEXT`);
  } catch (error) {
    // Column might already exist, ignore error
    if (!error.message.includes('duplicate column')) {
      throw error;
    }
  }

  try {
    // Try to add password_reset_expires column
    db.exec(`ALTER TABLE users ADD COLUMN password_reset_expires DATETIME`);
  } catch (error) {
    // Column might already exist, ignore error
    if (!error.message.includes('duplicate column')) {
      throw error;
    }
  }
};

module.exports = { up, addPasswordResetFields };

