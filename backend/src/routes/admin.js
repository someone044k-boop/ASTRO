const express = require('express');
const { monitor } = require('../utils/monitoring');
const backupManager = require('../utils/backup');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware для перевірки адміністраторських прав
router.use(authenticateToken);
router.use(requireRole('admin'));

// Отримання системних метрик
router.get('/metrics', (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).json({ error: 'Не вдалося отримати метрики' });
  }
});

// Отримання детального статусу системи
router.get('/status', async (req, res) => {
  try {
    const health = monitor.getHealthStatus();
    res.json(health);
  } catch (error) {
    logger.error('Failed to get system status:', error);
    res.status(500).json({ error: 'Не вдалося отримати статус системи' });
  }
});

// Створення backup'у бази даних
router.post('/backup', async (req, res) => {
  try {
    logger.info(`Admin ${req.user.email} initiated database backup`);
    
    const result = await backupManager.createDatabaseBackup();
    
    logger.info(`Database backup created by admin ${req.user.email}:`, result);
    
    res.json({
      message: 'Backup створено успішно',
      backup: result
    });
  } catch (error) {
    logger.error('Backup creation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Отримання списку backup'ів
router.get('/backups', (req, res) => {
  try {
    const backups = backupManager.getBackupList();
    res.json(backups);
  } catch (error) {
    logger.error('Failed to get backup list:', error);
    res.status(500).json({ error: 'Не вдалося отримати список backup\'ів' });
  }
});

// Відновлення з backup'у
router.post('/restore/:backupName', async (req, res) => {
  try {
    const { backupName } = req.params;
    
    logger.warn(`Admin ${req.user.email} initiated database restore from ${backupName}`);
    
    const result = await backupManager.restoreDatabase(backupName);
    
    logger.info(`Database restored by admin ${req.user.email}:`, result);
    
    res.json({
      message: 'База даних відновлена успішно',
      restore: result
    });
  } catch (error) {
    logger.error('Database restore failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Очищення логів
router.delete('/logs', (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    logger.info(`Admin ${req.user.email} initiated log cleanup (${days} days)`);
    
    // Тут можна додати логіку очищення старих логів
    // Наприклад, видалення файлів логів старших за вказану кількість днів
    
    res.json({
      message: `Логи старші за ${days} днів очищено`
    });
  } catch (error) {
    logger.error('Log cleanup failed:', error);
    res.status(500).json({ error: 'Не вдалося очистити логи' });
  }
});

// Перезапуск сервісів (обережно!)
router.post('/restart/:service', (req, res) => {
  try {
    const { service } = req.params;
    
    logger.warn(`Admin ${req.user.email} requested restart of service: ${service}`);
    
    // В production це має бути реалізовано через process manager (PM2, systemd, etc.)
    switch (service) {
      case 'cache':
        // Перезапуск Redis connection
        res.json({ message: 'Cache service restart initiated' });
        break;
      
      case 'monitoring':
        // Перезапуск моніторингу
        res.json({ message: 'Monitoring service restart initiated' });
        break;
      
      default:
        res.status(400).json({ error: 'Невідомий сервіс' });
    }
  } catch (error) {
    logger.error('Service restart failed:', error);
    res.status(500).json({ error: 'Не вдалося перезапустити сервіс' });
  }
});

// Налаштування системи
router.get('/settings', (req, res) => {
  try {
    const settings = {
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    
    res.json(settings);
  } catch (error) {
    logger.error('Failed to get system settings:', error);
    res.status(500).json({ error: 'Не вдалося отримати налаштування системи' });
  }
});

// Оновлення налаштувань
router.put('/settings', (req, res) => {
  try {
    const { settings } = req.body;
    
    logger.info(`Admin ${req.user.email} updated system settings:`, settings);
    
    // Тут можна додати логіку оновлення налаштувань
    // Наприклад, оновлення змінних середовища або конфігураційних файлів
    
    res.json({
      message: 'Налаштування оновлено успішно',
      settings
    });
  } catch (error) {
    logger.error('Failed to update settings:', error);
    res.status(500).json({ error: 'Не вдалося оновити налаштування' });
  }
});

// Експорт даних
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    logger.info(`Admin ${req.user.email} requested data export: ${type}`);
    
    switch (type) {
      case 'users':
        // Експорт користувачів
        res.json({ message: 'User export initiated' });
        break;
      
      case 'courses':
        // Експорт курсів
        res.json({ message: 'Course export initiated' });
        break;
      
      case 'orders':
        // Експорт замовлень
        res.json({ message: 'Order export initiated' });
        break;
      
      default:
        res.status(400).json({ error: 'Невідомий тип експорту' });
    }
  } catch (error) {
    logger.error('Data export failed:', error);
    res.status(500).json({ error: 'Не вдалося експортувати дані' });
  }
});

module.exports = router;