const compression = require('compression');
const helmet = require('helmet');

// Middleware для оптимізації зображень
const imageOptimization = (req, res, next) => {
  // Встановлюємо заголовки для кешування зображень
  if (req.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 рік
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  }
  
  next();
};

// Middleware для кешування статичних ресурсів
const staticCaching = (req, res, next) => {
  // CSS та JS файли
  if (req.url.match(/\.(css|js)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 рік
  }
  
  // HTML файли
  if (req.url.match(/\.html$/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 година
  }
  
  // API відповіді
  if (req.url.startsWith('/api/')) {
    // Кешування для GET запитів контенту
    if (req.method === 'GET' && 
        (req.url.includes('/content/') || 
         req.url.includes('/courses/') ||
         req.url.includes('/shop/'))) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 хвилин
    }
  }
  
  next();
};

// Middleware для стиснення відповідей
const compressionMiddleware = compression({
  filter: (req, res) => {
    // Не стискаємо вже стиснені файли
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Стискаємо все інше
    return compression.filter(req, res);
  },
  level: 6, // Баланс між швидкістю та розміром
  threshold: 1024 // Стискаємо тільки файли більше 1KB
});

// Middleware для оптимізації безпеки
const securityOptimization = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://js.stripe.com"]
    }
  },
  crossOriginEmbedderPolicy: false, // Для сумісності з iframe
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Middleware для ETag
const etagMiddleware = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (req.method === 'GET' && res.statusCode === 200) {
      const etag = require('crypto')
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');
      
      res.setHeader('ETag', `"${etag}"`);
      
      if (req.headers['if-none-match'] === `"${etag}"`) {
        res.status(304).end();
        return;
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware для моніторингу продуктивності
const performanceMonitoring = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  // Зберігаємо оригінальний метод end
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Конвертуємо в мілісекунди
    
    // Логуємо повільні запити
    if (duration > 1000) { // Більше 1 секунди
      console.warn(`Повільний запит: ${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
    }
    
    // Додаємо заголовок з часом відповіді тільки якщо заголовки ще не відправлені
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    }
    
    // Викликаємо оригінальний метод
    return originalEnd.apply(this, args);
  };
  
  next();
};

// Middleware для оптимізації JSON відповідей
const jsonOptimization = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Видаляємо null та undefined значення для зменшення розміру
    const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
      return value === null || value === undefined ? undefined : value;
    }));
    
    originalJson.call(this, cleanData);
  };
  
  next();
};

module.exports = {
  imageOptimization,
  staticCaching,
  compressionMiddleware,
  securityOptimization,
  etagMiddleware,
  performanceMonitoring,
  jsonOptimization
};