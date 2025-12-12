const express = require('express');
const queryOptimizer = require('../utils/queryOptimizer');
const codeAnalyzer = require('../utils/codeAnalyzer');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware для перевірки адміністраторських прав
router.use(authenticateToken);
router.use(requireRole('admin'));

// Аналіз продуктивності запитів
router.get('/queries/slow', (req, res) => {
  try {
    const slowQueries = queryOptimizer.getSlowQueries();
    res.json({
      count: slowQueries.length,
      queries: slowQueries
    });
  } catch (error) {
    logger.error('Failed to get slow queries:', error);
    res.status(500).json({ error: 'Не вдалося отримати повільні запити' });
  }
});

// Статистика кешу запитів
router.get('/queries/cache', (req, res) => {
  try {
    const cacheStats = queryOptimizer.getCacheStats();
    res.json(cacheStats);
  } catch (error) {
    logger.error('Failed to get cache stats:', error);
    res.status(500).json({ error: 'Не вдалося отримати статистику кешу' });
  }
});

// Очищення кешу запитів
router.delete('/queries/cache', (req, res) => {
  try {
    queryOptimizer.clearCache();
    logger.info(`Query cache cleared by admin ${req.user.email}`);
    res.json({ message: 'Кеш запитів очищено' });
  } catch (error) {
    logger.error('Failed to clear cache:', error);
    res.status(500).json({ error: 'Не вдалося очистити кеш' });
  }
});

// Аналіз конкретного запиту
router.post('/queries/analyze', async (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL запит обов\'язковий' });
    }

    logger.info(`Admin ${req.user.email} analyzing query: ${sql.substring(0, 100)}...`);
    
    const analysis = await queryOptimizer.analyzeQuery(sql);
    res.json(analysis);
  } catch (error) {
    logger.error('Query analysis failed:', error);
    res.status(500).json({ error: 'Не вдалося проаналізувати запит' });
  }
});

// Створення рекомендованих індексів
router.post('/database/indexes', async (req, res) => {
  try {
    logger.info(`Admin ${req.user.email} creating recommended indexes`);
    
    const results = await queryOptimizer.createRecommendedIndexes();
    
    const successful = results.filter(r => r.status === 'created').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    logger.info(`Indexes creation completed: ${successful} successful, ${failed} failed`);
    
    res.json({
      message: `Створено ${successful} індексів, ${failed} помилок`,
      results
    });
  } catch (error) {
    logger.error('Index creation failed:', error);
    res.status(500).json({ error: 'Не вдалося створити індекси' });
  }
});

// Аналіз використання індексів
router.get('/database/indexes/usage', async (req, res) => {
  try {
    const usage = await queryOptimizer.analyzeIndexUsage();
    res.json(usage);
  } catch (error) {
    logger.error('Index usage analysis failed:', error);
    res.status(500).json({ error: 'Не вдалося проаналізувати використання індексів' });
  }
});

// Пошук невикористовуваних індексів
router.get('/database/indexes/unused', async (req, res) => {
  try {
    const unusedIndexes = await queryOptimizer.findUnusedIndexes();
    res.json({
      count: unusedIndexes.length,
      indexes: unusedIndexes
    });
  } catch (error) {
    logger.error('Unused indexes analysis failed:', error);
    res.status(500).json({ error: 'Не вдалося знайти невикористовувані індекси' });
  }
});

// Аналіз коду проекту
router.post('/code/analyze', async (req, res) => {
  try {
    const { path: projectPath } = req.body;
    
    logger.info(`Admin ${req.user.email} started code analysis for path: ${projectPath || 'default'}`);
    
    const analysis = await codeAnalyzer.analyzeProject(projectPath);
    
    logger.info(`Code analysis completed for admin ${req.user.email}`);
    
    res.json(analysis);
  } catch (error) {
    logger.error('Code analysis failed:', error);
    res.status(500).json({ error: 'Не вдалося проаналізувати код' });
  }
});

