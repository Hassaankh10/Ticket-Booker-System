const { all, get, run } = require('../db');
const { AppError, NotFoundError } = require('../utils/errors');

const createFeedback = async ({ userId, event_id, rating, category, message }) => {
  const result = run(
    `INSERT INTO feedback (user_id, event_id, rating, category, message)
     VALUES (?,?,?,?,?)`,
    [userId, event_id || null, rating || null, category || 'general', message]
  );

  return get(
    `SELECT f.*, u.full_name, u.email, e.event_name
     FROM feedback f
     JOIN users u ON u.user_id = f.user_id
     LEFT JOIN events e ON e.event_id = f.event_id
     WHERE f.feedback_id = ?`,
    [result.lastInsertRowid]
  );
};

const listFeedback = async ({ scope, user }) => {
  let whereClause = '1=1';
  const params = [];

  if (scope === 'mine' || user.role !== 'admin') {
    whereClause = 'f.user_id = ?';
    params.push(user.user_id);
  }

  return all(
    `SELECT f.*, u.full_name, u.email, e.event_name
     FROM feedback f
     JOIN users u ON u.user_id = f.user_id
     LEFT JOIN events e ON e.event_id = f.event_id
     WHERE ${whereClause}
     ORDER BY f.created_at DESC`,
    params
  );
};

const updateFeedbackStatus = async ({ feedbackId, status }) => {
  const allowedStatuses = ['new', 'in_review', 'resolved'];
  if (!allowedStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const result = run(
    `UPDATE feedback
     SET status = ?
     WHERE feedback_id = ?`,
    [status, feedbackId]
  );

  if (result.changes === 0) {
    throw new NotFoundError('Feedback not found');
  }
};

module.exports = {
  createFeedback,
  listFeedback,
  updateFeedbackStatus,
};


