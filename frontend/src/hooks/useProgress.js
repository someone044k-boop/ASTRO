import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import progressService from '../services/progressService';
import progressSync from '../utils/progressSync';

/**
 * Hook для роботи з прогресом навчання
 * @param {string} lessonId - ID уроку
 * @param {string} courseId - ID курсу
 * @param {object} options - Опції конфігурації
 */
export const useProgress = (lessonId, courseId, options = {}) => {
  const {
    autoSave = true,
    saveInterval = 30000, // 30 секунд
    syncOnMount = true,
    trackTime = true
  } = options;

  const { user } = useSelector(state => state.auth);
  
  const [progress, setProgress] = useState({
    progress_percentage: 0,
    time_spent_minutes: 0,
    last_position: null,
    is_completed: false,
    loading: true,
    error: null
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(false);

  const startTimeRef = useRef(Date.now());
  const saveTimeoutRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Слухаємо зміни статусу мережі
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Підписка на зміни прогресу через progressSync
  useEffect(() => {
    if (!lessonId) return;

    const handleProgressUpdate = (progressData) => {
      setProgress(prev => ({
        ...prev,
        ...progressData,
        loading: false,
        error: null
      }));
      setPendingChanges(false);
      setLastSaved(Date.now());
    };

    unsubscribeRef.current = progressSync.subscribe(lessonId, handleProgressUpdate);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [lessonId]);

  // Завантаження початкового прогресу
  useEffect(() => {
    if (!lessonId || !user || !syncOnMount) return;

    const loadInitialProgress = async () => {
      try {
        setProgress(prev => ({ ...prev, loading: true, error: null }));

        // Спочатку перевіряємо кеш
        const cachedProgress = progressSync.getCachedProgress(lessonId);
        if (cachedProgress) {
          setProgress(prev => ({
            ...prev,
            ...cachedProgress,
            loading: false
          }));
        }

        // Потім завантажуємо з сервера
        const response = await progressService.getLessonProgress(lessonId);
        if (response && response.data) {
          progressSync.notify(lessonId, response.data);
        } else {
          // Якщо немає даних на сервері, створюємо початковий прогрес
          setProgress(prev => ({
            ...prev,
            loading: false
          }));
        }
      } catch (error) {
        console.error('Помилка завантаження прогресу:', error);
        
        // При помилці перевіряємо локальне сховище
        const localProgress = progressService.getProgressLocally(lessonId);
        if (localProgress) {
          setProgress(prev => ({
            ...prev,
            ...localProgress,
            loading: false,
            error: 'Завантажено з локального сховища'
          }));
        } else {
          setProgress(prev => ({
            ...prev,
            loading: false,
            error: error.message
          }));
        }
      }
    };

    loadInitialProgress();
  }, [lessonId, user, syncOnMount]);

  // Функція оновлення прогресу
  const updateProgress = useCallback(async (progressPercentage, lastPosition = null, forceSync = false) => {
    if (!lessonId || !user) return;

    const timeSpent = trackTime ? Math.floor((Date.now() - startTimeRef.current) / 60000) : 0;
    
    const newProgressData = {
      progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
      time_spent_minutes: progress.time_spent_minutes + timeSpent,
      last_position: lastPosition,
      is_completed: progressPercentage >= 100
    };

    // Оновлюємо локальний стан
    setProgress(prev => ({
      ...prev,
      ...newProgressData
    }));

    setPendingChanges(true);

    // Скидаємо таймер часу
    startTimeRef.current = Date.now();

    if (autoSave) {
      // Очищуємо попередній таймер
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Встановлюємо новий таймер або зберігаємо відразу
      const delay = forceSync ? 0 : saveInterval;
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await progressSync.saveProgress(lessonId, newProgressData);
          setPendingChanges(false);
          setLastSaved(Date.now());
        } catch (error) {
          console.error('Помилка збереження прогресу:', error);
          setProgress(prev => ({
            ...prev,
            error: 'Помилка збереження: ' + error.message
          }));
        }
      }, delay);
    }
  }, [lessonId, user, autoSave, saveInterval, trackTime, progress.time_spent_minutes]);

  // Функція позначення уроку як завершеного
  const completeLesson = useCallback(async () => {
    if (!lessonId || !user) return;

    try {
      await progressService.completeLessonProgress(lessonId);
      
      const completedData = {
        ...progress,
        progress_percentage: 100,
        is_completed: true
      };
      
      progressSync.notify(lessonId, completedData);
      
      // Сповіщаємо про завершення уроку
      progressSync.notifyGlobalListeners('lesson_completed', {
        lessonId,
        courseId,
        completedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Помилка позначення уроку як завершеного:', error);
      setProgress(prev => ({
        ...prev,
        error: 'Помилка завершення уроку: ' + error.message
      }));
      return false;
    }
  }, [lessonId, courseId, user, progress]);

  // Функція форсованого збереження
  const saveNow = useCallback(async () => {
    if (!lessonId || !user || !pendingChanges) return;

    try {
      const timeSpent = trackTime ? Math.floor((Date.now() - startTimeRef.current) / 60000) : 0;
      
      const currentData = {
        ...progress,
        time_spent_minutes: progress.time_spent_minutes + timeSpent
      };

      await progressSync.saveProgress(lessonId, currentData);
      setPendingChanges(false);
      setLastSaved(Date.now());
      
      // Скидаємо таймер часу
      startTimeRef.current = Date.now();
      
      return true;
    } catch (error) {
      console.error('Помилка форсованого збереження:', error);
      setProgress(prev => ({
        ...prev,
        error: 'Помилка збереження: ' + error.message
      }));
      return false;
    }
  }, [lessonId, user, pendingChanges, trackTime, progress]);

  // Функція синхронізації з сервером
  const syncWithServer = useCallback(async () => {
    if (!lessonId || !user || !isOnline) return;

    try {
      const serverData = await progressSync.forceSyncLesson(lessonId);
      return serverData;
    } catch (error) {
      console.error('Помилка синхронізації з сервером:', error);
      setProgress(prev => ({
        ...prev,
        error: 'Помилка синхронізації: ' + error.message
      }));
      return null;
    }
  }, [lessonId, user, isOnline]);

  // Очищення таймерів при демонтажі
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Автоматичне збереження при закритті сторінки
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingChanges && lessonId && user) {
        // Синхронне збереження при закритті
        const timeSpent = trackTime ? Math.floor((Date.now() - startTimeRef.current) / 60000) : 0;
        
        const finalData = {
          ...progress,
          time_spent_minutes: progress.time_spent_minutes + timeSpent
        };

        progressService.saveProgressLocally(lessonId, finalData);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Зберігаємо при демонтажі компонента
    };
  }, [lessonId, user, pendingChanges, trackTime, progress]);

  return {
    // Дані прогресу
    progress: progress.progress_percentage,
    timeSpent: progress.time_spent_minutes,
    lastPosition: progress.last_position,
    isCompleted: progress.is_completed,
    
    // Стан
    loading: progress.loading,
    error: progress.error,
    isOnline,
    pendingChanges,
    lastSaved,
    
    // Методи
    updateProgress,
    completeLesson,
    saveNow,
    syncWithServer,
    
    // Утиліти
    formatTime: (minutes) => progressService.formatLearningTime(minutes || progress.time_spent_minutes),
    getProgressColor: () => progressService.getProgressColor(progress.progress_percentage),
    getStatusText: () => progressService.getProgressStatusText(progress.progress_percentage)
  };
};

