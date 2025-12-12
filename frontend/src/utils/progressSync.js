/**
 * Утиліта для синхронізації прогресу між компонентами
 * та управління глобальним станом прогресу навчання
 */

class ProgressSync {
  constructor() {
    this.listeners = new Map();
    this.progressCache = new Map();
    this.syncInterval = null;
    this.isOnline = navigator.onLine;
    
    // Слухаємо зміни статусу мережі
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineProgress();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Запускаємо періодичну синхронізацію
    this.startPeriodicSync();
  }

  /**
   * Підписка на зміни прогресу конкретного уроку
   * @param {string} lessonId - ID уроку
   * @param {function} callback - Функція зворотного виклику
   */
  subscribe(lessonId, callback) {
    if (!this.listeners.has(lessonId)) {
      this.listeners.set(lessonId, new Set());
    }
    this.listeners.get(lessonId).add(callback);
    
    // Повертаємо функцію для відписки
    return () => {
      const callbacks = this.listeners.get(lessonId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(lessonId);
        }
      }
    };
  }

  /**
   * Сповіщення всіх слухачів про зміну прогресу
   * @param {string} lessonId - ID уроку
   * @param {object} progressData - Дані прогресу
   */
  notify(lessonId, progressData) {
    // Оновлюємо кеш
    this.progressCache.set(lessonId, {
      ...progressData,
      timestamp: Date.now()
    });
    
    // Сповіщаємо слухачів
    const callbacks = this.listeners.get(lessonId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(progressData);
        } catch (error) {
          console.error('Помилка в callback прогресу:', error);
        }
      });
    }
    
    // Сповіщаємо глобальних слухачів
    this.notifyGlobalListeners('lesson_progress_updated', {
      lessonId,
      progressData
    });
  }

  /**
   * Отримання кешованого прогресу уроку
   * @param {string} lessonId - ID уроку
   */
  getCachedProgress(lessonId) {
    return this.progressCache.get(lessonId);
  }

  /**
   * Підписка на глобальні події прогресу
   * @param {string} eventType - Тип події
   * @param {function} callback - Функція зворотного виклику
   */
  subscribeGlobal(eventType, callback) {
    const globalKey = `global_${eventType}`;
    if (!this.listeners.has(globalKey)) {
      this.listeners.set(globalKey, new Set());
    }
    this.listeners.get(globalKey).add(callback);
    
    return () => {
      const callbacks = this.listeners.get(globalKey);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(globalKey);
        }
      }
    };
  }

  /**
   * Сповіщення глобальних слухачів
   * @param {string} eventType - Тип події
   * @param {object} data - Дані події
   */
  notifyGlobalListeners(eventType, data) {
    const globalKey = `global_${eventType}`;
    const callbacks = this.listeners.get(globalKey);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Помилка в глобальному callback:', error);
        }
      });
    }
  }

  /**
   * Запуск періодичної синхронізації прогресу
   */
  startPeriodicSync() {
    // Синхронізація кожні 5 хвилин
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncAllProgress();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Зупинка періодичної синхронізації
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Синхронізація всього кешованого прогресу
   */
  async syncAllProgress() {
    const progressService = await import('../services/progressService');
    const service = progressService.default;
    
    try {
      // Синхронізуємо локальний прогрес
      await service.syncLocalProgress();
      
      // Оновлюємо кеш з сервера для активних уроків
      const activePromises = [];
      for (const [lessonId, cachedData] of this.progressCache.entries()) {
        // Синхронізуємо тільки якщо дані старші 1 хвилини
        if (Date.now() - cachedData.timestamp > 60000) {
          activePromises.push(
            service.getLessonProgress(lessonId)
              .then(response => {
                if (response.data) {
                  this.notify(lessonId, response.data);
                }
              })
              .catch(error => {
                console.error(`Помилка синхронізації прогресу уроку ${lessonId}:`, error);
              })
          );
        }
      }
      
      await Promise.all(activePromises);
      console.log('Синхронізація прогресу завершена');
    } catch (error) {
      console.error('Помилка синхронізації прогресу:', error);
    }
  }

  /**
   * Синхронізація офлайн прогресу при відновленні з'єднання
   */
  async syncOfflineProgress() {
    console.log('Відновлено з\'єднання, синхронізуємо офлайн прогрес...');
    
    try {
      const progressService = await import('../services/progressService');
      const service = progressService.default;
      
      await service.syncLocalProgress();
      
      // Сповіщаємо про успішну синхронізацію
      this.notifyGlobalListeners('offline_sync_completed', {
        timestamp: Date.now()
      });
      
      console.log('Офлайн прогрес успішно синхронізовано');
    } catch (error) {
      console.error('Помилка синхронізації офлайн прогресу:', error);
      
      // Сповіщаємо про помилку синхронізації
      this.notifyGlobalListeners('offline_sync_failed', {
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Очищення кешу та слухачів
   */
  cleanup() {
    this.stopPeriodicSync();
    this.listeners.clear();
    this.progressCache.clear();
  }

  /**
   * Отримання статистики синхронізації
   */
  getSyncStats() {
    return {
      cachedLessons: this.progressCache.size,
      activeListeners: Array.from(this.listeners.keys()).length,
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime || null
    };
  }

  /**
   * Форсована синхронізація конкретного уроку
   * @param {string} lessonId - ID уроку
   */
  async forceSyncLesson(lessonId) {
    if (!this.isOnline) {
      throw new Error('Немає з\'єднання з інтернетом');
    }
    
    try {
      const progressService = await import('../services/progressService');
      const service = progressService.default;
      
      const response = await service.getLessonProgress(lessonId);
      if (response.data) {
        this.notify(lessonId, response.data);
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Помилка форсованої синхронізації уроку ${lessonId}:`, error);
      throw error;
    }
  }

  /**
   * Збереження прогресу з автоматичною синхронізацією
   * @param {string} lessonId - ID уроку
   * @param {object} progressData - Дані прогресу
   */
  async saveProgress(lessonId, progressData) {
    try {
      // Оновлюємо локальний кеш
      this.notify(lessonId, progressData);
      
      // Якщо онлайн, відправляємо на сервер
      if (this.isOnline) {
        const progressService = await import('../services/progressService');
        const service = progressService.default;
        
        await service.updateLessonProgress(
          lessonId,
          progressData.progress_percentage,
          progressData.time_spent_minutes,
          progressData.last_position
        );
      } else {
        // Якщо офлайн, зберігаємо локально
        const progressService = await import('../services/progressService');
        const service = progressService.default;
        
        service.saveProgressLocally(lessonId, progressData);
      }
    } catch (error) {
      console.error('Помилка збереження прогресу:', error);
      
      // При помилці зберігаємо локально
      const progressService = await import('../services/progressService');
      const service = progressService.default;
      
      service.saveProgressLocally(lessonId, progressData);
    }
  }
}

// Створюємо глобальний екземпляр
const progressSync = new ProgressSync();

// Очищення при закритті сторінки
window.addEventListener('beforeunload', () => {
  progressSync.cleanup();
});

export default progressSync;