const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const profile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.user_id);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  profile,
};


