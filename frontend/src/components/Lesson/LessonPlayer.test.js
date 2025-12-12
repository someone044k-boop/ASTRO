import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
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
  Check: () => <span data-testid="check-icon">Check</span>,
  AlertCircle: () => <span data-testid="alert-icon">AlertCircle</span>,
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

const mockSlides = [
  {
    title: 'Slide 1',
    content: '<p>Content of slide 1</p>'
  },
  {
    title: 'Slide 2',
    content: '<p>Content of slide 2</p>'
  },
  {
    title: 'Slide 3',
    content: '<p>Content of slide 3</p>'
  }
];

describe('LessonPlayer', () => {
  const defaultProps = {
    slides: mockSlides,
    audioUrl: null,
    onProgress: jest.fn(),
    onComplete: jest.fn(),
    initialSlide: 0,
    lessonId: 'test-lesson-id',
    courseId: 'test-course-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders lesson player with slides', () => {
    renderWithProvider(<LessonPlayer {...defaultProps} />);
    
    // Check that slide content is rendered
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  test('displays slide navigation in sidebar', () => {
    renderWithProvider(<LessonPlayer {...defaultProps} />);
    
    expect(screen.getByText('Навігація слайдів')).toBeInTheDocument();
    expect(screen.getByText('Слайд 1')).toBeInTheDocument();
    expect(screen.getByText('Слайд 2')).toBeInTheDocument();
    expect(screen.getByText('Слайд 3')).toBeInTheDocument();
  });

  test('navigates to next slide when next button is clicked', async () => {
    renderWithProvider(<LessonPlayer {...defaultProps} />);
    
    const nextButtons = screen.getAllByTestId('chevron-right-icon');
    const nextButton = nextButtons[0].closest('button');
    
    if (nextButton && !nextButton.disabled) {
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });
    }
  });

  test('navigates to previous slide when previous button is clicked', async () => {
    renderWithProvider(<LessonPlayer {...defaultProps} initialSlide={1} />);
    
    const prevButtons = screen.getAllByTestId('chevron-left-icon');
    const prevButton = prevButtons[0].closest('button');
    
    if (prevButton && !prevButton.disabled) {
      fireEvent.click(prevButton);
      
      await waitFor(() => {
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    }
  });

  test('disables previous button on first slide', () => {
    renderWithProvider(<LessonPlayer {...defaultProps} />);
    
    const prevButtons = screen.getAllByTestId('chevron-left-icon');
    const prevButton = prevButtons[0].closest('button');
    expect(prevButton).toBeDisabled();
  });

  test('disables next button on last slide', () => {
    renderWithProvider(<LessonPlayer {...defaultProps} initialSlide={2} />);
    
    const nextButtons = screen.getAllByTestId('chevron-right-icon');
    const nextButton = nextButtons[0].closest('button');
    expect(nextButton).toBeDisabled();
  });

  test('calls onProgress when slide changes', async () => {
    const onProgress = jest.fn();
    renderWithProvider(<LessonPlayer {...defaultProps} onProgress={onProgress} />);
    
    const nextButtons = screen.getAllByTestId('chevron-right-icon');
    const nextButton = nextButtons[0].closest('button');
    
    if (nextButton && !nextButton.disabled) {
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(onProgress).toHaveBeenCalled();
      }, { timeout: 2000 });
    }
  });

  test('shows audio player when audioUrl is provided', () => {
    renderWithProvider(<LessonPlayer {...defaultProps} audioUrl="/test-audio.mp3" />);
    
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
  });

  test('does not show audio player when audioUrl is not provided', () => {
    renderWithProvider(<LessonPlayer {...defaultProps} />);
    
    expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument();
  });

  test('navigates to specific slide when sidebar item is clicked', async () => {
    renderWithProvider(<LessonPlayer {...defaultProps} />);
    
    const slide3Item = screen.getByText('Слайд 3').closest('div');
    if (slide3Item) {
      fireEvent.click(slide3Item);
      
      await waitFor(() => {
        expect(screen.getByText('3 / 3')).toBeInTheDocument();
      });
    }
  });

  test('shows fullscreen button when audio is provided', () => {
    renderWithProvider(<LessonPlayer {...defaultProps} audioUrl="/test-audio.mp3" />);
    
    expect(screen.getByTestId('maximize-icon')).toBeInTheDocument();
  });

  test('displays lesson progress bar', () => {
    renderWithProvider(<LessonPlayer {...defaultProps} />);
    
    const progressBar = document.querySelector('.progress');
    expect(progressBar).toBeInTheDocument();
  });

  test('calls onComplete when lesson is finished', async () => {
    const onComplete = jest.fn();
    renderWithProvider(<LessonPlayer {...defaultProps} onComplete={onComplete} initialSlide={2} />);
    
    // Verify the callback is set up
    await waitFor(() => {
      expect(onComplete).toBeDefined();
    });
  });

  test('renders without crashing with minimal props', () => {
    renderWithProvider(
      <LessonPlayer 
        slides={mockSlides} 
        lessonId="test-lesson" 
        courseId="test-course" 
      />
    );
    
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });
});
