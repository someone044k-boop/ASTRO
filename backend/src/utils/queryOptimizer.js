const { pool } = require('../database/connection');
const logger = require('./logger');

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.slowQueries = [];
    this.maxCacheSize = 100;
    this.slowQueryThreshold = 1000; // 1 секунда
  }

  // Виконання оптимізованого запиту з кешуванням
  async executeQuery(sql, params = [], options = {}) {
    const { 
      cache = false, 
      cacheTTL = 300000, // 5 хвилин
      timeout = 30000 // 30 секунд
    } = options;

    const cacheKey = this.generateCacheKey(sql, params);
    const startTime = Date.now();

    try {
      // Перевіряємо кеш
      if (cache && this.queryCache.has(cacheKey)) {
        const cached = this.queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < cacheTTL) {
          logger.debug(`Query cache hit: ${cacheKey}`);
          return cached.result;
        } else {
          this.queryCache.delete(cacheKey);
        }
      }

      // Виконуємо запит з timeout
      const client = await pool.connect();
      
      try {
        // Встановлюємо timeout для запиту
        await client.query('SET statement_timeout = $1', [timeout]);
        
        const result = await client.query(sql, params);
        const executionTime = Date.now() - startTime;

        // Логуємо повільні запити
        if (executionTime > this.slowQueryThreshold) {
          this.logSlowQuery(sql, params, executionTime);
        }

        // Кешуємо результат якщо потрібно
        if (cache && result.rows) {
          this.cacheResult(cacheKey, result, cacheTTL);
        }

        logger.debug(`Query executed in ${executionTime}ms: ${sql.substring(0, 100)}...`);
        
        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Query failed after ${executionTime}ms:`, {
        sql: sql.substring(0, 200),
        params,
        error: error.message
      });
      throw error;
    }
  }

  // Генерація ключа для кешу
  generateCacheKey(sql, params) {
    return `${sql}_${JSON.stringify(params)}`;
  }

  // Кешування результату
  cacheResult(key, result, ttl) {
    // Обмежуємо розмір кешу
    if (this.queryCache.size >= this.maxCacheSize) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }

    this.queryCache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });
  }

  // Логування повільних запитів
  logSlowQuery(sql, params, executionTime) {
    const slowQuery = {
      sql: sql.substring(0, 500),
      params,
      executionTime,
      timestamp: new Date().toISOString()
    };

    this.slowQueries.push(slowQuery);
    
    // Зберігаємо тільки останні 50 повільних запитів
    if (this.slowQueries.length > 50) {
      this.slowQueries.shift();
    }

    logger.warn(`Slow query detected (${executionTime}ms):`, slowQuery);
  }

  // Отримання статистики повільних запитів
  getSlowQueries() {
    return this.slowQueries.sort((a, b) => b.executionTime - a.executionTime);
  }

  // Очищення кешу
  clearCache() {
    this.queryCache.clear();
    logger.info('Query cache cleared');
  }

  // Статистика кешу
  getCacheStats() {
    return {
      size: this.queryCache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.calculateHitRate()
    };
  }

  calculateHitRate() {
    // Простий розрахунок hit rate (можна покращити)
    return this.queryCache.size > 0 ? 
      Math.round((this.queryCache.size / this.maxCacheSize) * 100) : 0;
  }

  // Аналіз та рекомендації по оптимізації
  async analyzeQuery(sql) {
    try {
      const explainResult = await pool.query(`EXPLAIN ANALYZE ${sql}`);
      
      const analysis = {
        executionPlan: explainResult.rows,
        recommendations: this.generateRecommendations(explainResult.rows)
      };

      return analysis;
    } catch (error) {
      logger.error('Query analysis failed:', error);
      throw error;
    }
  }

  generateRecommendations(executionPlan) {
    const recommendations = [];
    const planText = executionPlan.map(row => row['QUERY PLAN']).join('\n');

    // Перевіряємо на Seq Scan
    if (planText.includes('Seq Scan')) {
      recommendations.push({
        type: 'index',
        message: 'Розгляньте додавання індексу для уникнення Seq Scan',
        priority: 'high'
      });
    }

    // Перевіряємо на Sort операції
    if (planText.includes('Sort')) {
      recommendations.push({
        type: 'sort',
        message: 'Розгляньте додавання індексу для ORDER BY операцій',
        priority: 'medium'
      });
    }

    // Перевіряємо на Hash Join
    if (planText.includes('Hash Join')) {
      recommendations.push({
        type: 'join',
        message: 'Перевірте чи є індекси на колонках для JOIN',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  // Створення рекомендованих індексів
  async createRecommendedIndexes() {
    const indexes = [
      // Індекси для користувачів
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',
      
      // Індекси для курсів
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_level ON courses(level)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_active ON courses(is_active)',
      
      // Індекси для уроків
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_course_id ON lessons(course_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_order ON lessons(lesson_order)',
      
      // Індекси для прогресу
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_user_course ON user_progress(user_id, course_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_updated ON user_progress(updated_at)',
      
      // Індекси для замовлень
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created ON orders(created_at)',
      
      // Індекси для платежів
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_order_id ON payment_transactions(order_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payment_transactions(status)',
      
      // Індекси для консультацій
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_user_id ON consultations(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_date ON consultations(consultation_date)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_status ON consultations(status)'
    ];

    const results = [];

    for (const indexSql of indexes) {
      try {
        await pool.query(indexSql);
        results.push({ sql: indexSql, status: 'created' });
        logger.info(`Index created: ${indexSql}`);
      } catch (error) {
        results.push({ sql: indexSql, status: 'failed', error: error.message });
        logger.warn(`Index creation failed: ${indexSql}`, error);
      }
    }

    return results;
  }

  // Аналіз використання індексів
  async analyzeIndexUsage() {
    const query = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      ORDER BY idx_scan DESC;
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Index usage analysis failed:', error);
      throw error;
    }
  }

  // Пошук неиспользуемых індексів
  async findUnusedIndexes() {
    const query = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan
      FROM pg_stat_user_indexes 
      WHERE idx_scan = 0
      AND indexname NOT LIKE '%_pkey';
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Unused indexes analysis failed:', error);
      throw error;
    }
  }
}

module.exports = new QueryOptimizer();