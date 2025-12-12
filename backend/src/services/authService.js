const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../database/connection');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    // Use test secret in test environment
    this.jwtSecret = process.env.NODE_ENV === 'test' 
      ? 'test-secret-key-for-testing' 
      : (process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  // Генерація access токена
  generateAccessToken(user) {
    try {
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'access'
      };

      return jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'learning-school',
        audience: 'learning-school-users'
      });
    } catch (error) {
      logger.error('Помилка генерації access токена:', error.message);
      throw new Error('Не вдалося згенерувати токен доступу');
    }
  }

  // Генерація refresh токена
  generateRefreshToken() {
    try {
      // Генеруємо випадковий токен
      const randomBytes = crypto.randomBytes(64);
      return randomBytes.toString('hex');
    } catch (error) {
      logger.error('Помилка генерації refresh токена:', error.message);
      throw new Error('Не вдалося згенерувати токен оновлення');
    }
  }

  // Збереження refresh токена в базі даних
  async saveRefreshToken(userId, refreshToken) {
    try {
      // Видаляємо старі токени користувача
      await query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [userId]
      );

      // Розраховуємо дату закінчення терміну дії
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 днів

      // Зберігаємо новий токен
      await query(
        `INSERT INTO user_sessions (user_id, refresh_token, expires_at) 
         VALUES ($1, $2, $3)`,
        [userId, refreshToken, expiresAt]
      );

      logger.info(`Збережено refresh токен для користувача: ${userId}`);
    } catch (error) {
      logger.error('Помилка збереження refresh токена:', error.message);
      throw new Error('Не вдалося зберегти токен оновлення');
    }
  }

  // Перевірка access токена
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'learning-school',
        audience: 'learning-school-users'
      });

      if (decoded.type !== 'access') {
        throw new Error('Невірний тип токена');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Токен доступу закінчився');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Невірний токен доступу');
      }
      
      logger.error('Помилка перевірки access токена:', error.message);
      throw new Error('Не вдалося перевірити токен доступу');
    }
  }

  // Перевірка refresh токена
  async verifyRefreshToken(refreshToken) {
    try {
      const result = await query(
        `SELECT us.user_id, us.expires_at, u.email, u.role 
         FROM user_sessions us
         JOIN users u ON us.user_id = u.id
         WHERE us.refresh_token = $1 AND us.expires_at > NOW()`,
        [refreshToken]
      );

      if (result.rows.length === 0) {
        throw new Error('Невірний або закінчений токен оновлення');
      }

      const session = result.rows[0];

      // Оновлюємо час останнього використання
      await query(
        'UPDATE user_sessions SET last_used_at = NOW() WHERE refresh_token = $1',
        [refreshToken]
      );

      return {
        userId: session.user_id,
        email: session.email,
        role: session.role
      };
    } catch (error) {
      logger.error('Помилка перевірки refresh токена:', error.message);
      throw error;
    }
  }

  // Видалення refresh токена (logout)
  async revokeRefreshToken(refreshToken) {
    try {
      const result = await query(
        'DELETE FROM user_sessions WHERE refresh_token = $1 RETURNING user_id',
        [refreshToken]
      );

      if (result.rows.length > 0) {
        logger.info(`Видалено refresh токен для користувача: ${result.rows[0].user_id}`);
      }

      return true;
    } catch (error) {
      logger.error('Помилка видалення refresh токена:', error.message);
      throw new Error('Не вдалося видалити токен оновлення');
    }
  }

  // Видалення всіх токенів користувача
  async revokeAllUserTokens(userId) {
    try {
      await query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [userId]
      );

      logger.info(`Видалено всі токени для користувача: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Помилка видалення всіх токенів користувача:', error.message);
      throw new Error('Не вдалося видалити токени користувача');
    }
  }

  // Очищення закінчених токенів
  async cleanupExpiredTokens() {
    try {
      const result = await query(
        'DELETE FROM user_sessions WHERE expires_at <= NOW() RETURNING COUNT(*)'
      );

      const deletedCount = result.rows[0]?.count || 0;
      if (deletedCount > 0) {
        logger.info(`Очищено ${deletedCount} закінчених токенів`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Помилка очищення закінчених токенів:', error.message);
      throw error;
    }
  }

  // Генерація пари токенів
  async generateTokenPair(user) {
    try {
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken();

      await this.saveRefreshToken(user.id, refreshToken);

      return {
        accessToken,
        refreshToken,
        expiresIn: this.accessTokenExpiry
      };
    } catch (error) {
      logger.error('Помилка генерації пари токенів:', error.message);
      throw error;
    }
  }

  // Оновлення токенів
  async refreshTokens(refreshToken) {
    try {
      // Перевіряємо refresh токен
      const tokenData = await this.verifyRefreshToken(refreshToken);

      // Створюємо об'єкт користувача для генерації нового access токена
      const user = {
        id: tokenData.userId,
        email: tokenData.email,
        role: tokenData.role
      };

      // Генеруємо нову пару токенів
      const newTokens = await this.generateTokenPair(user);

      logger.info(`Оновлено токени для користувача: ${user.email}`);
      return newTokens;
    } catch (error) {
      logger.error('Помилка оновлення токенів:', error.message);
      throw error;
    }
  }
}

// Створюємо єдиний екземпляр сервісу
const authService = new AuthService();

// Запускаємо очищення закінчених токенів кожні 24 години
setInterval(async () => {
  try {
    await authService.cleanupExpiredTokens();
  } catch (error) {
    logger.error('Помилка автоматичного очищення токенів:', error.message);
  }
}, 24 * 60 * 60 * 1000); // 24 години

module.exports = authService;