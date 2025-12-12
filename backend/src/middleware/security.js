const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const logger = require('../utils/logger');

// Rate limiting для різних типів запитів
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
      res.status(429).json({ error: message });
    }
  });
};

// Загальний rate limiter
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 хвилин
  100, // 100 запитів
  'Забагато запитів з цієї IP адреси, спробуйте пізніше'
);

// Строгий rate limiter для аутентифікації
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 хвилин
  5, // 5 спроб
  'Забагато спроб входу, спробуйте пізніше'
);

// Rate limiter для API
const apiLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 хвилина
  60, // 60 запитів
  'Забагато API запитів, спробуйте пізніше'
);

// Middleware для валідації та санітизації вводу
const inputValidation = (req, res, next) => {
  // Санітизація всіх string полів в body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Видаляємо потенційно небезпечні символи
        req.body[key] = validator.escape(req.body[key]);
        
        // Перевіряємо на SQL injection паттерни
        const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i;
        if (sqlInjectionPattern.test(req.body[key])) {
          logger.warn(`Potential SQL injection attempt from IP: ${req.ip}, field: ${key}, value: ${req.body[key]}`);
          return res.status(400).json({ error: 'Недопустимі символи в даних' });
        }
        
        // Перевіряємо на XSS паттерни
        const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
        if (xssPattern.test(req.body[key])) {
          logger.warn(`Potential XSS attempt from IP: ${req.ip}, field: ${key}`);
          return res.status(400).json({ error: 'Недопустимий контент' });
        }
      }
    }
  }
  
  next();
};

// Middleware для перевірки CSRF токенів
const csrfProtection = (req, res, next) => {
  // Пропускаємо GET запити
  if (req.method === 'GET') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn(`CSRF token mismatch from IP: ${req.ip}`);
    return res.status(403).json({ error: 'Недійсний CSRF токен' });
  }
  
  next();
};

// Middleware для логування підозрілої активності
const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\.\//g, // Directory traversal
    /\/etc\/passwd/g, // System file access
    /\/proc\//g, // Process information
    /cmd\.exe/g, // Windows command execution
    /powershell/g, // PowerShell execution
    /<iframe/gi, // Iframe injection
    /javascript:/gi, // JavaScript protocol
    /vbscript:/gi, // VBScript protocol
  ];
  
  const url = req.url.toLowerCase();
  const userAgent = req.headers['user-agent'] || '';
  
  // Перевіряємо URL на підозрілі паттерни
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      logger.warn(`Suspicious activity detected from IP: ${req.ip}, URL: ${req.url}, User-Agent: ${userAgent}`);
      break;
    }
  }
  
  // Логуємо всі POST/PUT/DELETE запити
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    logger.info(`${req.method} request from IP: ${req.ip} to ${req.url}`);
  }
  
  next();
};

// Middleware для перевірки Content-Type
const contentTypeValidation = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({ error: 'Content-Type заголовок обов\'язковий' });
    }
    
    // Дозволені типи контенту
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ];
    
    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    
    if (!isAllowed) {
      logger.warn(`Invalid Content-Type from IP: ${req.ip}, type: ${contentType}`);
      return res.status(400).json({ error: 'Недопустимий тип контенту' });
    }
  }
  
  next();
};

// Middleware для захисту від брутфорс атак на конкретні ендпоінти
const bruteForceProtection = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = `${req.ip}:${req.url}`;
    const now = Date.now();
    
    // Очищуємо старі записи
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }
    
    const attempt = attempts.get(key);
    
    if (!attempt) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    
    if (attempt.count >= maxAttempts) {
      logger.warn(`Brute force attack detected from IP: ${req.ip} on ${req.url}`);
      return res.status(429).json({ 
        error: 'Забагато невдалих спроб, спробуйте пізніше',
        retryAfter: Math.ceil((attempt.firstAttempt + windowMs - now) / 1000)
      });
    }
    
    attempt.count++;
    next();
  };
};

// Налаштування Helmet для безпеки
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://js.stripe.com"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  inputValidation,
  csrfProtection,
  securityLogger,
  contentTypeValidation,
  bruteForceProtection,
  securityHeaders
};