const Joi = require('joi');

const createBookingSchema = Joi.object({
  event_id: Joi.number().integer().positive().required(),
  num_tickets: Joi.number().integer().min(1).max(20).required(),
  lock_id: Joi.string().uuid({ version: 'uuidv4' }).optional(),
});

const seatLockSchema = Joi.object({
  event_id: Joi.number().integer().positive().required(),
  num_tickets: Joi.number().integer().min(1).max(20).required(),
});

module.exports = {
  createBookingSchema,
  seatLockSchema,
};


