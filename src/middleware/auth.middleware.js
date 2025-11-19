const { verifyToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/errors');
const userService = require('../services/user.service');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      throw new UnauthorizedError('Authorization header missing');
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Invalid authorization header');
    }

    const payload = verifyToken(token);
    const user = await userService.findById(payload.user_id);
    if (!user) {
      throw new UnauthorizedError('Session expired');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;


