const { query } = require('../database/connection');
const logger = require('../utils/logger');

class Course {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.level = data.level;
    this.description = data.description;
    this.price = data.price;
    this.thumbnail_url = data.thumbnail_url;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Створення нового курсу
  static async create({ title, level, description, price, thumbnail_url, status = 'active' }) {
    try {
      const result = await query(
        `INSERT INTO courses (title, level, description, price, thumbnail_url, status) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [title, level, description, price, thumbnail_url, status]
      );
      logger.info(`Створено курс: ${title} (рівень ${level})`);
      return new Course(result.rows[0]);
    } catch (error) {
      logger.error('Помилка створення курсу:', error.message);
      throw error;
    }
  }

  // Пошук курсу за ID
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM courses WHERE id = $1', [id]);
      return result.rows.length > 0 ? new Course(result.rows[0]) : null;
    } catch (error) {
      logger.error('Помилка пошуку курсу:', error.message);
      throw error;
    }
  }

  // Пошук курсу за рівнем
  static async findByLevel(level) {
    try {
      const result = await query(
        'SELECT * FROM courses WHERE level = $1 AND status = $2',
        [level, 'active']
      );
      return result.rows.length > 0 ? new Course(result.rows[0]) : null;
    } catch (error) {
      logger.error('Помилка пошуку курсу за рівнем:', error.message);
      throw error;
    }
  }

  // Отримання всіх курсів
  static async findAll({ status = 'active' } = {}) {
    try {
      const result = await query(
        'SELECT * FROM courses WHERE status = $1 ORDER BY level ASC',
        [status]
      );
      return result.rows.map(row => new Course(row));
    } catch (error) {
      logger.error('Помилка отримання курсів:', error.message);
      throw error;
    }
  }

  // Отримання вкладок курсу
  async getTabs() {
    try {
      const result = await query(
        'SELECT * FROM course_tabs WHERE course_id = $1 ORDER BY order_index ASC',
        [this.id]
      );
      return result.rows;
    } catch (error) {
      logger.error('Помилка отримання вкладок курсу:', error.message);
      throw error;
    }
  }

  // Отримання уроків курсу
  async getLessons(tabId = null) {
    try {
      let sql = 'SELECT * FROM lessons WHERE course_id = $1';
      const params = [this.id];
      
      if (tabId) {
        sql += ' AND tab_id = $2';
        params.push(tabId);
      }
      
      sql += ' ORDER BY order_index ASC';
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Помилка отримання уроків:', error.message);
      throw error;
    }
  }

  // Оновлення курсу
  async update(data) {
    try {
      const result = await query(
        `UPDATE courses SET 
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          price = COALESCE($4, price),
          thumbnail_url = COALESCE($5, thumbnail_url),
          status = COALESCE($6, status),
          updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [this.id, data.title, data.description, data.price, data.thumbnail_url, data.status]
      );
      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення курсу:', error.message);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      level: this.level,
      description: this.description,
      price: this.price,
      thumbnail_url: this.thumbnail_url,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Course;