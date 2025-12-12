// Утиліти для оптимізації продуктивності

// Функція для debounce
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Функція для throttle
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer для lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };

  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

// Функція для preload ресурсів
export const preloadResource = (href, as, type = null) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

// Функція для prefetch ресурсів
export const prefetchResource = (href) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

// Функція для вимірювання продуктивності
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    console.log(`${name} виконано за ${end - start} мілісекунд`);
    return result;
  };
};

// Функція для оптимізації скролу
export const optimizeScroll = (callback) => {
  let ticking = false;
  
  return () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
};

// Функція для виявлення повільного з'єднання
export const isSlowConnection = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' ||
           connection.saveData;
  }
  return false;
};

// Функція для адаптивного завантаження
export const adaptiveLoading = {
  shouldLoadHighQuality: () => {
    return !isSlowConnection() && 
           window.innerWidth > 768 && 
           !window.matchMedia('(prefers-reduced-data: reduce)').matches;
  },
  
  getImageQuality: () => {
    if (isSlowConnection()) return 'low';
    if (window.innerWidth < 768) return 'medium';
    return 'high';
  }
};

// Функція для кешування в localStorage з TTL
export const cacheWithTTL = {
  set: (key, data, ttl = 3600000) => { // 1 година за замовчуванням
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  
  get: (key) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    const now = Date.now();
    
    if (now - parsed.timestamp > parsed.ttl) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  }
};

// Функція для оптимізації анімацій
export const optimizeAnimations = () => {
  // Вимикаємо анімації на повільних пристроях
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--animation-duration', '0s');
    return false;
  }
  
  // Перевіряємо продуктивність пристрою
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    // Слабкий пристрій - зменшуємо анімації
    document.documentElement.style.setProperty('--animation-duration', '0.2s');
    return false;
  }
  
  return true;
};

// Функція для моніторингу продуктивності
export const performanceMonitor = {
  init: () => {
    // Моніторинг FPS
    let fps = 0;
    let lastTime = performance.now();
    
    const measureFPS = (currentTime) => {
      fps++;
      if (currentTime >= lastTime + 1000) {
        console.log(`FPS: ${fps}`);
        if (fps < 30) {
          console.warn('Низька продуктивність виявлена');
        }
        fps = 0;
        lastTime = currentTime;
      }
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  },
  
  // Моніторинг використання пам'яті
  checkMemory: () => {
    if ('memory' in performance) {
      const memory = performance.memory;
      console.log({
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
      });
    }
  }
};