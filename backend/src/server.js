const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const { connectDatabase } = require('./database/connection');
const { connectRedis } = require('./cache/redis');
const errorHandler = require('./middleware/errorHandler');
const {
  imageOptimization,
  staticCaching,
  compressionMiddleware,
  securityOptimization,
  etagMiddleware,
  performanceMonitoring,
  jsonOptimization
} = require('./middleware/performanceOptimization');
const {
  generalLimiter,
  authLimiter,
  inputValidation,
  securityLogger,
  contentTypeValidation
} = require('./middleware/security');
const { requestMonitoring } = require('./utils/monitoring');
const backupManager = require('./utils/backup');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const contentRoutes = require('./routes/content');
const progressRoutes = require('./routes/progress');
const shopRoutes = require('./routes/shop');
const paymentRoutes = require('./routes/payments');
const astroRoutes = require('./routes/astro');
const consultationRoutes = require('./routes/consultations');
const seoRoutes = require('./routes/seo');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');
const optimizationRoutes = require('./routes/optimization');

const app = express();
const PORT = process.env.PORT || 4000;

// Налаштування безпеки та оптимізації
app.use(securityOptimization);

// CORS налаштування
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);

// Middleware для оптимізації та безпеки
app.use(requestMonitoring);
app.use(performanceMonitoring);
app.use(securityLogger);
app.use(compressionMiddleware);
app.use(staticCaching);
app.use(imageOptimization);
app.use(etagMiddleware);
app.use(jsonOptimization);
app.use(contentTypeValidation);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(inputValidation);

// Логування запитів
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API маршрути
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/astro', astroRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/optimization', optimizationRoutes);

// 404 обробник
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Маршрут не знайдено',
    path: req.originalUrl
  });
});

// Глобальний обробник помилок
app.use(errorHandler);

// Запуск сервера
async function startServer() {
  try {
    // Підключення до бази даних
    await connectDatabase();
    logger.info('✅ Підключено до PostgreSQL');

    // Підключення до Redis
    await connectRedis();
    logger.info('✅ Підключено до Redis');

    // Запуск backup scheduler
    if (process.env.NODE_ENV === 'production') {
      backupManager.scheduleBackups();
      logger.info('🔄 Backup scheduler запущено');
    }

    // Запуск сервера
    app.listen(PORT, () => {
      logger.info(`🚀 Сервер запущено на порту ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔒 Security middleware активовано`);
      logger.info(`📈 Monitoring активовано`);
      logger.info(`🌍 Середовище: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Помилка запуску сервера:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM отримано, завершення роботи...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT отримано, завершення роботи...');
  process.exit(0);
});

// Запускаємо сервер тільки якщо файл викликається напряму (не в тестах)
if (require.main === module) {
  startServer();
}

module.exports = app;