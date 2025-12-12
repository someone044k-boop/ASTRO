/**
 * Сервіс для роботи з API прогресу навчання
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

class ProgressService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/progress`;
  }

  /**
   * Отримання токену авторизації
   */
  getAuthToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Базовий метод для виконання запитів
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Оновлення прогресу уроку
   * @param {string} lessonId - ID уроку
   * @param {number} progressPercentage - Відсоток прогресу (0-100)
   * @param {number} timeSpentMinutes - Час, проведений в уроці (хвилини)
   * @param {object} lastPosition - Остання позиція в уроці
   */
  async updateLessonProgress(lessonId, progressPercentage, timeSpentMinutes = 0, lastPosition = null) {
    return this.request(`/lesson/${lessonId}`, {
      method: 'POST',
      body: JSON.stringify({
        progress_percentage: progressPercentage,
        time_spent_minutes: timeSpentMinutes,
        last_position: lastPosition
      })
    });
  }

  /**
   * Отримання прогресу конкретного уроку
   * @param {string} lessonId - ID уроку
   */
  async getLessonProgress(lessonId) {
    return this.request(`/lesson/${lessonId}`);
  }

  /**
   * Позначення уроку як завершеного
   * @param {string} lessonId - ID уроку
   */
  async completeLessonProgress(lessonId) {
    return this.request(`/lesson/${lessonId}/complete`, {
      method: 'POST'
    });
  }

  /**
   * Отримання прогресу курсу
   * @param {string} courseId - ID курсу
   */
  async getCourseProgress(courseId) {
    return this.request(`/course/${courseId}`);
  }

  /**
   * Отримання статистики навчання користувача
   */
  async getUserLearningStats() {
    return this.request('/my-stats');
  }

  /**
   * Отримання даних для дашборду прогресу
   */
  async getProgressDashboard() {
    return this.request('/dashboard');
  }

  /**
   * Обчислення прогресу на основі поточного слайду та аудіо
   * @param {number} currentSlide - Поточний слайд (0-based)
   * @param {number} totalSlides - Загальна кількість слайдів
   * @param {number} audioProgress - Прогрес аудіо (0-1)
   * @param {boolean} hasAudio - Чи є аудіо в уроці
   */
  calculateLessonProgress(currentSlide, totalSlides, audioProgress = 0, hasAudio = false) {
    if (totalSlides === 0) return 0;

    // 50% за слайди, 50% за аудіо (якщо є)
    const slideProgress = ((currentSlide + 1) / totalSlides) * (hasAudio ? 50 : 100);
    const audioProgressPercent = hasAudio ? audioProgress * 50 : 0;
    
    return Math.min(100, slideProgress + audioProgressPercent);
  }

  /**
   * Форматування часу навчання
   * @param {number} minutes - Кількість хвилин
   */
  formatLearningTime(minutes) {
    if (minutes < 60) {
      return `${minutes}хв`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}г`;
    }
    
    return `${hours}г ${remainingMinutes}хв`;
  }

  /**
   * Отримання кольору прогресу на основі відсотка
   * @param {number} percentage - Відсоток прогресу
   */
  getProgressColor(percentage) {
    if (percentage >= 100) return '#10b981'; // Зелений - завершено
    if (percentage >= 75) return '#3b82f6';  // Синій - майже завершено
    if (percentage >= 50) return '#f59e0b';  // Жовтий - в процесі
    if (percentage >= 25) return '#ef4444';  // Червоний - початок
    return '#6b7280'; // Сірий - не розпочато
  }

  /**
   * Отримання тексту статусу прогресу
   * @param {number} percentage - Відсоток прогресу
   */
  getProgressStatusText(percentage) {
    if (percentage >= 100) return 'Завершено';
    if (percentage >= 75) return 'Майже завершено';
    if (percentage >= 50) return 'В процесі';
    if (percentage >= 25) return 'Розпочато';
    return 'Не розпочато';
  }

  /**
   * Збереження прогресу в локальному сховищі (для офлайн режиму)
   * @param {string} lessonId - ID уроку
   * @param {object} progressData - Дані прогресу
   */
  saveProgressLocally(lessonId, progressData) {
    try {
      const localProgress = JSON.parse(localStorage.getItem('lessonProgress') || '{}');
      localProgress[lessonId] = {
        ...progressData,
        timestamp: Date.now()
      };
      localStorage.setItem('lessonProgress', JSON.stringify(localProgress));
    } catch (error) {
      console.error('Помилка збереження прогресу локально:', error);
    }
  }

  /**
   * Отримання прогресу з локального сховища
   * @param {string} lessonId - ID уроку
   */
  getProgressLocally(lessonId) {
    try {
      const localProgress = JSON.parse(localStorage.getItem('lessonProgress') || '{}');
      return localProgress[lessonId] || null;
    } catch (error) {
      console.error('Помилка отримання прогресу з локального сховища:', error);
      return null;
    }
  }

  /**
   * Синхронізація локального прогресу з сервером
   */
  async syncLocalProgress() {
    try {
      const localProgress = JSON.parse(localStorage.getItem('lessonProgress') || '{}');
      const syncPromises = [];

      for (const [lessonId, progressData] of Object.entries(localProgress)) {
        // Синхронізуємо тільки якщо дані свіжі (менше 24 годин)
        const isRecent = Date.now() - progressData.timestamp < 24 * 60 * 60 * 1000;
        
        if (isRecent) {
          syncPromises.push(
            this.updateLessonProgress(
              lessonId,
              progressData.progress_percentage,
              progressData.time_spent_minutes,
              progressData.last_position
            ).catch(error => {
              console.error(`Помилка синхронізації прогресу для уроку ${lessonId}:`, error);
            })
          );
        }
      }

      await Promise.all(syncPromises);
      
      // Очищуємо локальне сховище після успішної синхронізації
      localStorage.removeItem('lessonProgress');
      
      console.log('Локальний прогрес успішно синхронізовано');
    } catch (error) {
      console.error('Помилка синхронізації локального прогресу:', error);
    }
  }
}

const progressService = new ProgressService();
export default progressService;