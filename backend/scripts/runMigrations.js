const fs = require('fs');
const path = require('path');
const { query } = require('../src/database/connection');
const logger = require('../src/utils/logger');

async function runMigrations() {
  try {
    logger.info('Початок виконання міграцій...');

    // Створюємо таблицю для відстеження міграцій
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Отримуємо список виконаних міграцій
    const executedMigrations = await query('SELECT filename FROM migrations');
    const executedFiles = executedMigrations.rows.map(row => row.filename);

    // Читаємо файли міграцій
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    logger.info(`Знайдено ${migrationFiles.length} файлів міграцій`);

    for (const filename of migrationFiles) {
      if (executedFiles.includes(filename)) {
        logger.info(`Міграція ${filename} вже виконана, пропускаємо`);
        continue;
      }

      logger.info(`Виконання міграції: ${filename}`);
      
      const filePath = path.join(migrationsDir, filename);
      const migrationSQL = fs.readFileSync(filePath, 'utf8');

      try {
        // Виконуємо міграцію
        await query(migrationSQL);
        
        // Записуємо в таблицю міграцій
        await query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [filename]
        );

        logger.info(`✅ Міграція ${filename} виконана успішно`);
      } catch (error) {
        logger.error(`❌ Помилка виконання міграції ${filename}:`, error.message);
        throw error;
      }
    }

    logger.info('✅ Всі міграції виконано успішно');
  } catch (error) {
    logger.error('❌ Помилка виконання міграцій:', error.message);
    process.exit(1);
  }
}

// Запускаємо міграції якщо файл викликається напряму
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Міграції завершено');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Критична помилка:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };