const express = require('express');
const { monitor } = require('../utils/monitoring');
const { getRedisClient } = require('../cache/redis');
const { pool } = require('../database/connection');
const logger = require('../utils/logger');

const router = express.Router();

// Базовий health check
router.get('/', (req, res) => {
  const health = monitor.getHealthStatus();
  
  const statusCode = health.status === 'critical' ? 503 : 
                    health.status === 'warning' ? 200 : 200;
  
  res.status(statusCode).json({
    status: health.status,
    timestamp: health.timestamp,
    uptime: health.uptime,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Детальний health check
router.get('/detailed', async (req, res) => {
  try {
    const health = monitor.getHealthStatus();
    
    // Перевірка бази даних
    let databaseStatus = 'healthy';
    let databaseLatency = 0;
    
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      databaseLatency = Date.now() - start;
      
      if (databaseLatency > 1000) {
        databaseStatus = 'warning';
      }
    } catch (error) {
      databaseStatus = 'critical';
      logger.error('Database health check failed:', error);
    }

    // Перевірка Redis
    let redisStatus = 'healthy';
    let redisLatency = 0;
    
    try {
      const redis = getRedisClient();
      const start = Date.now();
      await redis.ping();
      redisLatency = Date.now() - start;
      
      if (redisLatency > 500) {
        redisStatus = 'warning';
      }
    } catch (error) {
      redisStatus = 'critical';
      logger.error('Redis health check failed:', error);
    }

    // Загальний статус
    let overallStatus = 'healthy';
    if (health.status === 'critical' || databaseStatus === 'critical' || redisStatus === 'critical') {
      overallStatus = 'critical';
    } else if (health.status === 'warning' || databaseStatus === 'warning' || redisStatus === 'warning') {
      overallStatus = 'warning';
    }

    const statusCode = overallStatus === 'critical' ? 503 : 200;

    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: health.uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        application: {
          status: health.status,
          issues: health.issues
        },
        database: {
          status: databaseStatus,
          latency: `${databaseLatency}ms`
        },
        redis: {
          status: redisStatus,
          latency: `${redisLatency}ms`
        }
      },
      metrics: health.metrics
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'critical',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Метрики системи
router.get('/metrics', (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics retrieval failed:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// Liveness probe (для Kubernetes)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe (для Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    // Перевіряємо критичні сервіси
    await pool.query('SELECT 1');
    
    const redis = getRedisClient();
    await redis.ping();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;