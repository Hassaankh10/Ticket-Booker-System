const Joi = require('joi');

const registerSchema = Joi.object({
  full_name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow(null, '').max(20),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).max(64).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(64).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};


