const { query } = require('../database/connection');
const logger = require('../utils/logger');

class Consultation {
  constructor(consultationData) {
    this.id = consultationData.id;
    this.user_id = consultationData.user_id;
    this.consultation_type = consultationData.consultation_type;
    this.status = consultationData.status;
    this.scheduled_date = consultationData.scheduled_date;
    this.duration_minutes = consultationData.duration_minutes;
    this.price = consultationData.price;
    this.payment_id = consultationData.payment_id;
    this.notes = consultationData.notes;
    this.meeting_link = consultationData.meeting_link;
    this.created_at = consultationData.created_at;
    this.updated_at = consultationData.updated_at;
  }

  // Створення нової консультації
  static async create({ user_id, consultation_type, scheduled_date, duration_minutes, price, notes = null }) {
    try {
      const result = await query(
        `INSERT INTO consultations (user_id, consultation_type, scheduled_date, duration_minutes, price, notes) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [user_id, consultation_type, scheduled_date, duration_minutes, price, notes]
      );

      logger.info(`Створено консультацію ${consultation_type} для користувача: ${user_id}`);
      return new Consultation(result.rows[0]);
    } catch (error) {
      logger.error('Помилка створення консультації:', error.message);
      throw error;
    }
  }

  // Отримання консультації за ID
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM consultations WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new Consultation(result.rows[0]);
    } catch (error) {
      logger.error('Помилка пошуку консультації за ID:', error.message);
      throw error;
    }
  }

  // Отримання консультацій користувача
  static async findByUserId(user_id, { limit = 20, offset = 0 } = {}) {
    try {
      const result = await query(
        'SELECT * FROM consultations WHERE user_id = $1 ORDER BY scheduled_date DESC LIMIT $2 OFFSET $3',
        [user_id, limit, offset]
      );
      
      return result.rows.map(row => new Consultation(row));
    } catch (error) {
      logger.error('Помилка пошуку консультацій користувача:', error.message);
      throw error;
    }
  }

  // Отримання всіх консультацій з фільтрацією
  static async findAll({ status, consultation_type, limit = 50, offset = 0 } = {}) {
    try {
      let queryText = 'SELECT * FROM consultations WHERE 1=1';
      let params = [];
      let paramIndex = 1;

      if (status) {
        queryText += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (consultation_type) {
        queryText += ` AND consultation_type = $${paramIndex}`;
        params.push(consultation_type);
        paramIndex++;
      }

      queryText += ` ORDER BY scheduled_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows.map(row => new Consultation(row));
    } catch (error) {
      logger.error('Помилка отримання консультацій:', error.message);
      throw error;
    }
  }

  // Оновлення статусу консультації
  async updateStatus(status, payment_id = null, meeting_link = null) {
    try {
      const result = await query(
        `UPDATE consultations 
         SET status = $2, 
             payment_id = COALESCE($3, payment_id),
             meeting_link = COALESCE($4, meeting_link),
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [this.id, status, payment_id, meeting_link]
      );

      if (result.rows.length === 0) {
        throw new Error('Консультація не знайдена');
      }

      Object.assign(this, result.rows[0]);
      logger.info(`Оновлено статус консультації ${this.id} на ${status}`);
      return this;
    } catch (error) {
      logger.error('Помилка оновлення статусу консультації:', error.message);
      throw error;
    }
  }

  // Перенесення консультації
  async reschedule(new_date) {
    try {
      const result = await query(
        `UPDATE consultations 
         SET scheduled_date = $2, 
             status = 'rescheduled',
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [this.id, new_date]
      );

      if (result.rows.length === 0) {
        throw new Error('Консультація не знайдена');
      }

      Object.assign(this, result.rows[0]);
      logger.info(`Перенесено консультацію ${this.id} на ${new_date}`);
      return this;
    } catch (error) {
      logger.error('Помилка перенесення консультації:', error.message);
      throw error;
    }
  }

  // Скасування консультації
  async cancel() {
    try {
      if (this.status === 'completed') {
        throw new Error('Неможливо скасувати завершену консультацію');
      }

      await this.updateStatus('cancelled');
      logger.info(`Скасовано консультацію: ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Помилка скасування консультації:', error.message);
      throw error;
    }
  }

  // Перевірка чи консультація належить користувачу
  belongsToUser(user_id) {
    return this.user_id === user_id;
  }

  // Перевірка чи можна редагувати консультацію
  canBeModified() {
    return ['pending', 'confirmed'].includes(this.status);
  }

  // Отримання доступних слотів для консультацій
  static async getAvailableSlots(consultation_type, date) {
    try {
      // Базові слоти (можна налаштувати)
      const baseSlots = [
        '09:00', '10:00', '11:00', '12:00', 
        '14:00', '15:00', '16:00', '17:00', '18:00'
      ];

      // Отримуємо зайняті слоти на цю дату
      const result = await query(
        `SELECT scheduled_date FROM consultations 
         WHERE DATE(scheduled_date) = $1 
         AND status IN ('confirmed', 'pending')`,
        [date]
      );

      const bookedSlots = result.rows.map(row => {
        const time = new Date(row.scheduled_date);
        return time.toTimeString().slice(0, 5);
      });

      // Фільтруємо доступні слоти
      const availableSlots = baseSlots.filter(slot => !bookedSlots.includes(slot));

      return availableSlots;
    } catch (error) {
      logger.error('Помилка отримання доступних слотів:', error.message);
      throw error;
    }
  }

  // Отримання типів консультацій з цінами
  static getConsultationTypes() {
    return [
      {
        id: 'personal',
        name: 'Персональна консультація',
        description: 'Індивідуальна консультація з детальним розбором вашої ситуації',
        duration: 60,
        price: 1500,
        features: [
          'Детальний розбір натальної карти',
          'Персональні рекомендації',
          'Відповіді на ваші питання',
          'Запис консультації'
        ]
      },
      {
        id: 'express',
        name: 'Експрес-консультація',
        description: 'Швидка консультація для вирішення конкретного питання',
        duration: 30,
        price: 800,
        features: [
          'Фокус на одному питанні',
          'Швидкі рекомендації',
          'Практичні поради'
        ]
      },
      {
        id: 'compatibility',
        name: 'Консультація сумісності',
        description: 'Аналіз сумісності партнерів за натальними картами',
        duration: 45,
        price: 1200,
        features: [
          'Аналіз натальних карт партнерів',
          'Синастрія та композит',
          'Рекомендації для стосунків',
          'Прогноз розвитку відносин'
        ]
      }
    ];
  }

  // Отримання публічних даних консультації
  toPublicJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      consultation_type: this.consultation_type,
      status: this.status,
      scheduled_date: this.scheduled_date,
      duration_minutes: this.duration_minutes,
      price: parseFloat(this.price),
      notes: this.notes,
      meeting_link: this.meeting_link,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Видалення консультації (тільки для скасованих)
  async delete() {
    try {
      if (this.status !== 'cancelled') {
        throw new Error('Можна видаляти тільки скасовані консультації');
      }

      await query('DELETE FROM consultations WHERE id = $1', [this.id]);
      logger.info(`Видалено консультацію: ${this.id}`);
      return true;
    } catch (error) {
      logger.error('Помилка видалення консультації:', error.message);
      throw error;
    }
  }
}

module.exports = Consultation;