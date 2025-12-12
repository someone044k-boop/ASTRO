const os = require('os');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class SystemMonitor {
  constructor() {
    this.metrics = {
      cpu: 0,
      memory: { used: 0, total: 0, percentage: 0 },
      disk: { used: 0, total: 0, percentage: 0 },
      uptime: 0,
      requests: { total: 0, errors: 0, avgResponseTime: 0 },
      database: { connections: 0, queries: 0, errors: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0 }
    };
    
    this.requestTimes = [];
    this.maxRequestTimes = 1000; // Зберігаємо останні 1000 запитів
    
    // Запускаємо моніторинг кожні 30 секунд
    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
    }, 30000);
  }

  collectMetrics() {
    // CPU використання
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    this.metrics.cpu = Math.round(100 - (totalIdle / totalTick) * 100);

    // Пам'ять
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    this.metrics.memory = {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      percentage: Math.round((usedMem / totalMem) * 100)
    };

    // Uptime
    this.metrics.uptime = Math.round(process.uptime());

    // Середній час відповіді
    if (this.requestTimes.length > 0) {
      const sum = this.requestTimes.reduce((a, b) => a + b, 0);
      this.metrics.requests.avgResponseTime = Math.round(sum / this.requestTimes.length);
    }

    // Логуємо метрики
    logger.info('System metrics collected', this.metrics);
  }

  recordRequest(responseTime, isError = false) {
    this.metrics.requests.total++;
    
    if (isError) {
      this.metrics.requests.errors++;
    }

    // Додаємо час відповіді
    this.requestTimes.push(responseTime);
    
    // Обмежуємо розмір масиву
    if (this.requestTimes.length > this.maxRequestTimes) {
      this.requestTimes.shift();
    }
  }

  recordDatabaseQuery(isError = false) {
    this.metrics.database.queries++;
    
    if (isError) {
      this.metrics.database.errors++;
    }
  }

  recordCacheHit(isHit = true) {
    if (isHit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }
    
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 ? Math.round((this.metrics.cache.hits / total) * 100) : 0;
  }

  checkAlerts() {
    const alerts = [];

    // Перевірка CPU
    if (this.metrics.cpu > 80) {
      alerts.push({
        type: 'cpu',
        level: 'warning',
        message: `Високе використання CPU: ${this.metrics.cpu}%`
      });
    }

    // Перевірка пам'яті
    if (this.metrics.memory.percentage > 85) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `Високе використання пам'яті: ${this.metrics.memory.percentage}%`
      });
    }

    // Перевірка помилок
    const errorRate = this.metrics.requests.total > 0 ? 
      (this.metrics.requests.errors / this.metrics.requests.total) * 100 : 0;
    
    if (errorRate > 5) {
      alerts.push({
        type: 'errors',
        level: 'critical',
        message: `Високий рівень помилок: ${errorRate.toFixed(2)}%`
      });
    }

    // Перевірка часу відповіді
    if (this.metrics.requests.avgResponseTime > 2000) {
      alerts.push({
        type: 'response_time',
        level: 'warning',
        message: `Повільний час відповіді: ${this.metrics.requests.avgResponseTime}ms`
      });
    }

    // Відправляємо алерти
    alerts.forEach(alert => {
      if (alert.level === 'critical') {
        logger.error(`CRITICAL ALERT: ${alert.message}`, alert);
      } else {
        logger.warn(`WARNING ALERT: ${alert.message}`, alert);
      }
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      errorRate: this.metrics.requests.total > 0 ? 
        ((this.metrics.requests.errors / this.metrics.requests.total) * 100).toFixed(2) : 0
    };
  }

  getHealthStatus() {
    const metrics = this.getMetrics();
    
    let status = 'healthy';
    const issues = [];

    if (metrics.cpu > 80) {
      status = 'warning';
      issues.push('High CPU usage');
    }

    if (metrics.memory.percentage > 85) {
      status = 'warning';
      issues.push('High memory usage');
    }

    if (metrics.errorRate > 5) {
      status = 'critical';
      issues.push('High error rate');
    }

    if (metrics.requests.avgResponseTime > 2000) {
      status = 'warning';
      issues.push('Slow response time');
    }

    return {
      status,
      issues,
      metrics,
      uptime: metrics.uptime,
      timestamp: metrics.timestamp
    };
  }
}

// Singleton instance
const monitor = new SystemMonitor();

// Middleware для моніторингу запитів
const requestMonitoring = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const responseTime = Number(end - start) / 1000000; // Конвертуємо в мілісекунди
    
    const isError = res.statusCode >= 400;
    monitor.recordRequest(responseTime, isError);
  });
  
  next();
};

module.exports = {
  monitor,
  requestMonitoring
};