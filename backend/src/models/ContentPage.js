const { query } = require('../database/connection');
const logger = require('../utils/logger');

class ContentPage {
  constructor(pageData) {
    this.id = pageData.id;
    this.slug = pageData.slug;
    this.title = pageData.title;
    this.content = pageData.content;
    this.meta_data = pageData.meta_data;
    this.parent_id = pageData.parent_id;
    this.order_index = pageData.order_index;
    this.status = pageData.status;
    this.created_at = pageData.created_at;
    this.updated_at = pageData.updated_at;
  }

  // Створення нової сторінки контенту
  static async create({ slug, title, content, meta_data = null, parent_id = null, order_index = null, status = 'published' }) {
    try {
      // Перевірка чи сторінка з таким slug вже існує
      const existingPage = await this.findBySlug(slug);
      if (existingPage) {
        throw new Error(`Сторінка з slug "${slug}" вже існує`);
      }

      // Створення сторінки в базі даних
      const result = await query(
        `INSERT INTO content_pages (slug, title, content, meta_data, parent_id, order_index, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, slug, title, content, meta_data, parent_id, order_index, status, created_at, updated_at`,
        [slug, title, JSON.stringify(content), meta_data ? JSON.stringify(meta_data) : null, parent_id, order_index, status]
      );

      logger.info(`Створено нову сторінку контенту: ${slug}`);
      return new ContentPage(result.rows[0]);
    } catch (error) {
      logger.error('Помилка створення сторінки контенту:', error.message);
      throw error;
    }
  }

