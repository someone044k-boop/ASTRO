const { query } = require('../database/connection');
const logger = require('../utils/logger');

class Enrollment {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.course_id = data.course_id;
    this.enrolled_at = data.enrolled_at;
    this.completed_at = data.completed_at;
    this.progress_percentage = data.progress_percentage;
  }

  // Запис на курс
  static async create({ user_id, course_id }) {
    try {
      const result = await query(
        `INSERT INTO enrollments (user_id, course_id) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id, course_id) DO NOTHING
         RETURNING *`,
        [user_id, course_id]
      );
      
      if (result.rows.length === 0) {
        // Вже записаний
        return await this.findByUserAndCourse(user_id, course_id);
      }
      
      logger.info(`Користувач ${user_id} записався на курс ${course_id}`);
      return new Enrollment(result.rows[0]);
    } catch (error) {
      logger.error('Помилка запису на курс:', error.message);
      throw error;
    }
  }

  // Пошук запису
  static async findByUserAndCourse(userId, courseId) {
    try {
      const result = await query(
        'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
        [userId, courseId]
      );
      return result.rows.length > 0 ? new Enrollment(result.rows[0]) : null;
    } catch (error) {
      logger.error('Помилка пошуку запису:', error.message);
      throw error;
    }
  }

  // Отримання курсів користувача
  static async findByUserId(userId) {
    try {
      const result = await query(
        `SELECT e.*, c.title, c.level, c.thumbnail_url 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE e.user_id = $1 
         ORDER BY e.enrolled_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Помилка отримання курсів користувача:', error.message);
      throw error;
    }
  }

  // Перевірка чи користувач записаний на курс
  static async isEnrolled(userId, courseId) {
    const enrollment = await this.findByUserAndCourse(userId, courseId);
    return enrollment !== null;
  }

  // Оновлення прогресу
  async updateProgress(percentage) {
    try {
      const completed_at = percentage >= 100 ? 'NOW()' : 'NULL';
      const result = await query(
        `UPDATE enrollments SET 
          progress_percentage = $2,
          completed_at = ${percentage >= 100 ? 'NOW()' : 'NULL'}
         WHERE id = $1 RETURNING *`,
        [this.id, Math.min(100, Math.max(0, percentage))]
      );
      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення прогресу:', error.message);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      course_id: this.course_id,
      enrolled_at: this.enrolled_at,
      completed_at: this.completed_at,
      progress_percentage: this.progress_percentage
    };
  }
}

module.exports = Enrollment;