// Оптимізація бази даних
router.post('/database/optimize', async (req, res) => {
  try {
    logger.info(`Admin ${req.user.email} started database optimization`);
    
    const optimizations = [];
    
    // VACUUM ANALYZE для всіх таблиць
    const tables = [
      'users', 'courses', 'lessons', 'user_progress', 
      'orders', 'payment_transactions', 'consultations'
    ];
    
    for (const table of tables) {
      try {
        await queryOptimizer.executeQuery(`VACUUM ANALYZE ${table}`);
        optimizations.push({ table, status: 'optimized' });
      } catch (error) {
        optimizations.push({ table, status: 'failed', error: error.message });
      }
    }
    
    // Оновлення статистики
    try {
      await queryOptimizer.executeQuery('ANALYZE');
      optimizations.push({ operation: 'statistics_update', status: 'completed' });
    } catch (error) {
      optimizations.push({ operation: 'statistics_update', status: 'failed', error: error.message });
    }
    
    logger.info(`Database optimization completed by admin ${req.user.email}`);
    
    res.json({
      message: 'Оптимізація бази даних завершена',
      results: optimizations
    });
  } catch (error) {
    logger.error('Database optimization failed:', error);
    res.status(500).json({ error: 'Не вдалося оптимізувати базу даних' });
  }
});

// Статистика розміру таблиць
router.get('/database/tables/size', async (req, res) => {
  try {
    const query = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;
    
    const result = await queryOptimizer.executeQuery(query);
    res.json(result.rows);
  } catch (error) {
    logger.error('Table size analysis failed:', error);
    res.status(500).json({ error: 'Не вдалося отримати розміри таблиць' });
  }
});

// Статистика активності таблиць
router.get('/database/tables/activity', async (req, res) => {
  try {
    const query = `
      SELECT 
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        n_tup_ins,
        n_tup_upd,
        n_tup_del
      FROM pg_stat_user_tables
      ORDER BY seq_scan + idx_scan DESC;
    `;
    
    const result = await queryOptimizer.executeQuery(query);
    res.json(result.rows);
  } catch (error) {
    logger.error('Table activity analysis failed:', error);
    res.status(500).json({ error: 'Не вдалося отримати активність таблиць' });
  }
});

// Очищення старих даних
router.delete('/database/cleanup', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    logger.info(`Admin ${req.user.email} started database cleanup (${days} days)`);
    
    const cleanupResults = [];
    
    // Очищення старих логів (якщо є таблиця логів)
    try {
      const logsQuery = `DELETE FROM logs WHERE created_at < NOW() - INTERVAL '${days} days'`;
      const logsResult = await queryOptimizer.executeQuery(logsQuery);
      cleanupResults.push({ 
        table: 'logs', 
        deleted: logsResult.rowCount || 0,
        status: 'completed'
      });
    } catch (error) {
      cleanupResults.push({ 
        table: 'logs', 
        status: 'failed', 
        error: error.message 
      });
    }
    
    // Очищення старих сесій
    try {
      const sessionsQuery = `DELETE FROM user_sessions WHERE expires_at < NOW()`;
      const sessionsResult = await queryOptimizer.executeQuery(sessionsQuery);
      cleanupResults.push({ 
        table: 'user_sessions', 
        deleted: sessionsResult.rowCount || 0,
        status: 'completed'
      });
    } catch (error) {
      cleanupResults.push({ 
        table: 'user_sessions', 
        status: 'failed', 
        error: error.message 
      });
    }
    
    logger.info(`Database cleanup completed by admin ${req.user.email}:`, cleanupResults);
    
    res.json({
      message: `Очищення даних старших за ${days} днів завершено`,
      results: cleanupResults
    });
  } catch (error) {
    logger.error('Database cleanup failed:', error);
    res.status(500).json({ error: 'Не вдалося очистити базу даних' });
  }
});

module.exports = router;