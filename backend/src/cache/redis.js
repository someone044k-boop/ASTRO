const redis = require('redis');
const logger = require('../utils/logger');

// Стан підключення Redis
let isRedisConnected = false;
let client = null;

// Конфігурація Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
};

// In-memory fallback кеш
const memoryCache = new Map();

// Функція підключення до Redis
async function connectRedis() {
  try {
    client = redis.createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Redis недоступний, використовуємо in-memory кеш');
            return false;
          }
          return Math.min(retries * 100, 1000);
        }
      }
    });

    client.on('connect', () => {
      logger.info(`Підключення до Redis: ${redisConfig.host}:${redisConfig.port}`);
    });

    client.on('ready', () => {
      isRedisConnected = true;
      logger.info('✅ Redis готовий до роботи');
    });

    client.on('error', (error) => {
      isRedisConnected = false;
      logger.warn('Redis помилка:', error.message);
    });

    client.on('end', () => {
      isRedisConnected = false;
      logger.info('З\'єднання з Redis закрито');
    });

    await client.connect();
    await client.ping();
    isRedisConnected = true;
    logger.info('Redis ping успішний');
    
    return client;
  } catch (error) {
    isRedisConnected = false;
    logger.warn('Redis недоступний, використовуємо in-memory кеш:', error.message);
    return null;
  }
}

// Функції для роботи з кешем (з fallback на in-memory)
const cache = {
  // Встановити значення з TTL
  async set(key, value, ttlSeconds = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (isRedisConnected && client) {
        await client.setEx(key, ttlSeconds, serializedValue);
      } else {
        // In-memory fallback
        memoryCache.set(key, {
          value: serializedValue,
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      }
      logger.debug(`Кеш встановлено: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      logger.warn(`Помилка встановлення кешу ${key}:`, error.message);
      // Fallback to memory
      memoryCache.set(key, {
        value: JSON.stringify(value),
        expiry: Date.now() + (ttlSeconds * 1000)
      });
    }
  },

  // Отримати значення
  async get(key) {
    try {
      if (isRedisConnected && client) {
        const value = await client.get(key);
        if (value === null) return null;
        return JSON.parse(value);
      } else {
        // In-memory fallback
        const cached = memoryCache.get(key);
        if (!cached || cached.expiry < Date.now()) {
          memoryCache.delete(key);
          return null;
        }
        return JSON.parse(cached.value);
      }
    } catch (error) {
      logger.warn(`Помилка отримання кешу ${key}:`, error.message);
      return null;
    }
  },

  // Видалити значення
  async del(key) {
    try {
      if (isRedisConnected && client) {
        return await client.del(key);
      } else {
        memoryCache.delete(key);
        return 1;
      }
    } catch (error) {
      logger.warn(`Помилка видалення кешу ${key}:`, error.message);
      memoryCache.delete(key);
      return 0;
    }
  },

  // Перевірити існування ключа
  async exists(key) {
    try {
      if (isRedisConnected && client) {
        return (await client.exists(key)) === 1;
      } else {
        const cached = memoryCache.get(key);
        return cached && cached.expiry > Date.now();
      }
    } catch (error) {
      return false;
    }
  },

  // Очистити весь кеш
  async flushAll() {
    try {
      if (isRedisConnected && client) {
        await client.flushAll();
      }
      memoryCache.clear();
      logger.warn('Весь кеш очищено');
    } catch (error) {
      memoryCache.clear();
    }
  }
};

// Функція закриття з'єднання
async function closeRedis() {
  try {
    await client.quit();
    logger.info('З\'єднання з Redis закрито');
  } catch (error) {
    logger.error('Помилка закриття Redis:', error);
  }
}

module.exports = {
  connectRedis,
  closeRedis,
  cache,
  client
};