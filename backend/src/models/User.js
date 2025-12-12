const bcrypt = require('bcryptjs');
const { query } = require('../database/connection');
const logger = require('../utils/logger');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.phone = userData.phone;
    this.avatar_url = userData.avatar_url;
    this.role = userData.role;
    this.email_verified = userData.email_verified;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  // Створення нового користувача
  static async create({ email, password, phone = null, role = 'student' }) {
    try {
      // Перевірка чи користувач вже існує
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new Error('Користувач з такою електронною поштою вже існує');
      }

      // Хешування пароля
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Створення користувача в базі даних
      const result = await query(
        `INSERT INTO users (email, password_hash, phone, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, phone, avatar_url, role, email_verified, created_at, updated_at`,
        [email, password_hash, phone, role]
      );

      logger.info(`Створено нового користувача: ${email}`);
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Помилка створення користувача:', error.message);
      throw error;
    }
  }

  // Пошук користувача за email
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT id, email, password_hash, phone, avatar_url, role, email_verified, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const userData = result.rows[0];
      const user = new User(userData);
      user.password_hash = userData.password_hash; // Зберігаємо хеш для перевірки пароля
      return user;
    } catch (error) {
      logger.error('Помилка пошуку користувача за email:', error.message);
      throw error;
    }
  }

  // Пошук користувача за ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT id, email, phone, avatar_url, role, email_verified, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Помилка пошуку користувача за ID:', error.message);
      throw error;
    }
  }

  // Перевірка пароля
  async validatePassword(password) {
    try {
      if (!this.password_hash) {
        throw new Error('Хеш пароля не завантажено');
      }
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      logger.error('Помилка перевірки пароля:', error.message);
      throw error;
    }
  }

  // Оновлення профілю користувача
  async updateProfile({ phone, avatar_url }) {
    try {
      const result = await query(
        `UPDATE users 
         SET phone = COALESCE($2, phone), 
             avatar_url = COALESCE($3, avatar_url),
             updated_at = NOW()
         WHERE id = $1 
         RETURNING id, email, phone, avatar_url, role, email_verified, created_at, updated_at`,
        [this.id, phone, avatar_url]
      );

      if (result.rows.length === 0) {
        throw new Error('Користувача не знайдено');
      }

      // Оновлюємо поточний об'єкт
      const updatedData = result.rows[0];
      Object.assign(this, updatedData);

      logger.info(`Оновлено профіль користувача: ${this.email}`);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення профілю:', error.message);
      throw error;
    }
  }

  // Зміна пароля
  async changePassword(currentPassword, newPassword) {
    try {
      // Перевірка поточного пароля
      const isCurrentPasswordValid = await this.validatePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Поточний пароль невірний');
      }

      // Хешування нового пароля
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Оновлення пароля в базі даних
      await query(
        'UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1',
        [this.id, newPasswordHash]
      );

      logger.info(`Змінено пароль для користувача: ${this.email}`);
      return true;
    } catch (error) {
      logger.error('Помилка зміни пароля:', error.message);
      throw error;
    }
  }

  // Підтвердження email
  async verifyEmail() {
    try {
      await query(
        'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1',
        [this.id]
      );

      this.email_verified = true;
      logger.info(`Підтверджено email для користувача: ${this.email}`);
      return true;
    } catch (error) {
      logger.error('Помилка підтвердження email:', error.message);
      throw error;
    }
  }

  // Отримання публічних даних користувача (без чутливої інформації)
  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      phone: this.phone,
      avatar_url: this.avatar_url,
      role: this.role,
      email_verified: this.email_verified,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Перевірка ролі користувача
  hasRole(role) {
    return this.role === role;
  }

  // Перевірка чи користувач є адміністратором
  isAdmin() {
    return this.role === 'admin';
  }

  // Перевірка чи користувач є викладачем
  isTeacher() {
    return this.role === 'teacher' || this.role === 'admin';
  }
}

module.exports = User;