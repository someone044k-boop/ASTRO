const { query } = require('../database/connection');
const logger = require('../utils/logger');

class Order {
  constructor(orderData) {
    this.id = orderData.id;
    this.user_id = orderData.user_id;
    this.total_amount = orderData.total_amount;
    this.status = orderData.status;
    this.payment_method = orderData.payment_method;
    this.payment_id = orderData.payment_id;
    this.created_at = orderData.created_at;
    this.updated_at = orderData.updated_at;
  }

  // Створення нового замовлення
  static async create({ user_id, total_amount, payment_method = null }) {
    try {
      const result = await query(
        `INSERT INTO orders (user_id, total_amount, payment_method) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [user_id, total_amount, payment_method]
      );

      logger.info(`Створено нове замовлення для користувача: ${user_id}`);
      return new Order(result.rows[0]);
    } catch (error) {
      logger.error('Помилка створення замовлення:', error.message);
      throw error;
    }
  }

  // Отримання замовлення за ID
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new Order(result.rows[0]);
    } catch (error) {
      logger.error('Помилка пошуку замовлення за ID:', error.message);
      throw error;
    }
  }

  // Отримання замовлень користувача
  static async findByUserId(user_id, { limit = 20, offset = 0 } = {}) {
    try {
      const result = await query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [user_id, limit, offset]
      );
      
      return result.rows.map(row => new Order(row));
    } catch (error) {
      logger.error('Помилка пошуку замовлень користувача:', error.message);
      throw error;
    }
  }

  // Отримання замовлення за payment_id
  static async findByPaymentId(payment_id) {
    try {
      const result = await query('SELECT * FROM orders WHERE payment_id = $1', [payment_id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new Order(result.rows[0]);
    } catch (error) {
      logger.error('Помилка пошуку замовлення за payment_id:', error.message);
      throw error;
    }
  }

  // Отримання всіх замовлень з фільтрацією
  static async findAll({ status, limit = 50, offset = 0 } = {}) {
    try {
      let queryText = 'SELECT * FROM orders';
      let params = [];
      let paramIndex = 1;

      if (status) {
        queryText += ` WHERE status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows.map(row => new Order(row));
    } catch (error) {
      logger.error('Помилка отримання замовлень:', error.message);
      throw error;
    }
  }

  // Оновлення статусу замовлення
  async updateStatus(status, payment_id = null) {
    try {
      const result = await query(
        `UPDATE orders 
         SET status = $2, 
             payment_id = COALESCE($3, payment_id),
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [this.id, status, payment_id]
      );

      if (result.rows.length === 0) {
        throw new Error('Замовлення не знайдено');
      }

      // Оновлюємо поточний об'єкт
      Object.assign(this, result.rows[0]);
      logger.info(`Оновлено статус замовлення ${this.id} на ${status}`);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення статусу замовлення:', error.message);
      throw error;
    }
  }

  // Отримання елементів замовлення
  async getItems() {
    try {
      const OrderItem = require('./OrderItem');
      return await OrderItem.findByOrderId(this.id);
    } catch (error) {
      logger.error('Помилка отримання елементів замовлення:', error.message);
      throw error;
    }
  }

  // Отримання детальної інформації про замовлення з елементами
  async getDetailedOrder() {
    try {
      const items = await this.getItems();
      
      return {
        ...this.toPublicJSON(),
        items: items.map(item => item.toPublicJSON())
      };
    } catch (error) {
      logger.error('Помилка отримання детальної інформації про замовлення:', error.message);
      throw error;
    }
  }

  // Розрахунок загальної суми замовлення на основі елементів
  async calculateTotal() {
    try {
      const result = await query(
        'SELECT SUM(quantity * unit_price) as total FROM order_items WHERE order_id = $1',
        [this.id]
      );

      const calculatedTotal = parseFloat(result.rows[0].total) || 0;
      
      // Оновлюємо загальну суму в замовленні
      if (calculatedTotal !== parseFloat(this.total_amount)) {
        await query(
          'UPDATE orders SET total_amount = $2, updated_at = NOW() WHERE id = $1',
          [this.id, calculatedTotal]
        );
        this.total_amount = calculatedTotal;
      }

      return calculatedTotal;
    } catch (error) {
      logger.error('Помилка розрахунку загальної суми замовлення:', error.message);
      throw error;
    }
  }

  // Скасування замовлення
  async cancel() {
    try {
      if (this.status === 'shipped' || this.status === 'delivered') {
        throw new Error('Неможливо скасувати відправлене або доставлене замовлення');
      }

      await this.updateStatus('cancelled');
      
      // Повертаємо товари на склад
      const OrderItem = require('./OrderItem');
      const Product = require('./Product');
      const items = await OrderItem.findByOrderId(this.id);
      
      for (const item of items) {
        if (item.product_id) {
          const product = await Product.findById(item.product_id);
          if (product) {
            await product.increaseInventory(item.quantity);
          }
        }
      }

      logger.info(`Скасовано замовлення: ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Помилка скасування замовлення:', error.message);
      throw error;
    }
  }

  // Перевірка чи замовлення належить користувачу
  belongsToUser(user_id) {
    return this.user_id === user_id;
  }

  // Перевірка чи можна редагувати замовлення
  canBeModified() {
    return this.status === 'pending';
  }

  // Отримання публічних даних замовлення
  toPublicJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      total_amount: parseFloat(this.total_amount),
      status: this.status,
      payment_method: this.payment_method,
      payment_id: this.payment_id,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Видалення замовлення (тільки для скасованих)
  async delete() {
    try {
      if (this.status !== 'cancelled') {
        throw new Error('Можна видаляти тільки скасовані замовлення');
      }

      // Спочатку видаляємо елементи замовлення
      await query('DELETE FROM order_items WHERE order_id = $1', [this.id]);
      
      // Потім видаляємо саме замовлення
      await query('DELETE FROM orders WHERE id = $1', [this.id]);

      logger.info(`Видалено замовлення: ${this.id}`);
      return true;
    } catch (error) {
      logger.error('Помилка видалення замовлення:', error.message);
      throw error;
    }
  }
}

module.exports = Order;