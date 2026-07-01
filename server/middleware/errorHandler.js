/**
 * Global error handler — catches all unhandled errors from route handlers.
 *
 * - In development: returns full error details for debugging.
 * - In production: returns a generic message without leaking stack traces.
 * - Handles common Mongoose errors (ValidationError, CastError, duplicate key).
 */
const errorHandler = (err, req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message    = err.message || 'Internal server error';

  // Mongoose validation error (e.g. missing required fields)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map(e => e.message);
    message = `Validation failed: ${messages.join(', ')}`;
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for field: ${field}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // Log the error server-side
  console.error(`[Error] ${statusCode} ${req.method} ${req.originalUrl} — ${message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Respond
  res.status(statusCode).json({
    message,
    // Only include stack in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export default errorHandler;
