const { query } = require('../database/connection');
const logger = require('../utils/logger');

class Product {
  constructor(productData) {
    this.id = productData.id;
    this.name = productData.name;
    this.description = productData.description;
    this.price = productData.price;
    this.category = productData.category;
    this.images = productData.images;
    this.inventory_count = productData.inventory_count;
    this.status = productData.status;
    this.created_at = productData.created_at;
    this.updated_at = productData.updated_at;
  }

  // Створення нового товару
  static async create({ name, description, price, category, images = [], inventory_count = 0 }) {
    try {
      const result = await query(
        `INSERT INTO products (name, description, price, category, images, inventory_count) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [name, description, price, category, JSON.stringify(images), inventory_count]
      );

      logger.info(`Створено новий товар: ${name}`);
      return new Product(result.rows[0]);
    } catch (error) {
      logger.error('Помилка створення товару:', error.message);
      throw error;
    }
  }

  // Отримання всіх товарів з фільтрацією
  static async findAll({ category, status = 'active', limit = 50, offset = 0 } = {}) {
    try {
      let queryText = 'SELECT * FROM products WHERE status = $1';
      let params = [status];
      let paramIndex = 2;

      if (category) {
        queryText += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows.map(row => new Product(row));
    } catch (error) {
      logger.error('Помилка отримання товарів:', error.message);
      throw error;
    }
  }

  // Отримання товару за ID
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM products WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new Product(result.rows[0]);
    } catch (error) {
      logger.error('Помилка пошуку товару за ID:', error.message);
      throw error;
    }
  }

  // Отримання товарів за категорією
  static async findByCategory(category) {
    try {
      const result = await query(
        'SELECT * FROM products WHERE category = $1 AND status = $2 ORDER BY created_at DESC',
        [category, 'active']
      );
      
      return result.rows.map(row => new Product(row));
    } catch (error) {
      logger.error('Помилка пошуку товарів за категорією:', error.message);
      throw error;
    }
  }

  // Отримання всіх категорій
  static async getCategories() {
    try {
      const result = await query(
        'SELECT DISTINCT category FROM products WHERE status = $1 AND category IS NOT NULL ORDER BY category',
        ['active']
      );
      
      return result.rows.map(row => row.category);
    } catch (error) {
      logger.error('Помилка отримання категорій:', error.message);
      throw error;
    }
  }

  // Оновлення товару
  async update({ name, description, price, category, images, inventory_count, status }) {
    try {
      const result = await query(
        `UPDATE products 
         SET name = COALESCE($2, name),
             description = COALESCE($3, description),
             price = COALESCE($4, price),
             category = COALESCE($5, category),
             images = COALESCE($6, images),
             inventory_count = COALESCE($7, inventory_count),
             status = COALESCE($8, status),
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [
          this.id, 
          name, 
          description, 
          price, 
          category, 
          images ? JSON.stringify(images) : null,
          inventory_count,
          status
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Товар не знайдено');
      }

      // Оновлюємо поточний об'єкт
      Object.assign(this, result.rows[0]);
      logger.info(`Оновлено товар: ${this.name}`);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення товару:', error.message);
      throw error;
    }
  }

  // Зменшення кількості товару на складі
  async decreaseInventory(quantity) {
    try {
      if (this.inventory_count < quantity) {
        throw new Error('Недостатньо товару на складі');
      }

      const result = await query(
        'UPDATE products SET inventory_count = inventory_count - $2, updated_at = NOW() WHERE id = $1 RETURNING inventory_count',
        [this.id, quantity]
      );

      this.inventory_count = result.rows[0].inventory_count;
      logger.info(`Зменшено кількість товару ${this.name} на ${quantity}`);
      return this.inventory_count;
    } catch (error) {
      logger.error('Помилка зменшення кількості товару:', error.message);
      throw error;
    }
  }

  // Збільшення кількості товару на складі
  async increaseInventory(quantity) {
    try {
      const result = await query(
        'UPDATE products SET inventory_count = inventory_count + $2, updated_at = NOW() WHERE id = $1 RETURNING inventory_count',
        [this.id, quantity]
      );

      this.inventory_count = result.rows[0].inventory_count;
      logger.info(`Збільшено кількість товару ${this.name} на ${quantity}`);
      return this.inventory_count;
    } catch (error) {
      logger.error('Помилка збільшення кількості товару:', error.message);
      throw error;
    }
  }

  // Перевірка доступності товару
  isAvailable(quantity = 1) {
    return this.status === 'active' && this.inventory_count >= quantity;
  }

  // Отримання публічних даних товару
  toPublicJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: parseFloat(this.price),
      category: this.category,
      images: this.images,
      inventory_count: this.inventory_count,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Видалення товару (м'яке видалення)
  async delete() {
    try {
      await query(
        'UPDATE products SET status = $2, updated_at = NOW() WHERE id = $1',
        [this.id, 'inactive']
      );

      this.status = 'inactive';
      logger.info(`Видалено товар: ${this.name}`);
      return true;
    } catch (error) {
      logger.error('Помилка видалення товару:', error.message);
      throw error;
    }
  }
}

module.exports = Product;