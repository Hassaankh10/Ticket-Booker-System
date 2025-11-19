const Joi = require('joi');

const createUserSchema = Joi.object({
  full_name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).max(64).required(),
  role: Joi.string().valid('admin', 'customer').default('customer'),
});

const eventStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'sold_out', 'deleted').required(),
});

module.exports = {
  createUserSchema,
  eventStatusSchema,
};


