const { ForbiddenError } = require('../utils/errors');

const requireAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireAdmin;


