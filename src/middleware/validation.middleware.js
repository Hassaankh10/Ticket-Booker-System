const { ValidationError } = require('../utils/errors');

const validate =
  (schema, property = 'body') =>
  (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        throw new ValidationError('Validation failed', error.details);
      }
      // In Express 5, req.query is read-only, so we can't reassign it
      // For query params, validation is read-only (just validates, doesn't modify)
      if (property !== 'query') {
      req[property] = value;
      }
      next();
    } catch (err) {
      next(err);
    }
  };

module.exports = validate;


