const Joi = require('joi');

const baseEventSchema = {
  event_name: Joi.string().max(200),
  event_type: Joi.string().max(50),
  venue: Joi.string().max(200),
  event_date: Joi.date(),
  event_time: Joi.string(),
  total_seats: Joi.number().integer().min(1),
  price_per_ticket: Joi.number().precision(2).min(0),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive', 'sold_out', 'deleted'),
  banner_url: Joi.string().uri().allow('', null),
};

const createEventSchema = Joi.object({
  ...baseEventSchema,
  event_name: baseEventSchema.event_name.required(),
  event_type: baseEventSchema.event_type.required(),
  venue: baseEventSchema.venue.required(),
  event_date: baseEventSchema.event_date.required(),
  event_time: baseEventSchema.event_time.required(),
  total_seats: baseEventSchema.total_seats.required(),
  price_per_ticket: baseEventSchema.price_per_ticket.required(),
});

const updateEventSchema = Joi.object(baseEventSchema);

const statusSchema = Joi.object({
  status: baseEventSchema.status.required(),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  statusSchema,
};


