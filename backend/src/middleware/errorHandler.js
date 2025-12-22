/**
 * Error handling middleware for the application
 * Centralizes error handling and provides consistent error responses
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { name: 'CastError', message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let field = 'field';
    if (err.keyPattern && err.keyPattern.email) {
      field = 'email';
    }
    const message = `${field} already exists`;
    error = { name: 'DuplicateError', message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { name: 'ValidationError', message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { name: 'JsonWebTokenError', message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { name: 'TokenExpiredError', message, statusCode: 401 };
  }

  // Database connection errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    const message = 'Database connection error';
    error = { name: 'DatabaseError', message, statusCode: 500 };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { name: 'RateLimitError', message, statusCode: 429 };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { name: 'FileSizeError', message, statusCode: 413 };
  }

  // Encryption/Decryption errors
  if (err.message && err.message.includes('decrypt')) {
    const message = 'Data decryption failed';
    error = { name: 'DecryptionError', message, statusCode: 500 };
  }

  if (err.message && err.message.includes('encrypt')) {
    const message = 'Data encryption failed';
    error = { name: 'EncryptionError', message, statusCode: 500 };
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || err.message || 'Server Error';

  const errorResponse = {
    success: false,
    error: {
      name: error.name || 'ServerError',
      message: Array.isArray(message) ? message.join(', ') : message
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Include additional error details for specific errors
  if (error.name === 'ValidationError' && err.errors) {
    errorResponse.error.details = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message
    }));
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;