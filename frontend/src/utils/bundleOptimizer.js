// Утиліти для оптимізації бандлів та ресурсів

// Функція для динамічного імпорту компонентів
export const dynamicImport = (componentPath) => {
  return import(componentPath).catch(error => {
    console.error(`Failed to load component: ${componentPath}`, error);
    // Повертаємо fallback компонент
    return import('./FallbackComponent');
  });
};

// Функція для preload критичних ресурсів
export const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/static/css/main.css', as: 'style' },
    { href: '/static/js/main.js', as: 'script' },
    { href: '/images/logo.png', as: 'image' },
    { href: '/fonts/main-font.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    
    if (resource.type) link.type = resource.type;
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
    
    document.head.appendChild(link);
  });
};

// Функція для prefetch некритичних ресурсів
export const prefetchResources = (resources) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      resources.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      });
    });
  }
};

// Функція для оптимізації зображень
export const optimizeImage = (src, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'webp'
  } = options;

  // Якщо браузер підтримує WebP
  if (supportsWebP()) {
    let optimizedSrc = src.replace(/\.(jpg|jpeg|png)$/i, `.${format}`);
    
    if (width || height) {
      const params = new URLSearchParams();
      if (width) params.append('w', width);
      if (height) params.append('h', height);
      params.append('q', quality);
      
      optimizedSrc += `?${params.toString()}`;
    }
    
    return optimizedSrc;
  }
  
  return src;
};

// Перевірка підтримки WebP
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// Функція для lazy loading модулів
export const lazyLoadModule = async (moduleName) => {
  try {
    const module = await import(`../modules/${moduleName}`);
    return module.default || module;
  } catch (error) {
    console.error(`Failed to load module: ${moduleName}`, error);
    return null;
  }
};

// Оптимізація CSS критичного шляху
export const inlineCriticalCSS = () => {
  const criticalCSS = `
    /* Критичні стилі для першого екрану */
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 0;
    }
    
    .header {
      background: #8B4513;
      color: white;
      padding: 1rem;
      position: fixed;
      top: 0;
      width: 100%;
      z-index: 1000;
    }
    
    .main-content {
      margin-top: 80px;
      min-height: calc(100vh - 80px);
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
};

// Функція для видалення невикористовуваного CSS
export const removeUnusedCSS = () => {
  // Отримуємо всі стилі
  const stylesheets = Array.from(document.styleSheets);
  const usedSelectors = new Set();
  
  // Збираємо всі використовувані селектори
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    // Додаємо класи
    element.classList.forEach(className => {
      usedSelectors.add(`.${className}`);
    });
    
    // Додаємо ID
    if (element.id) {
      usedSelectors.add(`#${element.id}`);
    }
    
    // Додаємо тег
    usedSelectors.add(element.tagName.toLowerCase());
  });

  // Видаляємо невикористовувані правила (тільки для development)
  if (process.env.NODE_ENV === 'development') {
    stylesheets.forEach(stylesheet => {
      try {
        const rules = Array.from(stylesheet.cssRules || []);
        rules.forEach((rule, index) => {
          if (rule.type === CSSRule.STYLE_RULE) {
            const selector = rule.selectorText;
            if (!usedSelectors.has(selector)) {
              console.log(`Unused CSS rule: ${selector}`);
            }
          }
        });
      } catch (error) {
        // Ігноруємо помилки CORS для зовнішніх стилів
      }
    });
  }
};