/**
 * Hook для роботи з прогресом курсу
 * @param {string} courseId - ID курсу
 */
export const useCourseProgress = (courseId) => {
  const { user } = useSelector(state => state.auth);
  const [courseProgress, setCourseProgress] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!courseId || !user) return;

    const fetchCourseProgress = async () => {
      try {
        setCourseProgress(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await progressService.getCourseProgress(courseId);
        setCourseProgress({
          data: response.data,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Помилка завантаження прогресу курсу:', error);
        setCourseProgress({
          data: null,
          loading: false,
          error: error.message
        });
      }
    };

    fetchCourseProgress();

    // Підписуємося на оновлення прогресу уроків цього курсу
    const unsubscribe = progressSync.subscribeGlobal('lesson_progress_updated', (data) => {
      // Перезавантажуємо прогрес курсу при оновленні будь-якого уроку
      fetchCourseProgress();
    });

    return unsubscribe;
  }, [courseId, user]);

  const refreshProgress = useCallback(async () => {
    if (!courseId || !user) return;

    try {
      setCourseProgress(prev => ({ ...prev, loading: true }));
      
      const response = await progressService.getCourseProgress(courseId);
      setCourseProgress({
        data: response.data,
        loading: false,
        error: null
      });
      
      return response.data;
    } catch (error) {
      console.error('Помилка оновлення прогресу курсу:', error);
      setCourseProgress(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      return null;
    }
  }, [courseId, user]);

  return {
    courseProgress: courseProgress.data,
    loading: courseProgress.loading,
    error: courseProgress.error,
    refreshProgress
  };
};

export default useProgress;