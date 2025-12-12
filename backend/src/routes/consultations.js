const express = require('express');
const router = express.Router();
const { body, param, query: queryValidator, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const Consultation = require('../models/Consultation');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

// Валідатори
const createConsultationValidator = [
  body('consultation_type').isIn(['personal', 'express', 'compatibility']).withMessage('Невірний тип консультації'),
  body('scheduled_date').isISO8601().withMessage('Невірний формат дати'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Нотатки занадто довгі'),
];

const rescheduleValidator = [
  body('new_date').isISO8601().withMessage('Невірний формат нової дати'),
];

// Отримання типів консультацій
router.get('/types', async (req, res) => {
  try {
    const types = Consultation.getConsultationTypes();
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    logger.error('Помилка отримання типів консультацій:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Отримання доступних слотів
router.get('/available-slots', [
  queryValidator('date').isISO8601().withMessage('Невірний формат дати'),
  queryValidator('type').isIn(['personal', 'express', 'compatibility']).withMessage('Невірний тип консультації')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { date, type } = req.query;
    const availableSlots = await Consultation.getAvailableSlots(type, date);

    res.json({
      success: true,
      data: {
        date,
        type,
        available_slots: availableSlots
      }
    });

  } catch (error) {
    logger.error('Помилка отримання доступних слотів:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Створення консультації
router.post('/', authenticateToken, createConsultationValidator, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { consultation_type, scheduled_date, notes } = req.body;
    const userId = req.user.id;

    // Отримуємо інформацію про тип консультації
    const consultationTypes = Consultation.getConsultationTypes();
    const typeInfo = consultationTypes.find(t => t.id === consultation_type);
    
    if (!typeInfo) {
      return res.status(400).json({
        success: false,
        message: 'Невірний тип консультації'
      });
    }

    // Перевіряємо доступність слоту
    const requestedDate = new Date(scheduled_date);
    const dateStr = requestedDate.toISOString().split('T')[0];
    const timeStr = requestedDate.toTimeString().slice(0, 5);
    
    const availableSlots = await Consultation.getAvailableSlots(consultation_type, dateStr);
    
    if (!availableSlots.includes(timeStr)) {
      return res.status(400).json({
        success: false,
        message: 'Обраний час недоступний'
      });
    }

    // Створюємо консультацію
    const consultation = await Consultation.create({
      user_id: userId,
      consultation_type,
      scheduled_date,
      duration_minutes: typeInfo.duration,
      price: typeInfo.price,
      notes
    });

    logger.info(`Створено консультацію ${consultation_type} для користувача ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Консультація створена успішно',
      data: consultation.toPublicJSON()
    });

  } catch (error) {
    logger.error('Помилка створення консультації:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Отримання консультацій користувача
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const consultations = await Consultation.findByUserId(userId, { 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });

    res.json({
      success: true,
      data: consultations.map(c => c.toPublicJSON())
    });

  } catch (error) {
    logger.error('Помилка отримання консультацій користувача:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Отримання конкретної консультації
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const consultation = await Consultation.findById(id);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Консультація не знайдена'
      });
    }

    // Перевіряємо права доступу (користувач або адміністратор)
    if (!consultation.belongsToUser(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }

    res.json({
      success: true,
      data: consultation.toPublicJSON()
    });

  } catch (error) {
    logger.error('Помилка отримання консультації:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Оплата консультації
router.post('/:id/payment', authenticateToken, [
  body('payment_method').isIn(['stripe', 'liqpay']).withMessage('Невірний метод платежу'),
  body('return_url').optional().isURL().withMessage('Невірний URL повернення'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { payment_method, return_url } = req.body;
    const userId = req.user.id;

    const consultation = await Consultation.findById(id);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Консультація не знайдена'
      });
    }

    if (!consultation.belongsToUser(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }

    if (consultation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Консультація не може бути оплачена'
      });
    }

    // Валідуємо суму
    paymentService.validateAmount(consultation.price);

    let paymentData;

    if (payment_method === 'stripe') {
      paymentData = await paymentService.createStripePayment({
        amount: consultation.price,
        currency: 'uah',
        description: `Оплата консультації #${consultation.id}`,
        metadata: {
          consultation_id: consultation.id.toString(),
          user_id: userId.toString(),
          type: 'consultation'
        }
      });

      await consultation.updateStatus('processing', paymentData.id);

    } else if (payment_method === 'liqpay') {
      const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
      
      paymentData = await paymentService.createLiqPayPayment({
        amount: consultation.price,
        currency: 'UAH',
        description: `Оплата консультації #${consultation.id}`,
        orderId: consultation.id.toString(),
        resultUrl: return_url || `${baseUrl}/consultations/payment-result`,
        serverUrl: `${baseUrl}/api/consultations/webhook/liqpay`
      });

      await consultation.updateStatus('processing', paymentData.order_id);
    }

    logger.info(`Створено платіж для консультації ${consultation.id} через ${payment_method}`);

    res.json({
      success: true,
      message: 'Платіж створено успішно',
      data: {
        payment: paymentData,
        consultation: consultation.toPublicJSON()
      }
    });

  } catch (error) {
    logger.error('Помилка створення платежу за консультацію:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Перенесення консультації
router.put('/:id/reschedule', authenticateToken, rescheduleValidator, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { new_date } = req.body;
    const userId = req.user.id;

    const consultation = await Consultation.findById(id);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Консультація не знайдена'
      });
    }

    if (!consultation.belongsToUser(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }

    if (!consultation.canBeModified()) {
      return res.status(400).json({
        success: false,
        message: 'Консультацію неможливо перенести'
      });
    }

    // Перевіряємо доступність нового слоту
    const newDate = new Date(new_date);
    const dateStr = newDate.toISOString().split('T')[0];
    const timeStr = newDate.toTimeString().slice(0, 5);
    
    const availableSlots = await Consultation.getAvailableSlots(consultation.consultation_type, dateStr);
    
    if (!availableSlots.includes(timeStr)) {
      return res.status(400).json({
        success: false,
        message: 'Новий час недоступний'
      });
    }

    await consultation.reschedule(new_date);

    logger.info(`Перенесено консультацію ${id} на ${new_date}`);

    res.json({
      success: true,
      message: 'Консультацію перенесено успішно',
      data: consultation.toPublicJSON()
    });

  } catch (error) {
    logger.error('Помилка перенесення консультації:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Скасування консультації
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const consultation = await Consultation.findById(id);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Консультація не знайдена'
      });
    }

    if (!consultation.belongsToUser(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }

    await consultation.cancel();

    logger.info(`Скасовано консультацію ${id}`);

    res.json({
      success: true,
      message: 'Консультацію скасовано успішно'
    });

  } catch (error) {
    logger.error('Помилка скасування консультації:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Отримання всіх консультацій (тільки для адміністраторів)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Недостатньо прав доступу'
      });
    }

    const { status, consultation_type, limit = 50, offset = 0 } = req.query;

    const consultations = await Consultation.findAll({
      status,
      consultation_type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: consultations.map(c => c.toPublicJSON())
    });

  } catch (error) {
    logger.error('Помилка отримання всіх консультацій:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

module.exports = router;
