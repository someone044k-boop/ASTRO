const { query } = require('../database/connection');
const logger = require('../utils/logger');

/**
 * Модель для відстеження прогресу проходження уроків
 */
class LessonProgress {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.lesson_id = data.lesson_id;
    this.course_id = data.course_id;
    this.completed_at = data.completed_at;
    this.time_spent_minutes = data.time_spent_minutes;
    this.progress_percentage = data.progress_percentage;
    this.last_position = data.last_position; // Позиція в уроці (слайд, час аудіо)
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Створення або оновлення прогресу уроку
   */
  static async createOrUpdate({ user_id, lesson_id, course_id, progress_percentage, time_spent_minutes = 0, last_position = null }) {
    try {
      const result = await query(
        `INSERT INTO lesson_progress (user_id, lesson_id, course_id, progress_percentage, time_spent_minutes, last_position)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, lesson_id) 
         DO UPDATE SET 
           progress_percentage = GREATEST(lesson_progress.progress_percentage, EXCLUDED.progress_percentage),
           time_spent_minutes = lesson_progress.time_spent_minutes + EXCLUDED.time_spent_minutes,
           last_position = COALESCE(EXCLUDED.last_position, lesson_progress.last_position),
           completed_at = CASE 
             WHEN EXCLUDED.progress_percentage >= 100 THEN NOW() 
             ELSE lesson_progress.completed_at 
           END,
           updated_at = NOW()
         RETURNING *`,
        [user_id, lesson_id, course_id, progress_percentage, time_spent_minutes, last_position ? JSON.stringify(last_position) : null]
      );

      logger.info(`Оновлено прогрес уроку ${lesson_id} для користувача ${user_id}: ${progress_percentage}%`);
      return new LessonProgress(result.rows[0]);
    } catch (error) {
      logger.error('Помилка оновлення прогресу уроку:', error.message);
      throw error;
    }
  }

  /**
   * Отримання прогресу конкретного уроку для користувача
   */
  static async findByUserAndLesson(userId, lessonId) {
    try {
      const result = await query(
        'SELECT * FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2',
        [userId, lessonId]
      );
      return result.rows.length > 0 ? new LessonProgress(result.rows[0]) : null;
    } catch (error) {
      logger.error('Помилка пошуку прогресу уроку:', error.message);
      throw error;
    }
  }

  /**
   * Отримання прогресу всіх уроків курсу для користувача
   */
  static async findByCourseAndUser(courseId, userId) {
    try {
      const result = await query(
        `SELECT lp.*, l.title as lesson_title, l.order_index
         FROM lesson_progress lp
         JOIN lessons l ON lp.lesson_id = l.id
         WHERE lp.course_id = $1 AND lp.user_id = $2
         ORDER BY l.order_index ASC`,
        [courseId, userId]
      );
      return result.rows.map(row => new LessonProgress(row));
    } catch (error) {
      logger.error('Помилка отримання прогресу курсу:', error.message);
      throw error;
    }
  }

  /**
   * Отримання загального прогресу курсу для користувача
   */
  static async getCourseProgress(courseId, userId) {
    try {
      const result = await query(
        `SELECT 
           COUNT(l.id) as total_lessons,
           COUNT(lp.id) as started_lessons,
           COUNT(CASE WHEN lp.progress_percentage >= 100 THEN 1 END) as completed_lessons,
           COALESCE(AVG(lp.progress_percentage), 0) as average_progress,
           SUM(COALESCE(lp.time_spent_minutes, 0)) as total_time_spent
         FROM lessons l
         LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = $2
         WHERE l.course_id = $1`,
        [courseId, userId]
      );

      const stats = result.rows[0];
      return {
        total_lessons: parseInt(stats.total_lessons),
        started_lessons: parseInt(stats.started_lessons),
        completed_lessons: parseInt(stats.completed_lessons),
        average_progress: parseFloat(stats.average_progress).toFixed(2),
        total_time_spent: parseInt(stats.total_time_spent),
        completion_percentage: stats.total_lessons > 0 
          ? ((stats.completed_lessons / stats.total_lessons) * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      logger.error('Помилка обчислення прогресу курсу:', error.message);
      throw error;
    }
  }

  /**
   * Позначення уроку як завершеного
   */
  async markAsCompleted() {
    try {
      const result = await query(
        `UPDATE lesson_progress SET 
           progress_percentage = 100,
           completed_at = NOW(),
           updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [this.id]
      );
      
      Object.assign(this, result.rows[0]);
      logger.info(`Урок ${this.lesson_id} позначено як завершений для користувача ${this.user_id}`);
      return this;
    } catch (error) {
      logger.error('Помилка позначення уроку як завершеного:', error.message);
      throw error;
    }
  }

  /**
   * Отримання статистики навчання користувача
   */
  static async getUserLearningStats(userId) {
    try {
      const result = await query(
        `SELECT 
           COUNT(DISTINCT lp.course_id) as enrolled_courses,
           COUNT(lp.id) as total_lessons_started,
           COUNT(CASE WHEN lp.progress_percentage >= 100 THEN 1 END) as total_lessons_completed,
           SUM(lp.time_spent_minutes) as total_learning_time,
           AVG(lp.progress_percentage) as average_lesson_progress
         FROM lesson_progress lp
         WHERE lp.user_id = $1`,
        [userId]
      );

      const stats = result.rows[0];
      return {
        enrolled_courses: parseInt(stats.enrolled_courses) || 0,
        total_lessons_started: parseInt(stats.total_lessons_started) || 0,
        total_lessons_completed: parseInt(stats.total_lessons_completed) || 0,
        total_learning_time: parseInt(stats.total_learning_time) || 0,
        average_lesson_progress: parseFloat(stats.average_lesson_progress) || 0,
        completion_rate: stats.total_lessons_started > 0 
          ? ((stats.total_lessons_completed / stats.total_lessons_started) * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      logger.error('Помилка отримання статистики навчання:', error.message);
      throw error;
    }
  }

  /**
   * Отримання останніх активностей користувача
   */
  static async getRecentActivity(userId, limit = 10) {
    try {
      const result = await query(
        `SELECT lp.*, l.title as lesson_title, c.title as course_title, c.level
         FROM lesson_progress lp
         JOIN lessons l ON lp.lesson_id = l.id
         JOIN courses c ON lp.course_id = c.id
         WHERE lp.user_id = $1
         ORDER BY lp.updated_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows.map(row => ({
        ...new LessonProgress(row).toJSON(),
        lesson_title: row.lesson_title,
        course_title: row.course_title,
        course_level: row.level
      }));
    } catch (error) {
      logger.error('Помилка отримання останніх активностей:', error.message);
      throw error;
    }
  }

  /**
   * Перевірка чи урок завершено
   */
  isCompleted() {
    return this.progress_percentage >= 100 && this.completed_at !== null;
  }

  /**
   * Отримання часу навчання у форматованому вигляді
   */
  getFormattedTimeSpent() {
    const hours = Math.floor(this.time_spent_minutes / 60);
    const minutes = this.time_spent_minutes % 60;
    
    if (hours > 0) {
      return `${hours}г ${minutes}хв`;
    }
    return `${minutes}хв`;
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      lesson_id: this.lesson_id,
      course_id: this.course_id,
      completed_at: this.completed_at,
      time_spent_minutes: this.time_spent_minutes,
      progress_percentage: this.progress_percentage,
      last_position: this.last_position,
      created_at: this.created_at,
      updated_at: this.updated_at,
      is_completed: this.isCompleted(),
      formatted_time_spent: this.getFormattedTimeSpent()
    };
  }
}

module.exports = LessonProgress;