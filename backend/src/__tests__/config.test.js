const fs = require('fs');
const path = require('path');

describe('Configuration Tests', () => {
  test('повинен мати всі необхідні конфігураційні файли', () => {
    const requiredFiles = [
      'package.json',
      'Dockerfile',
      '.env.example',
      'src/server.js',
      'src/database/connection.js',
      'src/cache/redis.js',
      'src/utils/logger.js',
      'src/middleware/errorHandler.js'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, '../../', file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('повинен мати правильну структуру package.json', () => {
    const packagePath = path.join(__dirname, '../../package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Перевірка основних полів
    expect(packageContent).toHaveProperty('name');
    expect(packageContent).toHaveProperty('version');
    expect(packageContent).toHaveProperty('scripts');
    expect(packageContent).toHaveProperty('dependencies');

    // Перевірка обов'язкових залежностей
    const requiredDeps = [
      'express', 'cors', 'helmet', 'pg', 'redis', 
      'bcryptjs', 'jsonwebtoken', 'joi', 'winston'
    ];

    requiredDeps.forEach(dep => {
      expect(packageContent.dependencies).toHaveProperty(dep);
    });

    // Перевірка скриптів
    expect(packageContent.scripts).toHaveProperty('start');
    expect(packageContent.scripts).toHaveProperty('dev');
    expect(packageContent.scripts).toHaveProperty('test');
  });

  test('повинен мати правильні змінні середовища в .env.example', () => {
    const envPath = path.join(__dirname, '../../.env.example');
    const envContent = fs.readFileSync(envPath, 'utf8');

    const requiredVars = [
      'NODE_ENV', 'PORT', 'DB_HOST', 'DB_PORT', 'DB_NAME', 
      'DB_USER', 'DB_PASSWORD', 'REDIS_HOST', 'REDIS_PORT', 'JWT_SECRET'
    ];

    requiredVars.forEach(varName => {
      expect(envContent).toContain(`${varName}=`);
    });
  });

  test('повинен мати валідний Dockerfile', () => {
    const dockerfilePath = path.join(__dirname, '../../Dockerfile');
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');

    // Перевірка основних інструкцій Docker
    expect(dockerfileContent).toContain('FROM node:18-alpine');
    expect(dockerfileContent).toContain('WORKDIR /app');
    expect(dockerfileContent).toContain('COPY package*.json ./');
    expect(dockerfileContent).toContain('RUN npm ci');
    expect(dockerfileContent).toContain('EXPOSE 4000');
    expect(dockerfileContent).toContain('CMD ["npm", "start"]');
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

  test('повинен мати валідні модулі без синтаксичних помилок', () => {
    const modules = [
      '../utils/logger.js',
      '../middleware/errorHandler.js'
    ];

    modules.forEach(modulePath => {
      expect(() => {
        require(modulePath);
      }).not.toThrow();
    });
  });
});