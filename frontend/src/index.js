import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

import './index.css';
import App from './App';
import { store } from './store/store';
import { register as registerSW } from './utils/serviceWorkerRegistration';
import { preloadCriticalImages, lazyLoadImages } from './utils/imageOptimization';

// Налаштування React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 хвилин
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);

// Реєстрація Service Worker
registerSW({
  onSuccess: () => {
    console.log('Додаток готовий до офлайн використання');
  },
  onUpdate: () => {
    console.log('Доступна нова версія додатку');
    // Можна показати повідомлення користувачу про оновлення
  }
});

// Preload критичних зображень
document.addEventListener('DOMContentLoaded', () => {
  const criticalImages = [
    '/images/logo.png',
    '/images/hero-bg.jpg'
  ];
  preloadCriticalImages(criticalImages);
  
  // Ініціалізація lazy loading для зображень
  setTimeout(() => {
    lazyLoadImages();
  }, 100);
});