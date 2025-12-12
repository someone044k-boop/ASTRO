const Stripe = require('stripe');
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const PaymentTransaction = require('../models/PaymentTransaction');

class PaymentService {
  constructor() {
    // Ініціалізація Stripe
    this.stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Налаштування LiqPay
    this.liqpay = {
      publicKey: process.env.LIQPAY_PUBLIC_KEY,
      privateKey: process.env.LIQPAY_PRIVATE_KEY,
      apiUrl: 'https://www.liqpay.ua/api/3/checkout'
    };
  }

  // Створення платежу через Stripe
  async createStripePayment({ amount, currency = 'uah', description, metadata = {}, orderId = null }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe працює з копійками
        currency: currency.toLowerCase(),
        description,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Зберігаємо транзакцію в базі даних
      if (orderId) {
        await PaymentTransaction.create({
          order_id: orderId,
          payment_provider: 'stripe',
          transaction_id: paymentIntent.id,
          amount: amount,
          currency: currency.toUpperCase(),
          status: paymentIntent.status,
          provider_response: {
            client_secret: paymentIntent.client_secret,
            created: paymentIntent.created
          }
        });
      }

      logger.info(`Створено Stripe платіж: ${paymentIntent.id}`);
      
      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: amount,
        currency,
        status: paymentIntent.status
      };
    } catch (error) {
      logger.error('Помилка створення Stripe платежу:', error.message);
      throw new Error(`Помилка створення платежу: ${error.message}`);
    }
  }

  // Підтвердження платежу Stripe
  async confirmStripePayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      };
    } catch (error) {
      logger.error('Помилка підтвердження Stripe платежу:', error.message);
      throw new Error(`Помилка підтвердження платежу: ${error.message}`);
    }
  }

  // Створення платежу через LiqPay
  async createLiqPayPayment({ amount, currency = 'UAH', description, orderId, resultUrl, serverUrl }) {
    try {
      const data = {
        version: 3,
        public_key: this.liqpay.publicKey,
        action: 'pay',
        amount,
        currency,
        description,
        order_id: orderId,
        result_url: resultUrl,
        server_url: serverUrl
      };

      const dataBase64 = Buffer.from(JSON.stringify(data)).toString('base64');
      const signature = this.generateLiqPaySignature(dataBase64);

      logger.info(`Створено LiqPay платіж для замовлення: ${orderId}`);

      return {
        data: dataBase64,
        signature,
        checkout_url: this.liqpay.apiUrl,
        order_id: orderId
      };
    } catch (error) {
      logger.error('Помилка створення LiqPay платежу:', error.message);
      throw new Error(`Помилка створення платежу: ${error.message}`);
    }
  }

  // Генерація підпису для LiqPay
  generateLiqPaySignature(data) {
    const signString = this.liqpay.privateKey + data + this.liqpay.privateKey;
    return crypto.createHash('sha1').update(signString).digest('base64');
  }

  // Перевірка підпису LiqPay webhook
  verifyLiqPaySignature(data, signature) {
    const expectedSignature = this.generateLiqPaySignature(data);
    return expectedSignature === signature;
  }

  // Обробка LiqPay callback
  async handleLiqPayCallback(data, signature) {
    try {
      if (!this.verifyLiqPaySignature(data, signature)) {
        throw new Error('Невірний підпис LiqPay');
      }

      const decodedData = JSON.parse(Buffer.from(data, 'base64').toString());
      
      logger.info(`Отримано LiqPay callback для замовлення: ${decodedData.order_id}`);

      return {
        order_id: decodedData.order_id,
        payment_id: decodedData.payment_id,
        status: decodedData.status,
        amount: decodedData.amount,
        currency: decodedData.currency,
        transaction_id: decodedData.transaction_id
      };
    } catch (error) {
      logger.error('Помилка обробки LiqPay callback:', error.message);
      throw new Error(`Помилка обробки callback: ${error.message}`);
    }
  }

  // Створення повернення коштів через Stripe
  async createStripeRefund(paymentIntentId, amount = null) {
    try {
      const refundData = {
        payment_intent: paymentIntentId
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);

      logger.info(`Створено повернення Stripe: ${refund.id}`);

      return {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status
      };
    } catch (error) {
      logger.error('Помилка створення повернення Stripe:', error.message);
      throw new Error(`Помилка повернення коштів: ${error.message}`);
    }
  }

  // Отримання інформації про платіж
  async getPaymentInfo(paymentId, provider = 'stripe') {
    try {
      if (provider === 'stripe') {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
        return {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          created: new Date(paymentIntent.created * 1000)
        };
      }
      
      // Для LiqPay потрібно зберігати інформацію в базі даних
      throw new Error('LiqPay не підтримує прямі запити статусу');
    } catch (error) {
      logger.error('Помилка отримання інформації про платіж:', error.message);
      throw new Error(`Помилка отримання інформації: ${error.message}`);
    }
  }

  // Валідація суми платежу
  validateAmount(amount) {
    if (!amount || amount <= 0) {
      throw new Error('Сума платежу повинна бути більше 0');
    }
    
    if (amount > 999999) {
      throw new Error('Сума платежу занадто велика');
    }
    
    return true;
  }

  // Конвертація статусів платежів у внутрішній формат
  normalizePaymentStatus(status, provider = 'stripe') {
    const statusMap = {
      stripe: {
        'requires_payment_method': 'pending',
        'requires_confirmation': 'pending',
        'requires_action': 'pending',
        'processing': 'processing',
        'requires_capture': 'processing',
        'canceled': 'cancelled',
        'succeeded': 'completed'
      },
      liqpay: {
        'success': 'completed',
        'failure': 'failed',
        'error': 'failed',
        'reversed': 'refunded',
        'subscribed': 'completed',
        'unsubscribed': 'cancelled'
      }
    };

    return statusMap[provider]?.[status] || 'unknown';
  }
}

module.exports = new PaymentService();