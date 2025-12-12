import progressService from './progressService';

describe('ProgressService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('calculateLessonProgress', () => {
    test('should calculate progress correctly without audio', () => {
      const progress = progressService.calculateLessonProgress(2, 5, 0, false);
      expect(progress).toBe(60); // (3/5) * 100
    });

    test('should calculate progress correctly with audio', () => {
      const progress = progressService.calculateLessonProgress(2, 5, 0.5, true);
      expect(progress).toBe(55); // (3/5) * 50 + 0.5 * 50
    });

    test('should return 0 for zero slides', () => {
      const progress = progressService.calculateLessonProgress(0, 0, 0, false);
      expect(progress).toBe(0);
    });

    test('should cap progress at 100%', () => {
      const progress = progressService.calculateLessonProgress(4, 5, 1, true);
      expect(progress).toBe(100); // Should not exceed 100
    });
  });

  describe('formatLearningTime', () => {
    test('should format minutes correctly', () => {
      expect(progressService.formatLearningTime(30)).toBe('30хв');
      expect(progressService.formatLearningTime(59)).toBe('59хв');
    });

    test('should format hours correctly', () => {
      expect(progressService.formatLearningTime(60)).toBe('1г');
      expect(progressService.formatLearningTime(120)).toBe('2г');
    });

    test('should format hours and minutes correctly', () => {
      expect(progressService.formatLearningTime(90)).toBe('1г 30хв');
      expect(progressService.formatLearningTime(125)).toBe('2г 5хв');
    });
  });

  describe('getProgressColor', () => {
    test('should return correct colors for different progress levels', () => {
      expect(progressService.getProgressColor(100)).toBe('#10b981'); // Green
      expect(progressService.getProgressColor(80)).toBe('#3b82f6');  // Blue
      expect(progressService.getProgressColor(60)).toBe('#f59e0b');  // Yellow
      expect(progressService.getProgressColor(30)).toBe('#ef4444');  // Red
      expect(progressService.getProgressColor(10)).toBe('#6b7280');  // Gray
    });
  });

  describe('getProgressStatusText', () => {
    test('should return correct status text for different progress levels', () => {
      expect(progressService.getProgressStatusText(100)).toBe('Завершено');
      expect(progressService.getProgressStatusText(80)).toBe('Майже завершено');
      expect(progressService.getProgressStatusText(60)).toBe('В процесі');
      expect(progressService.getProgressStatusText(30)).toBe('Розпочато');
      expect(progressService.getProgressStatusText(10)).toBe('Не розпочато');
    });
  });

  describe('local storage methods', () => {
    test('should save and retrieve progress locally', () => {
      const progressData = {
        progress_percentage: 75,
        time_spent_minutes: 30,
        last_position: { slide: 5 }
      };

      progressService.saveProgressLocally('lesson-123', progressData);
      const retrieved = progressService.getProgressLocally('lesson-123');

      expect(retrieved.progress_percentage).toBe(75);
      expect(retrieved.time_spent_minutes).toBe(30);
      expect(retrieved.last_position.slide).toBe(5);
      expect(retrieved.timestamp).toBeDefined();
    });

    test('should return null for non-existent lesson', () => {
      const retrieved = progressService.getProgressLocally('non-existent');
      expect(retrieved).toBeNull();
    });

    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => {
        progressService.saveProgressLocally('lesson-123', { progress: 50 });
      }).not.toThrow();

      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });
});