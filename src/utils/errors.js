class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const NotFoundError = class extends AppError {
  constructor(message = 'Resource not found', details) {
    super(message, 404, details);
  }
};

const UnauthorizedError = class extends AppError {
  constructor(message = 'Unauthorized', details) {
    super(message, 401, details);
  }
};

const ForbiddenError = class extends AppError {
  constructor(message = 'Forbidden', details) {
    super(message, 403, details);
  }
};

const ValidationError = class extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, 400, details);
  }
};

module.exports = {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
};


