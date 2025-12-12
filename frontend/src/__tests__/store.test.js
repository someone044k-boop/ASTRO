import { configureStore } from '@reduxjs/toolkit';
import authSlice, { 
  clearError,
  clearAuth,
  loginUser,
  logoutUser
} from '../store/slices/authSlice';
import uiSlice, {
  toggleMobileMenu,
  closeMobileMenu,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
  setLanguage
} from '../store/slices/uiSlice';

describe('Redux Store Configuration', () => {
  let store;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    store = configureStore({
      reducer: {
        auth: authSlice,
        ui: uiSlice,
      },
    });
  });

  describe('Auth Slice', () => {
    test('повинен мати правильний початковий стан', () => {
      const state = store.getState().auth;
      
      expect(state).toEqual({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        tokens: {
          accessToken: undefined,
          refreshToken: undefined,
        },
      });
    });

    test('повинен обробляти clearError', () => {
      // Dispatch clearError
      store.dispatch(clearError());
      const state = store.getState().auth;
      
      expect(state.error).toBe(null);
    });

    test('повинен обробляти clearAuth', () => {
      // Dispatch clearAuth
      store.dispatch(clearAuth());
      const state = store.getState().auth;
      
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.tokens.accessToken).toBe(null);
      expect(state.tokens.refreshToken).toBe(null);
    });

    test('повинен обробляти loginUser.pending', () => {
      // Dispatch pending action manually
      store.dispatch({ type: 'auth/login/pending' });
      const state = store.getState().auth;
      
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    test('повинен обробляти loginUser.fulfilled', () => {
      const userData = {
        user: { id: '1', email: 'test@example.com' },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' }
      };
      
      store.dispatch({ type: 'auth/login/fulfilled', payload: userData });
      const state = store.getState().auth;
      
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(userData.user);
      expect(state.tokens).toEqual(userData.tokens);
      expect(state.error).toBe(null);
    });

    test('повинен обробляти loginUser.rejected', () => {
      const errorPayload = { error: 'Помилка аутентифікації' };
      
      store.dispatch({ type: 'auth/login/rejected', payload: errorPayload });
      const state = store.getState().auth;
      
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.error).toBe('Помилка аутентифікації');
    });

    test('повинен обробляти logoutUser.fulfilled', () => {
      // First set authenticated state
      store.dispatch({ 
        type: 'auth/login/fulfilled', 
        payload: {
          user: { id: '1', email: 'test@example.com' },
          tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' }
        }
      });
      
      // Then logout
      store.dispatch({ type: 'auth/logout/fulfilled' });
      const state = store.getState().auth;
      
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.tokens.accessToken).toBe(null);
      expect(state.tokens.refreshToken).toBe(null);
    });

    test('повинен обробляти updateProfile.fulfilled', () => {
      // First set authenticated state
      store.dispatch({ 
        type: 'auth/login/fulfilled', 
        payload: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' }
        }
      });
      
      // Update profile
      const updatedUser = { id: '1', email: 'test@example.com', name: 'Updated Name', phone: '+380123456789' };
      store.dispatch({ type: 'auth/updateProfile/fulfilled', payload: { user: updatedUser } });
      
      const state = store.getState().auth;
      expect(state.user.name).toBe('Updated Name');
      expect(state.user.phone).toBe('+380123456789');
    });
  });

  describe('UI Slice', () => {
    test('повинен мати правильний початковий стан', () => {
      const state = store.getState().ui;
      
      expect(state).toEqual({
        isMobileMenuOpen: false,
        isLoading: false,
        notifications: [],
        theme: 'light',
        language: 'uk',
      });
    });

    test('повинен обробляти toggleMobileMenu', () => {
      // Перший toggle
      store.dispatch(toggleMobileMenu());
      let state = store.getState().ui;
      expect(state.isMobileMenuOpen).toBe(true);
      
      // Другий toggle
      store.dispatch(toggleMobileMenu());
      state = store.getState().ui;
      expect(state.isMobileMenuOpen).toBe(false);
    });

    test('повинен обробляти closeMobileMenu', () => {
      // Відкриваємо меню
      store.dispatch(toggleMobileMenu());
      
      // Закриваємо меню
      store.dispatch(closeMobileMenu());
      const state = store.getState().ui;
      
      expect(state.isMobileMenuOpen).toBe(false);
    });

    test('повинен обробляти setLoading', () => {
      store.dispatch(setLoading(true));
      let state = store.getState().ui;
      expect(state.isLoading).toBe(true);
      
      store.dispatch(setLoading(false));
      state = store.getState().ui;
      expect(state.isLoading).toBe(false);
    });

    test('повинен обробляти notifications', () => {
      const notification = {
        type: 'success',
        message: 'Тестове сповіщення'
      };
      
      // Додаємо сповіщення
      store.dispatch(addNotification(notification));
      let state = store.getState().ui;
      
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toMatchObject(notification);
      expect(state.notifications[0]).toHaveProperty('id');
      
      // Видаляємо сповіщення
      const notificationId = state.notifications[0].id;
      store.dispatch(removeNotification(notificationId));
      state = store.getState().ui;
      
      expect(state.notifications).toHaveLength(0);
    });

    test('повинен обробляти clearNotifications', () => {
      // Додаємо кілька сповіщень
      store.dispatch(addNotification({ type: 'info', message: 'Test 1' }));
      store.dispatch(addNotification({ type: 'warning', message: 'Test 2' }));
      
      let state = store.getState().ui;
      expect(state.notifications).toHaveLength(2);
      
      // Очищуємо всі сповіщення
      store.dispatch(clearNotifications());
      state = store.getState().ui;
      
      expect(state.notifications).toHaveLength(0);
    });

    test('повинен обробляти setTheme', () => {
      store.dispatch(setTheme('dark'));
      const state = store.getState().ui;
      
      expect(state.theme).toBe('dark');
    });

    test('повинен обробляти setLanguage', () => {
      store.dispatch(setLanguage('en'));
      const state = store.getState().ui;
      
      expect(state.language).toBe('en');
    });
  });

  describe('Store Integration', () => {
    test('повинен підтримувати множинні dispatch', () => {
      // Виконуємо кілька дій одночасно
      store.dispatch(setLoading(true));
      store.dispatch({ type: 'auth/login/pending' });
      store.dispatch(addNotification({ type: 'info', message: 'Loading...' }));
      
      const state = store.getState();
      
      expect(state.ui.isLoading).toBe(true);
      expect(state.auth.loading).toBe(true);
      expect(state.ui.notifications).toHaveLength(1);
    });

    test('повинен зберігати незалежність slice\'ів', () => {
      // Зміни в auth не повинні впливати на ui
      store.dispatch({ 
        type: 'auth/login/fulfilled', 
        payload: {
          user: { id: '1', email: 'test@example.com' },
          tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' }
        }
      });
      
      const initialUiState = store.getState().ui;
      
      store.dispatch({ type: 'auth/logout/fulfilled' });
      
      const finalUiState = store.getState().ui;
      
      expect(finalUiState).toEqual(initialUiState);
    });
  });
});
