const { logger, logToDatabase } = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  if (err.code === '23505') {
    error = new ConflictError('数据已存在');
  }

  if (err.code === '23503') {
    error = new ValidationError('关联数据不存在或无效');
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('无效的令牌', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('令牌已过期', 401, 'TOKEN_EXPIRED');
  }

  if (err.name === 'ValidationError' && err.isJoi) {
    error = new ValidationError('数据验证失败', err.details);
  }

  if (!error.isOperational) {
    logToDatabase('error', error, req);
  }

  logger.error(`${error.statusCode || 500} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  const response = {
    success: false,
    message: error.message || '服务器内部错误',
    code: error.code || 'INTERNAL_ERROR',
  };

  if (error.details) {
    response.details = error.details;
  }

  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  res.status(error.statusCode || 500).json(response);
}

function notFoundHandler(req, res, next) {
  next(new NotFoundError(`接口不存在: ${req.originalUrl}`));
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  errorHandler,
  notFoundHandler,
};
