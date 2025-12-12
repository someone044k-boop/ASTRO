const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');
const authService = require('../services/authService');
const { authenticateToken, requireEmailVerification } = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validatePasswordChange,
  validateProfileUpdate,
  handleValidationErrors
} = require('../validators/authValidators');
const logger = require('../utils/logger');

// Реєстрація нового користувача
router.post('/register', 
  validateRegistration,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password, phone, role } = req.body;

    try {
      // Створюємо нового користувача
      const user = await User.create({
        email,
        password,
        phone,
        role: role || 'student'
      });

      // Генеруємо токени
      const tokens = await authService.generateTokenPair(user);

      logger.info(`Успішна реєстрація користувача: ${email}`);

      res.status(201).json({
        message: 'Користувача успішно зареєстровано',
        user: user.toPublicJSON(),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      });
    } catch (error) {
      if (error.message.includes('вже існує')) {
        return res.status(409).json({
          error: error.message,
          code: 'USER_ALREADY_EXISTS'
        });
      }

      logger.error('Помилка реєстрації:', error.message);
      res.status(500).json({
        error: 'Помилка створення користувача',
        code: 'REGISTRATION_ERROR'
      });
    }
  })
);

// Вхід користувача
router.post('/login',
  validateLogin,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    try {
      // Знаходимо користувача
      const user = await User.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({
          error: 'Невірна електронна пошта або пароль',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Перевіряємо пароль
      const isPasswordValid = await user.validatePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Невірна електронна пошта або пароль',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Генеруємо токени
      const tokens = await authService.generateTokenPair(user);

      logger.info(`Успішний вхід користувача: ${email}`);

      res.json({
        message: 'Успішний вхід',
        user: user.toPublicJSON(),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      });
    } catch (error) {
      logger.error('Помилка входу:', error.message);
      res.status(500).json({
        error: 'Помилка аутентифікації',
        code: 'LOGIN_ERROR'
      });
    }
  })
);

// Вихід користувача
router.post('/logout',
  validateRefreshToken,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    try {
      await authService.revokeRefreshToken(refreshToken);

      logger.info('Користувач успішно вийшов з системи');

      res.json({
        message: 'Успішний вихід з системи'
      });
    } catch (error) {
      logger.error('Помилка виходу:', error.message);
      res.status(500).json({
        error: 'Помилка виходу з системи',
        code: 'LOGOUT_ERROR'
      });
    }
  })
);

// Оновлення токенів
router.post('/refresh',
  validateRefreshToken,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    try {
      const newTokens = await authService.refreshTokens(refreshToken);

      res.json({
        message: 'Токени успішно оновлено',
        tokens: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: newTokens.expiresIn
        }
      });
    } catch (error) {
      logger.error('Помилка оновлення токенів:', error.message);
      
      if (error.message.includes('Невірний') || error.message.includes('закінчений')) {
        return res.status(401).json({
          error: error.message,
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      res.status(500).json({
        error: 'Помилка оновлення токенів',
        code: 'REFRESH_ERROR'
      });
    }
  })
);

// Отримання профілю поточного користувача
router.get('/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    res.json({
      user: req.user.toPublicJSON()
    });
  })
);

// Оновлення профілю користувача
router.put('/profile',
  authenticateToken,
  validateProfileUpdate,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { phone, avatar_url } = req.body;

    try {
      const updatedUser = await req.user.updateProfile({
        phone,
        avatar_url
      });

      res.json({
        message: 'Профіль успішно оновлено',
        user: updatedUser.toPublicJSON()
      });
    } catch (error) {
      logger.error('Помилка оновлення профілю:', error.message);
      res.status(500).json({
        error: 'Помилка оновлення профілю',
        code: 'PROFILE_UPDATE_ERROR'
      });
    }
  })
);

// Зміна пароля
router.put('/password',
  authenticateToken,
  validatePasswordChange,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
      await req.user.changePassword(currentPassword, newPassword);

      // Видаляємо всі токени користувача для безпеки
      await authService.revokeAllUserTokens(req.user.id);

      res.json({
        message: 'Пароль успішно змінено. Будь ласка, увійдіть знову.'
      });
    } catch (error) {
      logger.error('Помилка зміни пароля:', error.message);
      
      if (error.message.includes('невірний')) {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      res.status(500).json({
        error: 'Помилка зміни пароля',
        code: 'PASSWORD_CHANGE_ERROR'
      });
    }
  })
);

// Перевірка статусу аутентифікації
router.get('/status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    res.json({
      authenticated: true,
      user: req.user.toPublicJSON(),
      tokenData: {
        userId: req.tokenData.userId,
        email: req.tokenData.email,
        role: req.tokenData.role,
        iat: req.tokenData.iat,
        exp: req.tokenData.exp
      }
    });
  })
);

// Вихід з усіх пристроїв
router.post('/logout-all',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      await authService.revokeAllUserTokens(req.user.id);

      logger.info(`Користувач ${req.user.email} вийшов з усіх пристроїв`);

      res.json({
        message: 'Успішний вихід з усіх пристроїв'
      });
    } catch (error) {
      logger.error('Помилка виходу з усіх пристроїв:', error.message);
      res.status(500).json({
        error: 'Помилка виходу з усіх пристроїв',
        code: 'LOGOUT_ALL_ERROR'
      });
    }
  })
);

module.exports = router;