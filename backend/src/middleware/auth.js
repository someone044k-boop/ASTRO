const authService = require('../services/authService');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware для перевірки аутентифікації
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Токен доступу не надано',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: 'Невірний формат токена',
        code: 'AUTH_TOKEN_INVALID_FORMAT'
      });
    }

    // Перевіряємо токен
    const decoded = authService.verifyAccessToken(token);
    
    // Завантажуємо користувача з бази даних
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Користувача не знайдено',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }

    // Додаємо користувача до запиту
    req.user = user;
    req.tokenData = decoded;

    next();
  } catch (error) {
    logger.error('Помилка аутентифікації:', error.message);
    
    if (error.message.includes('закінчився')) {
      return res.status(401).json({
        error: 'Токен доступу закінчився',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }
    
    if (error.message.includes('Невірний')) {
      return res.status(401).json({
        error: 'Невірний токен доступу',
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    return res.status(401).json({
      error: 'Помилка аутентифікації',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware для перевірки ролей
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Аутентифікація обов\'язкова',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Спроба доступу без прав: користувач ${req.user.email} (роль: ${req.user.role}) до ресурсу що потребує ролі: ${roles.join(', ')}`);
      
      return res.status(403).json({
        error: 'Недостатньо прав доступу',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        required_roles: roles,
        user_role: req.user.role
      });
    }

    next();
  };
};

// Middleware для перевірки чи користувач є адміністратором
const requireAdmin = requireRole('admin');

// Middleware для перевірки чи користувач є викладачем або адміністратором
const requireTeacher = requireRole('teacher', 'admin');

// Middleware для перевірки чи користувач є власником ресурсу або адміністратором
const requireOwnershipOrAdmin = (getUserIdFromRequest) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Аутентифікація обов\'язкова',
        code: 'AUTH_REQUIRED'
      });
    }

    // Адміністратор має доступ до всього
    if (req.user.role === 'admin') {
      return next();
    }

    // Отримуємо ID користувача з запиту
    const resourceUserId = getUserIdFromRequest(req);
    
    if (!resourceUserId) {
      return res.status(400).json({
        error: 'Не вдалося визначити власника ресурсу',
        code: 'OWNERSHIP_CHECK_FAILED'
      });
    }

    // Перевіряємо чи користувач є власником ресурсу
    if (req.user.id !== resourceUserId) {
      logger.warn(`Спроба доступу до чужого ресурсу: користувач ${req.user.email} до ресурсу користувача ${resourceUserId}`);
      
      return res.status(403).json({
        error: 'Доступ заборонено: ви можете керувати лише своїми ресурсами',
        code: 'AUTH_OWNERSHIP_REQUIRED'
      });
    }

    next();
  };
};

// Middleware для опціональної аутентифікації (не обов'язкової)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Продовжуємо без аутентифікації
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next(); // Продовжуємо без аутентифікації
    }

    // Намагаємося перевірити токен
    const decoded = authService.verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = user;
      req.tokenData = decoded;
    }

    next();
  } catch (error) {
    // Ігноруємо помилки аутентифікації для опціональної авторизації
    logger.debug('Опціональна аутентифікація не вдалася:', error.message);
    next();
  }
};

// Middleware для перевірки підтвердження email
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Аутентифікація обов\'язкова',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      error: 'Підтвердження електронної пошти обов\'язкове',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireTeacher,
  requireOwnershipOrAdmin,
  optionalAuth,
  requireEmailVerification
};