// Функція для оптимізації шрифтів
export const optimizeFonts = () => {
  // Preload критичних шрифтів
  const fonts = [
    '/fonts/main-regular.woff2',
    '/fonts/main-bold.woff2'
  ];

  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = font;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Додаємо font-display: swap для всіх шрифтів
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'MainFont';
      src: url('/fonts/main-regular.woff2') format('woff2');
      font-display: swap;
      font-weight: 400;
    }
    
    @font-face {
      font-family: 'MainFont';
      src: url('/fonts/main-bold.woff2') format('woff2');
      font-display: swap;
      font-weight: 700;
    }
  `;
  document.head.appendChild(style);
};

// Функція для оптимізації JavaScript
export const optimizeJavaScript = () => {
  // Видаляємо console.log в production
  if (process.env.NODE_ENV === 'production') {
    const originalLog = console.log;
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    
    // Зберігаємо тільки важливі методи
    console.warn = console.warn;
    console.error = console.error;
  }

  // Оптимізуємо обробники подій
  const optimizedEventListener = (element, event, handler, options = {}) => {
    const optimizedHandler = throttle(handler, options.throttle || 16);
    element.addEventListener(event, optimizedHandler, options);
    
    return () => element.removeEventListener(event, optimizedHandler, options);
  };

  return { optimizedEventListener };
};

// Throttle функція для оптимізації
const throttle = (func, limit) => {
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

// Функція для аналізу продуктивності бандлу
export const analyzeBundlePerformance = () => {
  if (typeof window === 'undefined') return;

  const performance = window.performance;
  if (!performance) return;

  const navigation = performance.getEntriesByType('navigation')[0];
  const resources = performance.getEntriesByType('resource');

  const analysis = {
    pageLoad: {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      firstPaint: 0,
      firstContentfulPaint: 0
    },
    resources: {
      scripts: [],
      styles: [],
      images: [],
      fonts: []
    },
    recommendations: []
  };

  // Аналізуємо Paint метрики
  const paintEntries = performance.getEntriesByType('paint');
  paintEntries.forEach(entry => {
    if (entry.name === 'first-paint') {
      analysis.pageLoad.firstPaint = entry.startTime;
    } else if (entry.name === 'first-contentful-paint') {
      analysis.pageLoad.firstContentfulPaint = entry.startTime;
    }
  });

  // Аналізуємо ресурси
  resources.forEach(resource => {
    const resourceData = {
      name: resource.name,
      size: resource.transferSize,
      loadTime: resource.responseEnd - resource.fetchStart,
      type: getResourceType(resource.name)
    };

    switch (resourceData.type) {
      case 'script':
        analysis.resources.scripts.push(resourceData);
        break;
      case 'style':
        analysis.resources.styles.push(resourceData);
        break;
      case 'image':
        analysis.resources.images.push(resourceData);
        break;
      case 'font':
        analysis.resources.fonts.push(resourceData);
        break;
    }
  });

  // Генеруємо рекомендації
  if (analysis.pageLoad.firstContentfulPaint > 2000) {
    analysis.recommendations.push('Розгляньте оптимізацію критичного CSS');
  }

  const largeScripts = analysis.resources.scripts.filter(s => s.size > 100000);
  if (largeScripts.length > 0) {
    analysis.recommendations.push('Розгляньте code splitting для великих скриптів');
  }

  const unoptimizedImages = analysis.resources.images.filter(i => i.size > 500000);
  if (unoptimizedImages.length > 0) {
    analysis.recommendations.push('Оптимізуйте великі зображення');
  }

  console.log('Bundle Performance Analysis:', analysis);
  return analysis;
};

// Визначення типу ресурсу
const getResourceType = (url) => {
  if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script';
  if (url.match(/\.(css|scss|sass)$/)) return 'style';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
  if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
  return 'other';
};

// Ініціалізація всіх оптимізацій
export const initializeOptimizations = () => {
  // Виконуємо тільки в браузері
  if (typeof window === 'undefined') return;

  // Критичні оптимізації
  inlineCriticalCSS();
  preloadCriticalResources();
  optimizeFonts();

  // Некритичні оптимізації (з затримкою)
  setTimeout(() => {
    const nonCriticalResources = [
      '/static/js/vendor.js',
      '/static/css/non-critical.css'
    ];
    prefetchResources(nonCriticalResources);
  }, 2000);

  // Аналіз продуктивності (тільки в development)
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      setTimeout(analyzeBundlePerformance, 1000);
    });
  }
};