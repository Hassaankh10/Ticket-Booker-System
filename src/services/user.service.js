const { get } = require('../db');

const mapUser = (row) => {
  if (!row) return null;
  return {
    user_id: row.user_id,
    username: row.username,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    role: row.role_name || row.role,
    created_at: row.created_at,
    status: row.status,
  };
};

const findById = async (userId) => {
  const row = get(
    `SELECT u.*, r.role_name
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE u.user_id = ?
       AND u.status = 'active'`,
    [userId]
  );
  return mapUser(row);
};

const findByEmailOrUsername = async (identifier) => {
  const row = get(
    `SELECT u.*, r.role_name
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE (LOWER(u.email) = LOWER(?) OR LOWER(u.username) = LOWER(?))
       AND u.status = 'active'`,
    [identifier, identifier]
  );
  return row;
};

module.exports = {
  findById,
  findByEmailOrUsername,
  mapUser,
};


