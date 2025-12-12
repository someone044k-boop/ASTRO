import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import LessonPlayer from './LessonPlayer';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="play-icon">Play</span>,
  Pause: () => <span data-testid="pause-icon">Pause</span>,
  SkipBack: () => <span data-testid="skip-back-icon">SkipBack</span>,
  SkipForward: () => <span data-testid="skip-forward-icon">SkipForward</span>,
  Volume2: () => <span data-testid="volume-icon">Volume2</span>,
  VolumeX: () => <span data-testid="volume-mute-icon">VolumeX</span>,
  Maximize: () => <span data-testid="maximize-icon">Maximize</span>,
  Minimize: () => <span data-testid="minimize-icon">Minimize</span>,
  ChevronLeft: () => <span data-testid="chevron-left-icon">ChevronLeft</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">ChevronRight</span>,
  Menu: () => <span data-testid="menu-icon">Menu</span>,
  X: () => <span data-testid="x-icon">X</span>,
}));

// Mock progressService
jest.mock('../../services/progressService', () => ({
  updateLessonProgress: jest.fn().mockResolvedValue({ success: true }),
  getLessonProgress: jest.fn().mockResolvedValue({ 
    data: { 
      progress_percentage: 0,
      time_spent_minutes: 0,
      last_position: null,
      is_completed: false
    } 
  }),
  getProgressLocally: jest.fn().mockReturnValue({ 
    progress_percentage: 0,
    time_spent_minutes: 0,
    last_position: null,
    is_completed: false
  }),
  saveProgressLocally: jest.fn(),
  calculateLessonProgress: jest.fn().mockReturnValue(50),
  completeLessonProgress: jest.fn().mockResolvedValue({ success: true }),
  formatLearningTime: jest.fn().mockReturnValue('0хв'),
  getProgressColor: jest.fn().mockReturnValue('#6b7280'),
  getProgressStatusText: jest.fn().mockReturnValue('Не розпочато'),
  default: {
    updateLessonProgress: jest.fn().mockResolvedValue({ success: true }),
    getLessonProgress: jest.fn().mockResolvedValue({ 
      data: { 
        progress_percentage: 0,
        time_spent_minutes: 0,
        last_position: null,
        is_completed: false
      } 
    }),
    getProgressLocally: jest.fn().mockReturnValue({ 
      progress_percentage: 0,
      time_spent_minutes: 0,
      last_position: null,
      is_completed: false
    }),
    saveProgressLocally: jest.fn(),
    calculateLessonProgress: jest.fn().mockReturnValue(50),
    completeLessonProgress: jest.fn().mockResolvedValue({ success: true }),
    formatLearningTime: jest.fn().mockReturnValue('0хв'),
    getProgressColor: jest.fn().mockReturnValue('#6b7280'),
    getProgressStatusText: jest.fn().mockReturnValue('Не розпочато'),
  }
}));

// Mock progressSync
jest.mock('../../utils/progressSync', () => ({
  subscribe: jest.fn(() => () => {}),
  getCachedProgress: jest.fn(() => null),
  notify: jest.fn(),
  saveProgress: jest.fn().mockResolvedValue(true),
  subscribeGlobal: jest.fn(() => () => {}),
  notifyGlobalListeners: jest.fn(),
  forceSyncLesson: jest.fn().mockResolvedValue({}),
  default: {
    subscribe: jest.fn(() => () => {}),
    getCachedProgress: jest.fn(() => null),
    notify: jest.fn(),
    saveProgress: jest.fn().mockResolvedValue(true),
    subscribeGlobal: jest.fn(() => () => {}),
    notifyGlobalListeners: jest.fn(),
    forceSyncLesson: jest.fn().mockResolvedValue({}),
  }
}));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
    },
    preloadedState: {
      auth: {
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        error: null,
        tokens: { accessToken: 'test-token', refreshToken: 'test-refresh' },
        ...initialState.auth,
      },
      ui: {
        isMobileMenuOpen: false,
        isLoading: false,
        notifications: [],
        theme: 'light',
        language: 'uk',
        ...initialState.ui,
      },
    },
  });
};

