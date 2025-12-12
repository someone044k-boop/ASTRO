import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

class PaymentService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/payments`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Додаємо токен авторизації до всіх запитів
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Обробляємо помилки відповідей
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Створення платежу
  async createPayment(orderData) {
    try {
      const response = await this.api.post('/create', orderData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Підтвердження платежу Stripe
  async confirmStripePayment(paymentId) {
    try {
      const response = await this.api.post(`/confirm/${paymentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Отримання статусу платежу
  async getPaymentStatus(orderId) {
    try {
      const response = await this.api.get(`/status/${orderId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Створення повернення коштів (тільки для адміністраторів)
  async createRefund(orderId, amount = null) {
    try {
      const response = await this.api.post(`/refund/${orderId}`, { amount });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Обробка помилок
  handleError(error) {
    if (error.response) {
      // Сервер повернув помилку
      const message = error.response.data?.message || 'Помилка сервера';
      const errors = error.response.data?.errors || [];
      return new Error(message, { cause: { errors, status: error.response.status } });
    } else if (error.request) {
      // Запит був відправлений, але відповіді не було
      return new Error('Помилка мережі. Перевірте підключення до інтернету.');
    } else {
      // Щось інше
      return new Error(error.message || 'Невідома помилка');
    }
  }

  // Валідація даних платежу
  validatePaymentData(data) {
    const errors = [];

    if (!data.order_id || data.order_id <= 0) {
      errors.push('Невірний ID замовлення');
    }

    if (!data.payment_method || !['stripe', 'liqpay'].includes(data.payment_method)) {
      errors.push('Невірний метод платежу');
    }

    if (data.return_url && !this.isValidUrl(data.return_url)) {
      errors.push('Невірний URL повернення');
    }

    return errors;
  }

  // Перевірка валідності URL
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Форматування суми для відображення
  formatAmount(amount, currency = 'UAH') {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  // Отримання іконки методу платежу
  getPaymentMethodIcon(method) {
    const icons = {
      stripe: '💳',
      liqpay: '🏦',
      cash: '💵',
    };
    return icons[method] || '💰';
  }

  // Отримання назви методу платежу
  getPaymentMethodName(method) {
    const names = {
      stripe: 'Stripe (Картка)',
      liqpay: 'LiqPay',
      cash: 'Готівка',
    };
    return names[method] || method;
  }

  // Отримання статусу платежу українською
  getPaymentStatusText(status) {
    const statuses = {
      pending: 'Очікує оплати',
      processing: 'Обробляється',
      paid: 'Оплачено',
      cancelled: 'Скасовано',
      failed: 'Помилка оплати',
      refunded: 'Повернено',
      payment_failed: 'Платіж не вдався',
    };
    return statuses[status] || status;
  }

  // Отримання кольору для статусу
  getPaymentStatusColor(status) {
    const colors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      paid: '#10b981',
      cancelled: '#6b7280',
      failed: '#ef4444',
      refunded: '#8b5cf6',
      payment_failed: '#ef4444',
    };
    return colors[status] || '#6b7280';
  }
}

export default new PaymentService();