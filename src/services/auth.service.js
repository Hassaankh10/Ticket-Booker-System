const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { get, run } = require('../db');
const { signToken } = require('../utils/jwt');
const { AppError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const userService = require('./user.service');
const logger = require('../utils/logger');

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

const forgotPassword = async ({ email }) => {
  const user = await userService.findByEmailOrUsername(email);
  
  // Don't reveal if user exists or not (security best practice)
  if (!user) {
    // Still return success to prevent email enumeration
    logger.info(`Password reset requested for non-existent email: ${email}`);
    return { message: 'If an account exists with this email, a password reset link has been sent.' };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Save reset token to database
  run(
    `UPDATE users 
     SET password_reset_token = ?, 
         password_reset_expires = ?
     WHERE user_id = ?`,
    [resetToken, resetExpires.toISOString(), user.user_id]
  );

  // In production, send email with reset link
  // For now, we'll log it (in development) or use a placeholder email service
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  logger.info(`Password reset token generated for user ${user.email}`);
  logger.debug(`Reset URL: ${resetUrl}`);

  // TODO: Send email with reset link
  // await emailService.sendPasswordResetEmail(user.email, resetUrl);

  return { 
    message: 'If an account exists with this email, a password reset link has been sent.',
    // In development, return the token for testing (remove in production)
    ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl })
  };
};

const resetPassword = async ({ token, password }) => {
  // Find user with valid reset token
  const user = get(
    `SELECT user_id, email, password_reset_expires
     FROM users
     WHERE password_reset_token = ?
       AND password_reset_expires > datetime('now')`,
    [token]
  );

  if (!user) {
    throw new UnauthorizedError('Invalid or expired password reset token');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(password, 10);

  // Update password and clear reset token
  run(
    `UPDATE users
     SET password_hash = ?,
         password_reset_token = NULL,
         password_reset_expires = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [passwordHash, user.user_id]
  );

  logger.info(`Password reset successful for user ${user.email}`);

  return { message: 'Password has been reset successfully. You can now login with your new password.' };
};

module.exports = {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
};


