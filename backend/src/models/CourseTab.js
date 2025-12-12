const { query } = require('../database/connection');
const logger = require('../utils/logger');

class CourseTab {
  constructor(data) {
    this.id = data.id;
    this.course_id = data.course_id;
    this.name = data.name;
    this.type = data.type;
    this.content = data.content;
    this.order_index = data.order_index;
    this.created_at = data.created_at;
  }

  // Створення вкладки
  static async create({ course_id, name, type, content, order_index }) {
    try {
      const result = await query(
        `INSERT INTO course_tabs (course_id, name, type, content, order_index) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [course_id, name, type, content ? JSON.stringify(content) : null, order_index]
      );
      logger.info(`Створено вкладку: ${name} для курсу ${course_id}`);
      return new CourseTab(result.rows[0]);
    } catch (error) {
      logger.error('Помилка створення вкладки:', error.message);
      throw error;
    }
  }

  // Пошук за ID
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM course_tabs WHERE id = $1', [id]);
      return result.rows.length > 0 ? new CourseTab(result.rows[0]) : null;
    } catch (error) {
      logger.error('Помилка пошуку вкладки:', error.message);
      throw error;
    }
  }

  // Отримання вкладок курсу
  static async findByCourseId(courseId) {
    try {
      const result = await query(
        'SELECT * FROM course_tabs WHERE course_id = $1 ORDER BY order_index ASC',
        [courseId]
      );
      return result.rows.map(row => new CourseTab(row));
    } catch (error) {
      logger.error('Помилка отримання вкладок:', error.message);
      throw error;
    }
  }

  // Отримання уроків вкладки
  async getLessons() {
    try {
      const result = await query(
        'SELECT * FROM lessons WHERE tab_id = $1 ORDER BY order_index ASC',
        [this.id]
      );
      return result.rows;
    } catch (error) {
      logger.error('Помилка отримання уроків вкладки:', error.message);
      throw error;
    }
  }

  // Оновлення вкладки
  async update(data) {
    try {
      const result = await query(
        `UPDATE course_tabs SET 
          name = COALESCE($2, name),
          content = COALESCE($3, content),
          order_index = COALESCE($4, order_index)
         WHERE id = $1 RETURNING *`,
        [this.id, data.name, data.content ? JSON.stringify(data.content) : null, data.order_index]
      );
      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення вкладки:', error.message);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      course_id: this.course_id,
      name: this.name,
      type: this.type,
      content: this.content,
      order_index: this.order_index
    };
  }
}

module.exports = CourseTab;