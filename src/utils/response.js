const successResponse = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

const errorResponse = (res, error, statusCode = 500) =>
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Unexpected error occurred',
    ...(error.details ? { details: error.details } : {}),
  });

module.exports = {
  successResponse,
  errorResponse,
};


