const db = require('./connection');
const logger = require('../utils/logger');
const { up } = require('./migrations/001_init');

const transformSql = (sql) =>
  sql
    .replace(/\$(\d+)/g, '?')
    .replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');

const run = (sql, params = []) => {
  const statement = db.prepare(transformSql(sql));
  return statement.run(params);
};

const get = (sql, params = []) => {
  const statement = db.prepare(transformSql(sql));
  return statement.get(params);
};

const all = (sql, params = []) => {
  const statement = db.prepare(transformSql(sql));
  return statement.all(params);
};

const query = (sql, params = []) => {
  const rows = all(sql, params);
  return { rows, rowCount: rows.length };
};

const withTransaction = async (handler) => {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = await handler({ run, get, all, query });
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

const runMigrations = () => {
  try {
    // In a real system, we would check a migrations table.
    // For this refactor, we just run the initial schema.
    db.exec(up);
    
    // Add password reset fields if they don't exist (for existing databases)
    try {
      const { addPasswordResetFields } = require('./migrations/002_add_password_reset');
      addPasswordResetFields(db);
    } catch (error) {
      // Migration might not be needed or already applied
      logger.debug('Password reset fields migration:', error.message);
    }
    
    logger.info('Migrations executed successfully');
  } catch (error) {
    logger.error('Failed to run migrations', error);
    throw error;
  }
};

module.exports = {
  db,
  run,
  get,
  all,
  query,
  withTransaction,
  runMigrations,
};
