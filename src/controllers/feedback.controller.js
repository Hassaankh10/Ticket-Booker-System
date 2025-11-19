const feedbackService = require('../services/feedback.service');

const createFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.createFeedback({
      userId: req.user.user_id,
      ...req.body,
    });
    return res.status(201).json(feedback);
  } catch (error) {
    return next(error);
  }
};

const listFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.listFeedback({
      scope: req.query.scope || (req.user.role === 'admin' ? 'all' : 'mine'),
      user: req.user,
    });
    return res.json(feedback);
  } catch (error) {
    return next(error);
  }
};

const updateFeedbackStatus = async (req, res, next) => {
  try {
    await feedbackService.updateFeedbackStatus({
      feedbackId: req.params.id,
      status: req.body.status,
    });
    return res.json({ message: 'Feedback updated' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFeedback,
  listFeedback,
  updateFeedbackStatus,
};


