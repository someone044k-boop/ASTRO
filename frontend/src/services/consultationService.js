import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

class ConsultationService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/consultations`,
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

  // Отримання типів консультацій
  async getConsultationTypes() {
    try {
      const response = await this.api.get('/types');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Отримання доступних слотів
  async getAvailableSlots(date, type) {
    try {
      const response = await this.api.get('/available-slots', {
        params: { date, type }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Створення консультації
  async createConsultation(consultationData) {
    try {
      const response = await this.api.post('/', consultationData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Отримання моїх консультацій
  async getMyConsultations(limit = 20, offset = 0) {
    try {
      const response = await this.api.get('/my', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Отримання конкретної консультації
  async getConsultationById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Оплата консультації
  async payForConsultation(id, paymentData) {
    try {
      const response = await this.api.post(`/${id}/payment`, paymentData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Перенесення консультації
  async rescheduleConsultation(id, newDate) {
    try {
      const response = await this.api.put(`/${id}/reschedule`, { new_date: newDate });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Скасування консультації
  async cancelConsultation(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Валідація даних консультації
  validateConsultationData(data) {
    const errors = [];

    if (!data.consultation_type) {
      errors.push('Тип консультації обов\'язковий');
    }

    if (!data.scheduled_date) {
      errors.push('Дата консультації обов\'язкова');
    } else {
      const scheduledDate = new Date(data.scheduled_date);
      const now = new Date();
      
      if (scheduledDate <= now) {
        errors.push('Дата консультації повинна бути в майбутньому');
      }
    }

    if (data.notes && data.notes.length > 1000) {
      errors.push('Нотатки занадто довгі (максимум 1000 символів)');
    }

    return errors;
  }

  // Форматування дати та часу
  formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      full: date.toLocaleString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }

  // Отримання назви типу консультації
  getConsultationTypeName(type) {
    const types = {
      'personal': 'Персональна консультація',
      'express': 'Експрес-консультація',
      'compatibility': 'Консультація сумісності'
    };
    return types[type] || type;
  }

  // Отримання статусу консультації українською
  getConsultationStatusText(status) {
    const statuses = {
      'pending': 'Очікує підтвердження',
      'confirmed': 'Підтверджено',
      'processing': 'Обробляється оплата',
      'completed': 'Завершено',
      'cancelled': 'Скасовано',
      'rescheduled': 'Перенесено'
    };
    return statuses[status] || status;
  }

  // Отримання кольору для статусу
  getConsultationStatusColor(status) {
    const colors = {
      'pending': '#f59e0b',
      'confirmed': '#3b82f6',
      'processing': '#8b5cf6',
      'completed': '#10b981',
      'cancelled': '#6b7280',
      'rescheduled': '#f97316'
    };
    return colors[status] || '#6b7280';
  }

  // Отримання іконки для типу консультації
  getConsultationTypeIcon(type) {
    const icons = {
      'personal': '👤',
      'express': '⚡',
      'compatibility': '💕'
    };
    return icons[type] || '📋';
  }

  // Перевірка чи можна редагувати консультацію
  canEditConsultation(consultation) {
    return ['pending', 'confirmed'].includes(consultation.status);
  }

  // Перевірка чи можна скасувати консультацію
  canCancelConsultation(consultation) {
    const scheduledDate = new Date(consultation.scheduled_date);
    const now = new Date();
    const hoursUntil = (scheduledDate - now) / (1000 * 60 * 60);
    
    return ['pending', 'confirmed'].includes(consultation.status) && hoursUntil > 24;
  }

  // Генерація слотів часу
  generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      if (hour !== 13) { // Пропускаємо обідню перерву
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    }
    return slots;
  }

  // Отримання мінімальної дати для бронювання
  getMinBookingDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Отримання максимальної дати для бронювання (3 місяці вперед)
  getMaxBookingDate() {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  }

  // Форматування ціни
  formatPrice(price) {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
    }).format(price);
  }

  // Обробка помилок
  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || 'Помилка сервера';
      const errors = error.response.data?.errors || [];
      return new Error(message, { cause: { errors, status: error.response.status } });
    } else if (error.request) {
      return new Error('Помилка мережі. Перевірте підключення до інтернету.');
    } else {
      return new Error(error.message || 'Невідома помилка');
    }
  }
}

export default new ConsultationService();