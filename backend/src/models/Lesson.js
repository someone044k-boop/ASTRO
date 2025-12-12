const { query } = require('../database/connection');
const logger = require('../utils/logger');

class Lesson {
  constructor(data) {
    this.id = data.id;
    this.course_id = data.course_id;
    this.tab_id = data.tab_id;
    this.title = data.title;
    this.content = data.content;
    this.audio_url = data.audio_url;
    this.slides = data.slides;
    this.order_index = data.order_index;
    this.duration_minutes = data.duration_minutes;
    this.created_at = data.created_at;
  }

  // Створення уроку
  static async create({ course_id, tab_id, title, content, audio_url, slides, order_index, duration_minutes }) {
    try {
      const result = await query(
        `INSERT INTO lessons (course_id, tab_id, title, content, audio_url, slides, order_index, duration_minutes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [course_id, tab_id, title, content ? JSON.stringify(content) : null, audio_url, 
         slides ? JSON.stringify(slides) : null, order_index, duration_minutes || 0]
      );
      logger.info(`Створено урок: ${title}`);
      return new Lesson(result.rows[0]);
    } catch (error) {
      logger.error('Помилка створення уроку:', error.message);
      throw error;
    }
  }

  // Пошук за ID
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM lessons WHERE id = $1', [id]);
      return result.rows.length > 0 ? new Lesson(result.rows[0]) : null;
    } catch (error) {
      logger.error('Помилка пошуку уроку:', error.message);
      throw error;
    }
  }

  // Отримання уроків курсу
  static async findByCourseId(courseId) {
    try {
      const result = await query(
        'SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index ASC',
        [courseId]
      );
      return result.rows.map(row => new Lesson(row));
    } catch (error) {
      logger.error('Помилка отримання уроків курсу:', error.message);
      throw error;
    }
  }

  // Отримання уроків вкладки
  static async findByTabId(tabId) {
    try {
      const result = await query(
        'SELECT * FROM lessons WHERE tab_id = $1 ORDER BY order_index ASC',
        [tabId]
      );
      return result.rows.map(row => new Lesson(row));
    } catch (error) {
      logger.error('Помилка отримання уроків вкладки:', error.message);
      throw error;
    }
  }

  // Оновлення уроку
  async update(data) {
    try {
      const result = await query(
        `UPDATE lessons SET 
          title = COALESCE($2, title),
          content = COALESCE($3, content),
          audio_url = COALESCE($4, audio_url),
          slides = COALESCE($5, slides),
          order_index = COALESCE($6, order_index),
          duration_minutes = COALESCE($7, duration_minutes)
         WHERE id = $1 RETURNING *`,
        [this.id, data.title, data.content ? JSON.stringify(data.content) : null, 
         data.audio_url, data.slides ? JSON.stringify(data.slides) : null, 
         data.order_index, data.duration_minutes]
      );
      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення уроку:', error.message);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      course_id: this.course_id,
      tab_id: this.tab_id,
      title: this.title,
      content: this.content,
      audio_url: this.audio_url,
      slides: this.slides,
      order_index: this.order_index,
      duration_minutes: this.duration_minutes
    };
  }
}

module.exports = Lesson;