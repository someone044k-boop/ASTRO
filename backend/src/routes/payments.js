const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const Order = require('../models/Order');
const logger = require('../utils/logger');

// Валідатори
const createPaymentValidator = [
  body('order_id').isInt({ min: 1 }).withMessage('ID замовлення повинен бути позитивним числом'),
  body('payment_method').isIn(['stripe', 'liqpay']).withMessage('Невірний метод платежу'),
  body('return_url').optional().isURL().withMessage('Невірний URL повернення'),
];

const webhookValidator = [
  body('data').notEmpty().withMessage('Дані webhook не можуть бути порожніми'),
  body('signature').notEmpty().withMessage('Підпис webhook не може бути порожнім'),
];

// Створення платежу
router.post('/create', authenticateToken, createPaymentValidator, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { order_id, payment_method, return_url } = req.body;
    const userId = req.user.id;

    // Перевіряємо, чи існує замовлення і чи належить воно користувачу
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Замовлення не знайдено'
      });
    }

    if (!order.belongsToUser(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Замовлення не може бути оплачено'
      });
    }

    // Валідуємо суму
    paymentService.validateAmount(order.total_amount);

    let paymentData;

    if (payment_method === 'stripe') {
      // Створюємо платіж через Stripe
      paymentData = await paymentService.createStripePayment({
        amount: order.total_amount,
        currency: 'uah',
        description: `Оплата замовлення #${order.id}`,
        metadata: {
          order_id: order.id.toString(),
          user_id: userId.toString()
        },
        orderId: order.id
      });

      // Оновлюємо замовлення
      await order.updateStatus('processing', paymentData.id);

    } else if (payment_method === 'liqpay') {
      // Створюємо платіж через LiqPay
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      
      paymentData = await paymentService.createLiqPayPayment({
        amount: order.total_amount,
        currency: 'UAH',
        description: `Оплата замовлення #${order.id}`,
        orderId: order.id.toString(),
        resultUrl: return_url || `${baseUrl}/payment/result`,
        serverUrl: `${baseUrl}/api/payments/webhook/liqpay`
      });

      // Оновлюємо замовлення
      await order.updateStatus('processing', paymentData.order_id);
    }

    logger.info(`Створено платіж для замовлення ${order.id} через ${payment_method}`);

    res.json({
      success: true,
      message: 'Платіж створено успішно',
      data: {
        payment: paymentData,
        order: order.toPublicJSON()
      }
    });

  } catch (error) {
    logger.error('Помилка створення платежу:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Підтвердження платежу Stripe
router.post('/confirm/:payment_id', authenticateToken, async (req, res) => {
  try {
    const { payment_id } = req.params;
    const userId = req.user.id;

    // Отримуємо інформацію про платіж
    const paymentInfo = await paymentService.confirmStripePayment(payment_id);

    // Знаходимо замовлення за payment_id
    const order = await Order.findByPaymentId(payment_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Замовлення не знайдено'
      });
    }

    if (!order.belongsToUser(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }

    // Оновлюємо статус замовлення відповідно до статусу платежу
    const normalizedStatus = paymentService.normalizePaymentStatus(paymentInfo.status, 'stripe');
    
    if (normalizedStatus === 'completed') {
      await order.updateStatus('paid');
    } else if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
      await order.updateStatus('cancelled');
    }

    logger.info(`Підтверджено платіж ${payment_id} зі статусом ${paymentInfo.status}`);

    res.json({
      success: true,
      message: 'Статус платежу оновлено',
      data: {
        payment: paymentInfo,
        order: order.toPublicJSON()
      }
    });

  } catch (error) {
    logger.error('Помилка підтвердження платежу:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Webhook для Stripe
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = paymentService.stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error('Помилка верифікації Stripe webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Обробляємо різні типи подій
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.order_id;
        
        if (orderId) {
          const order = await Order.findById(orderId);
          if (order) {
            await order.updateStatus('paid');
            logger.info(`Замовлення ${orderId} успішно оплачено через Stripe`);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedOrderId = failedPayment.metadata.order_id;
        
        if (failedOrderId) {
          const order = await Order.findById(failedOrderId);
          if (order) {
            await order.updateStatus('payment_failed');
            logger.info(`Платіж для замовлення ${failedOrderId} не вдався`);
          }
        }
        break;

      default:
        logger.info(`Необроблена подія Stripe: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Помилка обробки Stripe webhook:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка обробки webhook'
    });
  }
});

// Webhook для LiqPay
router.post('/webhook/liqpay', webhookValidator, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { data, signature } = req.body;

    // Обробляємо callback від LiqPay
    const callbackData = await paymentService.handleLiqPayCallback(data, signature);

    // Знаходимо замовлення
    const order = await Order.findById(callbackData.order_id);
    if (!order) {
      logger.error(`Замовлення ${callbackData.order_id} не знайдено для LiqPay callback`);
      return res.status(404).json({
        success: false,
        message: 'Замовлення не знайдено'
      });
    }

    // Оновлюємо статус замовлення
    const normalizedStatus = paymentService.normalizePaymentStatus(callbackData.status, 'liqpay');
    
    if (normalizedStatus === 'completed') {
      await order.updateStatus('paid', callbackData.payment_id);
      logger.info(`Замовлення ${callbackData.order_id} успішно оплачено через LiqPay`);
    } else if (normalizedStatus === 'failed') {
      await order.updateStatus('payment_failed', callbackData.payment_id);
      logger.info(`Платіж для замовлення ${callbackData.order_id} не вдався через LiqPay`);
    }

    res.json({ success: true });

  } catch (error) {
    logger.error('Помилка обробки LiqPay webhook:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка обробки webhook'
    });
  }
});

// Отримання статусу платежу
router.get('/status/:order_id', authenticateToken, async (req, res) => {
  try {
    const { order_id } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Замовлення не знайдено'
      });
    }

    if (!order.belongsToUser(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }

    res.json({
      success: true,
      data: {
        order_id: order.id,
        payment_id: order.payment_id,
        status: order.status,
        total_amount: order.total_amount,
        payment_method: order.payment_method
      }
    });

  } catch (error) {
    logger.error('Помилка отримання статусу платежу:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Створення повернення коштів (тільки для адміністраторів)
router.post('/refund/:order_id', authenticateToken, async (req, res) => {
  try {
    const { order_id } = req.params;
    const { amount } = req.body;

    // Перевіряємо права адміністратора
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Недостатньо прав доступу'
      });
    }

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Замовлення не знайдено'
      });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Можна повертати кошти тільки за оплачені замовлення'
      });
    }

    // Створюємо повернення через Stripe (LiqPay потребує ручної обробки)
    if (order.payment_method === 'stripe') {
      const refund = await paymentService.createStripeRefund(order.payment_id, amount);
      
      await order.updateStatus('refunded');
      
      logger.info(`Створено повернення для замовлення ${order_id}`);

      res.json({
        success: true,
        message: 'Повернення створено успішно',
        data: {
          refund,
          order: order.toPublicJSON()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Автоматичне повернення не підтримується для цього методу платежу'
      });
    }

  } catch (error) {
    logger.error('Помилка створення повернення:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

module.exports = router;