const { query } = require('../database/connection');
const logger = require('../utils/logger');

class PaymentTransaction {
  constructor(transactionData) {
    this.id = transactionData.id;
    this.order_id = transactionData.order_id;
    this.payment_provider = transactionData.payment_provider;
    this.transaction_id = transactionData.transaction_id;
    this.amount = transactionData.amount;
    this.currency = transactionData.currency;
    this.status = transactionData.status;
    this.provider_response = transactionData.provider_response;
    this.created_at = transactionData.created_at;
    this.updated_at = transactionData.updated_at;
  }

  // Створення нової транзакції
  static async create({ order_id, payment_provider, transaction_id, amount, currency = 'UAH', status, provider_response = {} }) {
    try {
      const result = await query(
        `INSERT INTO payment_transactions (order_id, payment_provider, transaction_id, amount, currency, status, provider_response) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [order_id, payment_provider, transaction_id, amount, currency, status, JSON.stringify(provider_response)]
      );

      logger.info(`Створено транзакцію платежу: ${transaction_id} для замовлення ${order_id}`);
      return new PaymentTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Помилка створення транзакції платежу:', error.message);
      throw error;
    }
  }

  // Отримання транзакції за ID
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM payment_transactions WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new PaymentTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Помилка пошуку транзакції за ID:', error.message);
      throw error;
    }
  }

  // Отримання транзакції за transaction_id
  static async findByTransactionId(transaction_id) {
    try {
      const result = await query('SELECT * FROM payment_transactions WHERE transaction_id = $1', [transaction_id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new PaymentTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Помилка пошуку транзакції за transaction_id:', error.message);
      throw error;
    }
  }

  // Отримання транзакцій за замовленням
  static async findByOrderId(order_id) {
    try {
      const result = await query(
        'SELECT * FROM payment_transactions WHERE order_id = $1 ORDER BY created_at DESC',
        [order_id]
      );
      
      return result.rows.map(row => new PaymentTransaction(row));
    } catch (error) {
      logger.error('Помилка пошуку транзакцій за замовленням:', error.message);
      throw error;
    }
  }

  // Отримання транзакцій за провайдером
  static async findByProvider(payment_provider, { limit = 50, offset = 0 } = {}) {
    try {
      const result = await query(
        'SELECT * FROM payment_transactions WHERE payment_provider = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [payment_provider, limit, offset]
      );
      
      return result.rows.map(row => new PaymentTransaction(row));
    } catch (error) {
      logger.error('Помилка пошуку транзакцій за провайдером:', error.message);
      throw error;
    }
  }

  // Оновлення статусу транзакції
  async updateStatus(status, provider_response = null) {
    try {
      const result = await query(
        `UPDATE payment_transactions 
         SET status = $2, 
             provider_response = COALESCE($3, provider_response),
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [this.id, status, provider_response ? JSON.stringify(provider_response) : null]
      );

      if (result.rows.length === 0) {
        throw new Error('Транзакція не знайдена');
      }

      // Оновлюємо поточний об'єкт
      Object.assign(this, result.rows[0]);
      logger.info(`Оновлено статус транзакції ${this.transaction_id} на ${status}`);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення статусу транзакції:', error.message);
      throw error;
    }
  }

  // Отримання статистики транзакцій
  static async getStatistics({ start_date, end_date, payment_provider } = {}) {
    try {
      let queryText = `
        SELECT 
          payment_provider,
          status,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount
        FROM payment_transactions
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;

      if (start_date) {
        queryText += ` AND created_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        queryText += ` AND created_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      if (payment_provider) {
        queryText += ` AND payment_provider = $${paramIndex}`;
        params.push(payment_provider);
        paramIndex++;
      }

      queryText += ' GROUP BY payment_provider, status ORDER BY payment_provider, status';

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      logger.error('Помилка отримання статистики транзакцій:', error.message);
      throw error;
    }
  }

  // Перевірка чи транзакція успішна
  isSuccessful() {
    return ['completed', 'succeeded', 'paid'].includes(this.status);
  }

  // Перевірка чи транзакція невдала
  isFailed() {
    return ['failed', 'error', 'cancelled', 'declined'].includes(this.status);
  }

  // Перевірка чи транзакція в процесі
  isPending() {
    return ['pending', 'processing', 'requires_action'].includes(this.status);
  }

  // Отримання публічних даних транзакції
  toPublicJSON() {
    return {
      id: this.id,
      order_id: this.order_id,
      payment_provider: this.payment_provider,
      transaction_id: this.transaction_id,
      amount: parseFloat(this.amount),
      currency: this.currency,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Отримання повних даних транзакції (для адміністраторів)
  toAdminJSON() {
    return {
      ...this.toPublicJSON(),
      provider_response: this.provider_response
    };
  }
}

module.exports = PaymentTransaction;