const { Pool } = require('pg');
const logger = require('../utils/logger');

// Конфігурація підключення до PostgreSQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'learning_school',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  max: 20, // максимум з'єднань в пулі
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Створення пулу з'єднань
const pool = new Pool(dbConfig);

// Обробка помилок пулу
pool.on('error', (err) => {
  logger.error('Неочікувана помилка PostgreSQL клієнта:', err);
});

// Функція підключення та перевірки
async function connectDatabase() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    logger.info(`Підключено до PostgreSQL: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    logger.info(`Час сервера БД: ${result.rows[0].now}`);
    
    return pool;
  } catch (error) {
    logger.error('Помилка підключення до PostgreSQL:', error.message);
    throw error;
  }
}

// Функція виконання запиту
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug(`Виконано запит за ${duration}ms: ${text}`);
    return result;
  } catch (error) {
    logger.error('Помилка виконання запиту:', error.message);
    logger.error('Запит:', text);
    logger.error('Параметри:', params);
    throw error;
  }
}

// Функція отримання клієнта для транзакцій
async function getClient() {
  return await pool.connect();
}

// Функція закриття пулу
async function closeDatabase() {
  try {
    await pool.end();
    logger.info('Пул з\'єднань PostgreSQL закрито');
  } catch (error) {
    logger.error('Помилка закриття пулу PostgreSQL:', error);
  }
}

module.exports = {
  connectDatabase,
  query,
  getClient,
  closeDatabase,
  pool
};