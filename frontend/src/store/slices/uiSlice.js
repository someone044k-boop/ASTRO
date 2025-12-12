import { createSlice } from '@reduxjs/toolkit';

// Початковий стан UI
const initialState = {
  isMobileMenuOpen: false,
  isLoading: false,
  notifications: [],
  theme: 'light',
  language: 'uk',
};

// Slice для UI стану
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Перемикання мобільного меню
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    
    // Закриття мобільного меню
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
    
    // Встановлення стану завантаження
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    // Додавання сповіщення
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    
    // Видалення сповіщення
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    
    // Очищення всіх сповіщень
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Зміна теми
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    // Зміна мови
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
  },
});

export const {
  toggleMobileMenu,
  closeMobileMenu,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
  setLanguage,
} = uiSlice.actions;

export default uiSlice.reducer;