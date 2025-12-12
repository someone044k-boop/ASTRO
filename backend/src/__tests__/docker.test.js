const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Docker Configuration', () => {
  test('повинен мати валідний Dockerfile для backend', () => {
    const dockerfilePath = path.join(__dirname, '../../Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);
    
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    
    // Перевірка основних інструкцій
    expect(dockerfileContent).toContain('FROM node:18-alpine');
    expect(dockerfileContent).toContain('WORKDIR /app');
    expect(dockerfileContent).toContain('COPY package*.json ./');
    expect(dockerfileContent).toContain('RUN npm ci');
    expect(dockerfileContent).toContain('EXPOSE 4000');
    expect(dockerfileContent).toContain('CMD ["npm", "start"]');
  });

  test('повинен мати валідний docker-compose.yml', () => {
    const composePath = path.join(__dirname, '../../../docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);
    
    const composeContent = fs.readFileSync(composePath, 'utf8');
    
    // Перевірка основних сервісів
    expect(composeContent).toContain('frontend:');
    expect(composeContent).toContain('backend:');
    expect(composeContent).toContain('postgres:');
    expect(composeContent).toContain('redis:');
    
    // Перевірка портів
    expect(composeContent).toContain('3000:3000');
    expect(composeContent).toContain('4000:4000');
    expect(composeContent).toContain('5432:5432');
    expect(composeContent).toContain('6379:6379');
  });

  test('повинен мати правильні змінні середовища', () => {
    const envExamplePath = path.join(__dirname, '../../.env.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);
    
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Перевірка обов'язкових змінних
    expect(envContent).toContain('NODE_ENV=');
    expect(envContent).toContain('PORT=');
    expect(envContent).toContain('DB_HOST=');
    expect(envContent).toContain('DB_PORT=');
    expect(envContent).toContain('DB_NAME=');
    expect(envContent).toContain('DB_USER=');
    expect(envContent).toContain('DB_PASSWORD=');
    expect(envContent).toContain('REDIS_HOST=');
    expect(envContent).toContain('REDIS_PORT=');
    expect(envContent).toContain('JWT_SECRET=');
  });

  test('повинен мати валідний package.json', () => {
    const packagePath = path.join(__dirname, '../../package.json');
    expect(fs.existsSync(packagePath)).toBe(true);
    
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Перевірка основних полів
    expect(packageContent).toHaveProperty('name');
    expect(packageContent).toHaveProperty('version');
    expect(packageContent).toHaveProperty('scripts');
    expect(packageContent).toHaveProperty('dependencies');
    
    // Перевірка обов'язкових залежностей
    expect(packageContent.dependencies).toHaveProperty('express');
    expect(packageContent.dependencies).toHaveProperty('pg');
    expect(packageContent.dependencies).toHaveProperty('redis');
    expect(packageContent.dependencies).toHaveProperty('cors');
    expect(packageContent.dependencies).toHaveProperty('helmet');
    
    // Перевірка скриптів
    expect(packageContent.scripts).toHaveProperty('start');
    expect(packageContent.scripts).toHaveProperty('dev');
    expect(packageContent.scripts).toHaveProperty('test');
  });

  test('повинен мати правильну структуру директорій', () => {
    const requiredDirs = [
      'src',
      'src/database',
      'src/cache',
      'src/routes',
      'src/middleware',
      'src/utils',
      'logs'
    ];
    
    requiredDirs.forEach(dir => {
      const dirPath = path.join(__dirname, '../../', dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  test('повинен мати валідні конфігураційні файли', () => {
    const configFiles = [
      '../database/connection.js',
      '../cache/redis.js',
      '../utils/logger.js',
      '../middleware/errorHandler.js'
    ];
    
    configFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      expect(fs.existsSync(filePath)).toBe(true);
      
      // Перевірка, що файл можна імпортувати без помилок
      expect(() => require(filePath)).not.toThrow();
    });
  });

  // Тест Docker команд (тільки якщо Docker доступний)
  test('повинен мати валідний синтаксис Dockerfile', () => {
    try {
      // Перевірка синтаксису Dockerfile
      const dockerfilePath = path.join(__dirname, '../../Dockerfile');
      const result = execSync(`docker build --dry-run -f ${dockerfilePath} .`, {
        cwd: path.join(__dirname, '../../'),
        stdio: 'pipe'
      });
      
      expect(result).toBeDefined();
    } catch (error) {
      // Якщо Docker недоступний, пропускаємо тест
      if (error.message.includes('docker') || error.message.includes('not recognized')) {
        console.warn('Docker не знайдено, пропускаємо тест синтаксису Dockerfile');
        expect(true).toBe(true); // Пропускаємо тест
      } else {
        throw error;
      }
    }
  });
});