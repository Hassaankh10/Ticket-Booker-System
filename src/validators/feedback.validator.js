const Joi = require('joi');

const createFeedbackSchema = Joi.object({
  event_id: Joi.number().integer().positive().allow(null),
  rating: Joi.number().integer().min(1).max(5).allow(null),
  category: Joi.string().max(50).default('general'),
  message: Joi.string().min(5).required(),
});

const updateFeedbackStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'in_review', 'resolved').required(),
});

module.exports = {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
};


