import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import progressService from '../../services/progressService';

/**
 * Компонент для автоматичного відстеження та збереження прогресу
 * Використовується як wrapper або hook для компонентів навчання
 */
const ProgressTracker = ({ 
  lessonId, 
  courseId, 
  children, 
  onProgressUpdate = () => {},
  saveInterval = 30000 // Збереження кожні 30 секунд
}) => {
  const { user } = useSelector(state => state.auth);
  const startTimeRef = useRef(Date.now());
  const lastSaveRef = useRef(Date.now());
  const progressDataRef = useRef({
    progress_percentage: 0,
    time_spent_minutes: 0,
    last_position: null
  });

  // Функція збереження прогресу
  const saveProgress = async (forceSync = false) => {
    if (!user || !lessonId) return;

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveRef.current;
    
    // Збереження тільки якщо пройшов достатній час або примусово
    if (!forceSync && timeSinceLastSave < saveInterval) return;

    try {
      const totalTimeSpent = Math.floor((now - startTimeRef.current) / 60000); // В хвилинах
      
      await progressService.updateLessonProgress(
        lessonId,
        progressDataRef.current.progress_percentage,
        totalTimeSpent,
        progressDataRef.current.last_position
      );

      lastSaveRef.current = now;
      console.log(`Прогрес збережено: ${progressDataRef.current.progress_percentage}%, час: ${totalTimeSpent}хв`);
    } catch (error) {
      console.error('Помилка збереження прогресу:', error);
      
      // Зберігаємо локально при помилці
      progressService.saveProgressLocally(lessonId, {
        ...progressDataRef.current,
        time_spent_minutes: Math.floor((now - startTimeRef.current) / 60000)
      });
    }
  };

  // Оновлення прогресу
  const updateProgress = (progressPercentage, lastPosition = null) => {
    progressDataRef.current = {
      progress_percentage: progressPercentage,
      time_spent_minutes: Math.floor((Date.now() - startTimeRef.current) / 60000),
      last_position: lastPosition
    };

    onProgressUpdate(progressDataRef.current);
  };

  // Автоматичне збереження через інтервали
  useEffect(() => {
    if (!user || !lessonId) return;

    const interval = setInterval(() => {
      saveProgress();
    }, saveInterval);

    return () => clearInterval(interval);
  }, [user, lessonId, saveInterval]);

  // Збереження при закритті сторінки
  useEffect(() => {
    if (!user || !lessonId) return;

    const handleBeforeUnload = () => {
      saveProgress(true); // Примусове збереження
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveProgress(true); // Збереження при переході на іншу вкладку
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      saveProgress(true); // Збереження при демонтажі компонента
    };
  }, [user, lessonId]);

  // Синхронізація локального прогресу при монтажі
  useEffect(() => {
    if (user) {
      progressService.syncLocalProgress().catch(console.error);
    }
  }, [user]);

  // Якщо передано children, рендеримо їх з контекстом прогресу
  if (children) {
    return children({ updateProgress, saveProgress });
  }

  // Інакше це просто hook для відстеження
  return null;
};

/**
 * Hook для використання в функціональних компонентах
 */
export const useProgressTracker = (lessonId, courseId, options = {}) => {
  const { user } = useSelector(state => state.auth);
  const startTimeRef = useRef(Date.now());
  const lastSaveRef = useRef(Date.now());
  const progressDataRef = useRef({
    progress_percentage: 0,
    time_spent_minutes: 0,
    last_position: null
  });

  const {
    saveInterval = 30000,
    onProgressUpdate = () => {},
    autoSync = true
  } = options;

  const saveProgress = async (forceSync = false) => {
    if (!user || !lessonId) return;

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveRef.current;
    
    if (!forceSync && timeSinceLastSave < saveInterval) return;

    try {
      const totalTimeSpent = Math.floor((now - startTimeRef.current) / 60000);
      
      await progressService.updateLessonProgress(
        lessonId,
        progressDataRef.current.progress_percentage,
        totalTimeSpent,
        progressDataRef.current.last_position
      );

      lastSaveRef.current = now;
    } catch (error) {
      console.error('Помилка збереження прогресу:', error);
      
      progressService.saveProgressLocally(lessonId, {
        ...progressDataRef.current,
        time_spent_minutes: Math.floor((now - startTimeRef.current) / 60000)
      });
    }
  };

  const updateProgress = (progressPercentage, lastPosition = null) => {
    progressDataRef.current = {
      progress_percentage: progressPercentage,
      time_spent_minutes: Math.floor((Date.now() - startTimeRef.current) / 60000),
      last_position: lastPosition
    };

    onProgressUpdate(progressDataRef.current);
  };

  // Автоматичне збереження
  useEffect(() => {
    if (!autoSync || !user || !lessonId) return;

    const interval = setInterval(() => {
      saveProgress();
    }, saveInterval);

    return () => clearInterval(interval);
  }, [user, lessonId, saveInterval, autoSync]);

  // Збереження при закритті
  useEffect(() => {
    if (!user || !lessonId) return;

    const handleBeforeUnload = () => saveProgress(true);
    const handleVisibilityChange = () => {
      if (document.hidden) saveProgress(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      saveProgress(true);
    };
  }, [user, lessonId]);

  return { updateProgress, saveProgress };
};

export default ProgressTracker;