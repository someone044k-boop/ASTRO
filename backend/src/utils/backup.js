const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class BackupManager {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
    this.maxBackups = parseInt(process.env.MAX_BACKUPS) || 7; // Зберігаємо 7 останніх backup'ів
    
    // Створюємо папку для backup'ів якщо не існує
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createDatabaseBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup_${timestamp}.sql`;
      const backupPath = path.join(this.backupDir, backupFileName);

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'learning_school',
        username: process.env.DB_USER || 'postgres'
      };

      // Команда для створення backup'у PostgreSQL
      const pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -f ${backupPath} --no-password`;

      // Встановлюємо пароль через змінну середовища
      const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };

      logger.info(`Creating database backup: ${backupFileName}`);
      
      execSync(pgDumpCommand, { env, stdio: 'pipe' });
      
      logger.info(`Database backup created successfully: ${backupPath}`);

      // Очищуємо старі backup'и
      await this.cleanOldBackups();

      return {
        success: true,
        fileName: backupFileName,
        path: backupPath,
        size: this.getFileSize(backupPath)
      };
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async restoreDatabase(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'learning_school',
        username: process.env.DB_USER || 'postgres'
      };

      // Команда для відновлення PostgreSQL
      const psqlCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -f ${backupPath}`;

      const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };

      logger.info(`Restoring database from backup: ${backupFileName}`);
      
      execSync(psqlCommand, { env, stdio: 'pipe' });
      
      logger.info(`Database restored successfully from: ${backupPath}`);

      return {
        success: true,
        fileName: backupFileName,
        restoredAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  async cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          mtime: fs.statSync(path.join(this.backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime); // Сортуємо за датою (новіші спочатку)

      // Видаляємо старі backup'и
      if (files.length > this.maxBackups) {
        const filesToDelete = files.slice(this.maxBackups);
        
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          logger.info(`Old backup deleted: ${file.name}`);
        }
      }
    } catch (error) {
      logger.error('Failed to clean old backups:', error);
    }
  }

  getBackupList() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            name: file,
            size: this.getFileSize(filePath),
            created: stats.mtime.toISOString(),
            sizeBytes: stats.size
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));

      return files;
    } catch (error) {
      logger.error('Failed to get backup list:', error);
      return [];
    }
  }

  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const bytes = stats.size;
      
      if (bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    } catch (error) {
      return 'Unknown';
    }
  }

  // Автоматичний backup за розкладом
  scheduleBackups() {
    const backupInterval = process.env.BACKUP_INTERVAL || '0 2 * * *'; // Щодня о 2:00 за замовчуванням
    
    // Простий scheduler (в production краще використовувати cron)
    const runBackup = async () => {
      try {
        await this.createDatabaseBackup();
        logger.info('Scheduled backup completed successfully');
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
      }
    };

    // Запускаємо backup кожні 24 години (в production налаштувати cron)
    setInterval(runBackup, 24 * 60 * 60 * 1000);
    
    logger.info('Backup scheduler started');
  }
}

module.exports = new BackupManager();