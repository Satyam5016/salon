export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  let statusCode = res.statusCode === 200 ? error.statusCode || 500 : res.statusCode;
  let errorMessage = error.message || 'Server error';

  if (error.name === 'CastError') {
    statusCode = 400;
    errorMessage = 'Invalid resource id';
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = Object.values(error.errors)
      .map((item) => item.message)
      .join(', ');
  }

  if (error.code === 11000) {
    statusCode = 409;
    errorMessage = 'This record conflicts with an existing booking or unique field';
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && statusCode >= 500 ? 'Server error' : errorMessage;

  const response = {
    success: false,
    message
  };

  if (!isProduction && error.stack) response.stack = error.stack;

  res.status(statusCode).json(response);
}
