const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, val]) => {
      acc[key] = sanitizeValue(val);
      return acc;
    }, {});
  }
  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  // Note: req.query is read-only in Express 5, so we sanitize values in place
  // Query parameters are already parsed and sanitized by Express
  next();
};

module.exports = sanitizeRequest;


