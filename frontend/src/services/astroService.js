import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

class AstroService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/astro`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Додаємо токен авторизації до запитів (якщо є)
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
          // Не перенаправляємо автоматично, оскільки астрологія доступна і гостям
        }
        return Promise.reject(error);
      }
    );
  }

  // Створення натальної карти (для зареєстрованих користувачів)
  async createNatalChart(chartData) {
    try {
      const response = await this.api.post('/natal-chart', chartData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Створення натальної карти для гостей
  async createGuestNatalChart(chartData) {
    try {
      const response = await this.api.post('/natal-chart/guest', chartData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Отримання збережених натальних карт
  async getUserCharts() {
    try {
      const response = await this.api.get('/natal-charts');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Отримання конкретної натальної карти
  async getChartById(chartId) {
    try {
      const response = await this.api.get(`/natal-chart/${chartId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Швидке визначення знаку зодіаку
  async getZodiacSign(birthDate) {
    try {
      const response = await this.api.post('/zodiac-sign', { birthDate });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Сумісність знаків
  async getCompatibility(sign1, sign2) {
    try {
      const response = await this.api.post('/compatibility', { sign1, sign2 });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Отримання всіх знаків зодіаку
  async getZodiacSigns() {
    try {
      const response = await this.api.get('/zodiac-signs');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Отримання планет
  async getPlanets() {
    try {
      const response = await this.api.get('/planets');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Отримання будинків
  async getHouses() {
    try {
      const response = await this.api.get('/houses');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Валідація даних натальної карти
  validateChartData(data) {
    const errors = [];

    if (!data.birthDate) {
      errors.push('Дата народження обов\'язкова');
    }

    if (!data.birthTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.birthTime)) {
      errors.push('Невірний формат часу (HH:MM)');
    }

    if (!data.birthLocation) {
      errors.push('Місце народження обов\'язкове');
    } else {
      if (!data.birthLocation.city) {
        errors.push('Місто народження обов\'язкове');
      }
      if (!data.birthLocation.country) {
        errors.push('Країна народження обов\'язкова');
      }
      if (typeof data.birthLocation.latitude !== 'number' || 
          data.birthLocation.latitude < -90 || 
          data.birthLocation.latitude > 90) {
        errors.push('Невірна широта');
      }
      if (typeof data.birthLocation.longitude !== 'number' || 
          data.birthLocation.longitude < -180 || 
          data.birthLocation.longitude > 180) {
        errors.push('Невірна довгота');
      }
    }

    return errors;
  }

  // Форматування дати для відображення
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Форматування часу
  formatTime(timeString) {
    return timeString;
  }

  // Отримання опису елементу
  getElementDescription(element) {
    const descriptions = {
      'Вогонь': 'Енергійні, імпульсивні, лідери за природою',
      'Земля': 'Практичні, надійні, орієнтовані на матеріальне',
      'Повітря': 'Інтелектуальні, комунікабельні, гнучкі',
      'Вода': 'Емоційні, інтуїтивні, чутливі'
    };
    return descriptions[element] || element;
  }

  // Отримання кольору для знаку зодіаку
  getSignColor(signName) {
    const colors = {
      'Овен': '#FF6B6B',
      'Телець': '#4ECDC4',
      'Близнюки': '#45B7D1',
      'Рак': '#96CEB4',
      'Лев': '#FFEAA7',
      'Діва': '#DDA0DD',
      'Терези': '#FFB6C1',
      'Скорпіон': '#FF7675',
      'Стрілець': '#A29BFE',
      'Козеріг': '#6C5CE7',
      'Водолій': '#74B9FF',
      'Риби': '#81ECEC'
    };
    return colors[signName] || '#6C7B7F';
  }

  // Отримання іконки для планети
  getPlanetIcon(planetName) {
    const icons = {
      'Сонце': '☉',
      'Місяць': '☽',
      'Меркурій': '☿',
      'Венера': '♀',
      'Марс': '♂',
      'Юпітер': '♃',
      'Сатурн': '♄',
      'Уран': '♅',
      'Нептун': '♆',
      'Плутон': '♇'
    };
    return icons[planetName] || '●';
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

  // Генерація короткого гороскопу (заглушка)
  generateDailyHoroscope(signName) {
    const horoscopes = {
      'Овен': 'Сьогодні ваша енергія на піку! Використайте її для нових починань.',
      'Телець': 'День сприятливий для фінансових рішень та творчості.',
      'Близнюки': 'Спілкування принесе нові можливості. Будьте відкритими.',
      'Рак': 'Зосередьтеся на сімейних справах та емоційному благополуччі.',
      'Лев': 'Ваш час сяяти! Покажіть свої таланти світу.',
      'Діва': 'Увага до деталей допоможе вирішити важливі завдання.',
      'Терези': 'Шукайте баланс у всіх сферах життя.',
      'Скорпіон': 'Глибокі роздуми приведуть до важливих відкриттів.',
      'Стрілець': 'Час для пригод та розширення горизонтів.',
      'Козеріг': 'Наполегливість приведе до успіху в кар\'єрі.',
      'Водолій': 'Ваші унікальні ідеї знайдуть підтримку.',
      'Риби': 'Довіртеся інтуїції у прийнятті рішень.'
    };
    
    return horoscopes[signName] || 'Сьогодні хороший день для саморозвитку!';
  }
}

export default new AstroService();