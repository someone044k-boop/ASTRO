const logger = require('../utils/logger');

// Глобальний обробник помилок
function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Внутрішня помилка сервера';

  // Логування помилки
  logger.error(`Помилка ${statusCode}: ${message}`, {
    error: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Обробка специфічних типів помилок
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Помилка валідації даних';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Неавторизований доступ';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Недійсний токен';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Токен прострочений';
  } else if (error.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Дані вже існують';
  } else if (error.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Порушення цілісності даних';
  }

  // Відповідь клієнту
  const response = {
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  // В режимі розробки додаємо stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.details = error.details || null;
  }

  res.status(statusCode).json(response);
}

// Обробник для неіснуючих маршрутів
function notFoundHandler(req, res, next) {
  const error = new Error(`Маршрут ${req.originalUrl} не знайдено`);
  error.statusCode = 404;
  next(error);
}

// Обробник для асинхронних помилок
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
module.exports.notFoundHandler = notFoundHandler;
module.exports.asyncHandler = asyncHandler;