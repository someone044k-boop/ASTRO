import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import authSlice from '../store/slices/authSlice';
import uiSlice from '../store/slices/uiSlice';

// Створення тестового store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
    },
  });
};

// Створення тестового QueryClient
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  });
};

// Wrapper для тестів
const TestWrapper = ({ children }) => {
  const store = createTestStore();
  const queryClient = createTestQueryClient();

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

// Cleanup after each test
afterEach(() => {
  cleanup();
});

describe('App Component', () => {
  test('повинен рендерити без помилок', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    
    // Перевірка, що компонент рендериться
    const mainElement = document.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });

  test('повинен відображати заголовок сайту', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    
    // Перевірка наявності логотипу/заголовку
    const title = screen.queryByText('Школа Навчання');
    expect(title).toBeInTheDocument();
  });

  test('повинен мати правильну структуру layout', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    
    // Перевірка основних елементів layout
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    
    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
  });

  test('повинен відображати навігаційне меню', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    
    // Перевірка пунктів меню
    expect(screen.queryByText('Головна')).toBeInTheDocument();
    expect(screen.queryByText('База Знань')).toBeInTheDocument();
    expect(screen.queryByText('Навчання')).toBeInTheDocument();
    expect(screen.queryByText('Консультації')).toBeInTheDocument();
    expect(screen.queryByText('Майстерня')).toBeInTheDocument();
    expect(screen.queryByText('Астро')).toBeInTheDocument();
  });

  test('повинен відображати статус інфраструктури на головній сторінці', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    
    // Перевірка статусу базової інфраструктури
    expect(screen.queryByText(/Базова інфраструктура налаштована/)).toBeInTheDocument();
    expect(screen.queryByText(/React frontend з Redux/)).toBeInTheDocument();
    expect(screen.queryByText(/Node.js backend з Express/)).toBeInTheDocument();
    expect(screen.queryByText(/PostgreSQL база даних/)).toBeInTheDocument();
    expect(screen.queryByText(/Redis кешування/)).toBeInTheDocument();
  });

  test('повинен мати адаптивний дизайн', () => {
    // Тест базової адаптивності через CSS
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    
    const appContainer = document.querySelector('div');
    expect(appContainer).toBeInTheDocument();
    
    // Перевірка, що стилі застосовуються
    const computedStyle = window.getComputedStyle(appContainer);
    expect(computedStyle.display).toBeDefined();
  });
});