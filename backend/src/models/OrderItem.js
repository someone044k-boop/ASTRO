const { query } = require('../database/connection');
const logger = require('../utils/logger');

class OrderItem {
  constructor(itemData) {
    this.id = itemData.id;
    this.order_id = itemData.order_id;
    this.product_id = itemData.product_id;
    this.quantity = itemData.quantity;
    this.unit_price = itemData.unit_price;
    this.created_at = itemData.created_at;
  }

  // Створення нового елементу замовлення
  static async create({ order_id, product_id, quantity, unit_price }) {
    try {
      const result = await query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [order_id, product_id, quantity, unit_price]
      );

      logger.info(`Створено новий елемент замовлення: ${order_id}`);
      return new OrderItem(result.rows[0]);
    } catch (error) {
      logger.error('Помилка створення елементу замовлення:', error.message);
      throw error;
    }
  }

  // Отримання елементу за ID
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM order_items WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new OrderItem(result.rows[0]);
    } catch (error) {
      logger.error('Помилка пошуку елементу замовлення за ID:', error.message);
      throw error;
    }
  }

  // Отримання всіх елементів замовлення
  static async findByOrderId(order_id) {
    try {
      const result = await query(
        'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at',
        [order_id]
      );
      
      return result.rows.map(row => new OrderItem(row));
    } catch (error) {
      logger.error('Помилка пошуку елементів замовлення:', error.message);
      throw error;
    }
  }

  // Отримання елементів замовлення з інформацією про товари
  static async findByOrderIdWithProducts(order_id) {
    try {
      const result = await query(
        `SELECT oi.*, p.name as product_name, p.description as product_description, 
                p.images as product_images, p.category as product_category
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1 
         ORDER BY oi.created_at`,
        [order_id]
      );
      
      return result.rows.map(row => ({
        ...new OrderItem(row).toPublicJSON(),
        product: {
          name: row.product_name,
          description: row.product_description,
          images: row.product_images,
          category: row.product_category
        }
      }));
    } catch (error) {
      logger.error('Помилка пошуку елементів замовлення з товарами:', error.message);
      throw error;
    }
  }

  // Оновлення кількості елементу
  async updateQuantity(quantity) {
    try {
      if (quantity <= 0) {
        throw new Error('Кількість повинна бути більше нуля');
      }

      const result = await query(
        'UPDATE order_items SET quantity = $2 WHERE id = $1 RETURNING *',
        [this.id, quantity]
      );

      if (result.rows.length === 0) {
        throw new Error('Елемент замовлення не знайдено');
      }

      // Оновлюємо поточний об'єкт
      Object.assign(this, result.rows[0]);
      logger.info(`Оновлено кількість елементу замовлення ${this.id} на ${quantity}`);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення кількості елементу замовлення:', error.message);
      throw error;
    }
  }

  // Розрахунок загальної вартості елементу
  getTotalPrice() {
    return parseFloat(this.unit_price) * this.quantity;
  }

  // Отримання інформації про товар
  async getProduct() {
    try {
      const Product = require('./Product');
      return await Product.findById(this.product_id);
    } catch (error) {
      logger.error('Помилка отримання товару для елементу замовлення:', error.message);
      throw error;
    }
  }

  // Перевірка доступності товару в потрібній кількості
  async checkAvailability() {
    try {
      const product = await this.getProduct();
      if (!product) {
        return { available: false, reason: 'Товар не знайдено' };
      }

      if (!product.isAvailable(this.quantity)) {
        return { 
          available: false, 
          reason: `Недостатньо товару на складі. Доступно: ${product.inventory_count}` 
        };
      }

      return { available: true };
    } catch (error) {
      logger.error('Помилка перевірки доступності товару:', error.message);
      throw error;
    }
  }

  // Резервування товару (зменшення кількості на складі)
  async reserveProduct() {
    try {
      const product = await this.getProduct();
      if (!product) {
        throw new Error('Товар не знайдено');
      }

      await product.decreaseInventory(this.quantity);
      logger.info(`Зарезервовано товар ${product.name} в кількості ${this.quantity}`);
      return true;
    } catch (error) {
      logger.error('Помилка резервування товару:', error.message);
      throw error;
    }
  }

  // Скасування резервування товару (повернення кількості на склад)
  async unreserveProduct() {
    try {
      const product = await this.getProduct();
      if (!product) {
        logger.warn(`Товар з ID ${this.product_id} не знайдено для скасування резервування`);
        return false;
      }

      await product.increaseInventory(this.quantity);
      logger.info(`Скасовано резервування товару ${product.name} в кількості ${this.quantity}`);
      return true;
    } catch (error) {
      logger.error('Помилка скасування резервування товару:', error.message);
      throw error;
    }
  }

  // Отримання публічних даних елементу замовлення
  toPublicJSON() {
    return {
      id: this.id,
      order_id: this.order_id,
      product_id: this.product_id,
      quantity: this.quantity,
      unit_price: parseFloat(this.unit_price),
      total_price: this.getTotalPrice(),
      created_at: this.created_at
    };
  }

  // Видалення елементу замовлення
  async delete() {
    try {
      // Скасовуємо резервування товару
      await this.unreserveProduct();
      
      // Видаляємо елемент
      await query('DELETE FROM order_items WHERE id = $1', [this.id]);

      logger.info(`Видалено елемент замовлення: ${this.id}`);
      return true;
    } catch (error) {
      logger.error('Помилка видалення елементу замовлення:', error.message);
      throw error;
    }
  }
}

module.exports = OrderItem;