// Wrapper component with Redux Provider
const renderWithProvider = (component, initialState = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

// Generators for property-based testing
const slideGenerator = fc.record({
  title: fc.string({ minLength: 1, maxLength: 20 }),
  content: fc.string({ minLength: 1, maxLength: 50 })
});

const slidesArrayGenerator = fc.array(slideGenerator, { minLength: 1, maxLength: 3 });

describe('LessonPlayer Property-Based Tests', () => {
  afterEach(() => {
    cleanup();
  });

  // **Feature: online-learning-school, Property 9: Структура практичних уроків**
  test('should display slide navigation menu for any lesson with slides', () => {
    fc.assert(fc.property(
      slidesArrayGenerator,
      (slides) => {
        const { unmount } = renderWithProvider(
          <LessonPlayer 
            slides={slides}
            onProgress={() => {}}
            onComplete={() => {}}
            initialSlide={0}
            lessonId="test-lesson"
            courseId="test-course"
          />
        );
        
        try {
          // Should display navigation menu
          expect(screen.getByText('Навігація слайдів')).toBeInTheDocument();
          expect(screen.getByText(`1 / ${slides.length}`)).toBeInTheDocument();
          
          // Should display all slides in navigation
          slides.forEach((_, index) => {
            expect(screen.getByText(`Слайд ${index + 1}`)).toBeInTheDocument();
          });
        } finally {
          unmount();
        }
      }
    ), { numRuns: 3 });
  });

  // **Feature: online-learning-school, Property 12: Навігація слайдів**
  test('should display slide numbers and navigation controls for any slide set', () => {
    fc.assert(fc.property(
      slidesArrayGenerator,
      (slides) => {
        const { unmount } = renderWithProvider(
          <LessonPlayer 
            slides={slides}
            onProgress={() => {}}
            onComplete={() => {}}
            initialSlide={0}
            lessonId="test-lesson"
            courseId="test-course"
          />
        );
        
        try {
          // Should display current slide number and total count
          expect(screen.getByText(`1 / ${slides.length}`)).toBeInTheDocument();
          
          // Should display navigation buttons
          const prevButtons = screen.getAllByTestId('chevron-left-icon');
          const nextButtons = screen.getAllByTestId('chevron-right-icon');
          
          expect(prevButtons.length).toBeGreaterThan(0);
          expect(nextButtons.length).toBeGreaterThan(0);
          
          // Previous button should be disabled on first slide
          const prevButton = prevButtons[0].closest('button');
          expect(prevButton).toBeDisabled();
        } finally {
          unmount();
        }
      }
    ), { numRuns: 10 });
  });

  // **Feature: online-learning-school, Property 11: Функціональність аудіопрогравача**
  test('should display audio controls when audio URL is provided', () => {
    fc.assert(fc.property(
      slidesArrayGenerator,
      (slides) => {
        const { unmount } = renderWithProvider(
          <LessonPlayer 
            slides={slides}
            audioUrl="http://example.com/audio.mp3"
            onProgress={() => {}}
            onComplete={() => {}}
            initialSlide={0}
            lessonId="test-lesson"
            courseId="test-course"
          />
        );
        
        try {
          // Should display play button
          expect(screen.getByTestId('play-icon')).toBeInTheDocument();
          
          // Should display volume controls
          expect(screen.getByTestId('volume-icon')).toBeInTheDocument();
          
          // Should display speed control
          const speedControl = screen.getByDisplayValue('1');
          expect(speedControl).toBeInTheDocument();
          expect(['SELECT', 'INPUT'].includes(speedControl.tagName)).toBe(true);
          
          // Should display time display
          expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument();
        } finally {
          unmount();
        }
      }
    ), { numRuns: 10 });
  });

  // **Feature: online-learning-school, Property 33: Адаптивний дизайн для мобільних**
  test('should provide mobile menu toggle for any lesson', () => {
    fc.assert(fc.property(
      slidesArrayGenerator,
      (slides) => {
        const { unmount } = renderWithProvider(
          <LessonPlayer 
            slides={slides}
            onProgress={() => {}}
            onComplete={() => {}}
            initialSlide={0}
            lessonId="test-lesson"
            courseId="test-course"
          />
        );
        
        try {
          // Should display mobile menu button
          expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
          
          // Should display "Слайди" text for mobile menu
          expect(screen.getByText('Слайди')).toBeInTheDocument();
        } finally {
          unmount();
        }
      }
    ), { numRuns: 10 });
  });
});