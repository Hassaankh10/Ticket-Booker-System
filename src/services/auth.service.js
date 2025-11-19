const bcrypt = require('bcryptjs');
const { get, run } = require('../db');
const { signToken } = require('../utils/jwt');
const { AppError, UnauthorizedError } = require('../utils/errors');
const userService = require('./user.service');

const register = async ({ full_name, email, phone, username, password }) => {
  const existing = get(
    `SELECT 1
     FROM users
     WHERE LOWER(email) = LOWER(?)
        OR LOWER(username) = LOWER(?)`,
    [email, username]
  );

  if (existing) {
    throw new AppError('Email or username already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = run(
    `INSERT INTO users (username, email, password_hash, full_name, phone, role_id, status)
     VALUES (?,?,?,?,?,?,'active')`,
    [username, email.toLowerCase(), passwordHash, full_name, phone || null, 2]
  );

  const user = await userService.findById(result.lastInsertRowid);
  const token = signToken({ user_id: user.user_id, role: user.role });
  return { token, user };
};

const login = async ({ email, password }) => {
  const userRow = await userService.findByEmailOrUsername(email);
  if (!userRow) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const passwordMatch = await bcrypt.compare(password, userRow.password_hash);
  if (!passwordMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const user = userService.mapUser(userRow);
  const token = signToken({ user_id: user.user_id, role: user.role });
  return { token, user };
};

const getProfile = async (userId) => userService.findById(userId);

module.exports = {
  register,
  login,
  getProfile,
};