  // Пошук сторінки за slug
  static async findBySlug(slug) {
    try {
      const result = await query(
        'SELECT * FROM content_pages WHERE slug = $1 AND status != $2',
        [slug, 'archived']
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new ContentPage(result.rows[0]);
    } catch (error) {
      logger.error('Помилка пошуку сторінки за slug:', error.message);
      throw error;
    }
  }

  // Пошук сторінки за ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM content_pages WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new ContentPage(result.rows[0]);
    } catch (error) {
      logger.error('Помилка пошуку сторінки за ID:', error.message);
      throw error;
    }
  }

  // Отримання всіх сторінок з можливістю фільтрації
  static async findAll({ status = null, parent_id = null, limit = 50, offset = 0 } = {}) {
    try {
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;

      if (status) {
        whereConditions.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (parent_id !== null) {
        if (parent_id === 'null') {
          whereConditions.push('parent_id IS NULL');
        } else {
          whereConditions.push(`parent_id = $${paramIndex}`);
          params.push(parent_id);
          paramIndex++;
        }
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      params.push(limit, offset);
      
      const result = await query(
        `SELECT * FROM content_pages 
         ${whereClause}
         ORDER BY order_index ASC, created_at DESC 
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
      );

      return result.rows.map(row => new ContentPage(row));
    } catch (error) {
      logger.error('Помилка отримання списку сторінок:', error.message);
      throw error;
    }
  }

  // Отримання дочірніх сторінок
  async getChildren() {
    try {
      const result = await query(
        'SELECT * FROM content_pages WHERE parent_id = $1 AND status != $2 ORDER BY order_index ASC, title ASC',
        [this.id, 'archived']
      );

      return result.rows.map(row => new ContentPage(row));
    } catch (error) {
      logger.error('Помилка отримання дочірніх сторінок:', error.message);
      throw error;
    }
  }

  // Оновлення сторінки
  async update({ title, content, meta_data, parent_id, order_index, status }) {
    try {
      const result = await query(
        `UPDATE content_pages 
         SET title = COALESCE($2, title),
             content = COALESCE($3, content),
             meta_data = COALESCE($4, meta_data),
             parent_id = COALESCE($5, parent_id),
             order_index = COALESCE($6, order_index),
             status = COALESCE($7, status),
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [
          this.id, 
          title, 
          content ? JSON.stringify(content) : null,
          meta_data ? JSON.stringify(meta_data) : null,
          parent_id,
          order_index,
          status
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Сторінку не знайдено');
      }

      // Оновлюємо поточний об'єкт
      const updatedData = result.rows[0];
      Object.assign(this, updatedData);

      logger.info(`Оновлено сторінку контенту: ${this.slug}`);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення сторінки:', error.message);
      throw error;
    }
  }

  // Видалення сторінки (м'яке видалення - архівування)
  async delete() {
    try {
      await query(
        'UPDATE content_pages SET status = $2, updated_at = NOW() WHERE id = $1',
        [this.id, 'archived']
      );

      this.status = 'archived';
      logger.info(`Архівовано сторінку контенту: ${this.slug}`);
      return true;
    } catch (error) {
      logger.error('Помилка видалення сторінки:', error.message);
      throw error;
    }
  }

  // Жорстке видалення сторінки
  async hardDelete() {
    try {
      await query('DELETE FROM content_pages WHERE id = $1', [this.id]);
      logger.info(`Видалено сторінку контенту: ${this.slug}`);
      return true;
    } catch (error) {
      logger.error('Помилка жорсткого видалення сторінки:', error.message);
      throw error;
    }
  }

  // Пошук сторінок за текстом
  static async search(searchTerm, { limit = 20, offset = 0 } = {}) {
    try {
      const result = await query(
        `SELECT *, 
         ts_rank(to_tsvector('english', title || ' ' || content::text), plainto_tsquery('english', $1)) as rank
         FROM content_pages 
         WHERE (to_tsvector('english', title || ' ' || content::text) @@ plainto_tsquery('english', $1)
                OR title ILIKE $2 OR slug ILIKE $2)
               AND status = 'published'
         ORDER BY rank DESC, created_at DESC
         LIMIT $3 OFFSET $4`,
        [searchTerm, `%${searchTerm}%`, limit, offset]
      );

      return result.rows.map(row => new ContentPage(row));
    } catch (error) {
      logger.error('Помилка пошуку сторінок:', error.message);
      throw error;
    }
  }

  // Отримання навігаційного меню
  static async getNavigationMenu() {
    try {
      const result = await query(
        `WITH RECURSIVE menu_tree AS (
          SELECT *, 0 as level, ARRAY[order_index] as path
          FROM content_pages 
          WHERE parent_id IS NULL AND status = 'published'
          
          UNION ALL
          
          SELECT cp.*, mt.level + 1, mt.path || cp.order_index
          FROM content_pages cp
          JOIN menu_tree mt ON cp.parent_id = mt.id
          WHERE cp.status = 'published' AND mt.level < 3
        )
        SELECT * FROM menu_tree 
        ORDER BY path`,
        []
      );

      return result.rows.map(row => new ContentPage(row));
    } catch (error) {
      logger.error('Помилка отримання навігаційного меню:', error.message);
      throw error;
    }
  }

  // Валідація контенту
  validateContent() {
    if (!this.content || typeof this.content !== 'object') {
      throw new Error('Контент повинен бути валідним JSON об\'єктом');
    }

    if (!this.content.blocks || !Array.isArray(this.content.blocks)) {
      throw new Error('Контент повинен містити масив блоків');
    }

    // Валідація кожного блоку
    for (const block of this.content.blocks) {
      if (!block.type) {
        throw new Error('Кожен блок повинен мати тип');
      }

      if (!['text', 'image', 'video', 'audio', 'gallery', 'social', 'telegram', 'youtube', 'faq', 'hero'].includes(block.type)) {
        throw new Error(`Невідомий тип блоку: ${block.type}`);
      }
    }

    return true;
  }

  // Отримання публічних даних сторінки
  toPublicJSON() {
    return {
      id: this.id,
      slug: this.slug,
      title: this.title,
      content: this.content,
      meta_data: this.meta_data,
      parent_id: this.parent_id,
      order_index: this.order_index,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Отримання мета-даних для SEO
  getMetaData() {
    const defaultMeta = {
      description: this.title,
      keywords: [],
      og_title: this.title,
      og_description: this.title,
      og_image: null
    };

    return { ...defaultMeta, ...this.meta_data };
  }
}

module.exports = ContentPage;