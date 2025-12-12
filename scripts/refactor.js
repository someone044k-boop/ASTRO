#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Початок автоматичного рефакторингу...');

// Функція для виконання команд
const runCommand = (command, description) => {
  try {
    console.log(`\n📋 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} завершено`);
  } catch (error) {
    console.error(`❌ Помилка при ${description.toLowerCase()}:`, error.message);
  }
};

// Функція для перевірки наявності файлу
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// 1. ESLint перевірка та автофікс
console.log('\n🔍 Перевірка та автофікс ESLint...');

// Frontend
if (fileExists('frontend/.eslintrc.js')) {
  runCommand(
    'cd frontend && npx eslint src/ --ext .js,.jsx --fix',
    'ESLint автофікс для frontend'
  );
} else {
  console.log('⚠️ ESLint конфігурація для frontend не знайдена');
}

// Backend
if (fileExists('backend/.eslintrc.js')) {
  runCommand(
    'cd backend && npx eslint src/ --ext .js --fix',
    'ESLint автофікс для backend'
  );
} else {
  console.log('⚠️ ESLint конфігурація для backend не знайдена');
}

// 2. Prettier форматування
console.log('\n🎨 Форматування коду з Prettier...');

// Frontend
runCommand(
  'cd frontend && npx prettier --write "src/**/*.{js,jsx,css,json}"',
  'Prettier форматування frontend'
);

// Backend
runCommand(
  'cd backend && npx prettier --write "src/**/*.{js,json}"',
  'Prettier форматування backend'
);

// 3. Оптимізація зображень (якщо є imagemin)
console.log('\n🖼️ Оптимізація зображень...');
try {
  if (fileExists('frontend/public/images')) {
    runCommand(
      'cd frontend && npx imagemin public/images/*.{jpg,png} --out-dir=public/images/optimized',
      'Оптимізація зображень'
    );
  }
} catch (error) {
  console.log('⚠️ Imagemin не встановлено, пропускаємо оптимізацію зображень');
}

// 4. Аналіз залежностей
console.log('\n📦 Аналіз залежностей...');

// Перевірка на застарілі пакети
runCommand('cd frontend && npm outdated', 'Перевірка застарілих пакетів frontend');
runCommand('cd backend && npm outdated', 'Перевірка застарілих пакетів backend');

// Аудит безпеки
runCommand('cd frontend && npm audit', 'Аудит безпеки frontend');
runCommand('cd backend && npm audit', 'Аудит безпеки backend');

// 5. Очищення невикористовуваних файлів
console.log('\n🧹 Очищення невикористовуваних файлів...');

const cleanupPaths = [
  'frontend/node_modules/.cache',
  'backend/node_modules/.cache',
  'frontend/build',
  'backend/dist',
  'logs/*.log'
];

cleanupPaths.forEach(cleanupPath => {
  if (fileExists(cleanupPath)) {
    try {
      if (cleanupPath.includes('*')) {
        runCommand(`rm -rf ${cleanupPath}`, `Очищення ${cleanupPath}`);
      } else {
        fs.rmSync(cleanupPath, { recursive: true, force: true });
        console.log(`✅ Очищено: ${cleanupPath}`);
      }
    } catch (error) {
      console.log(`⚠️ Не вдалося очистити ${cleanupPath}:`, error.message);
    }
  }
});

// 6. Генерація звіту про якість коду
console.log('\n📊 Генерація звіту про якість коду...');

const generateCodeQualityReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    frontend: {
      eslintIssues: 0,
      files: 0,
      lines: 0
    },
    backend: {
      eslintIssues: 0,
      files: 0,
      lines: 0
    },
    recommendations: []
  };

  // Підрахунок файлів та рядків
  const countFilesAndLines = (dir, extensions) => {
    let files = 0;
    let lines = 0;

    const walkDir = (currentDir) => {
      if (!fs.existsSync(currentDir)) return;
      
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !['node_modules', '.git', 'build', 'dist'].includes(item)) {
          walkDir(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files++;
          const content = fs.readFileSync(fullPath, 'utf8');
          lines += content.split('\n').length;
        }
      });
    };

    walkDir(dir);
    return { files, lines };
  };

  // Аналіз frontend
  if (fileExists('frontend/src')) {
    const frontendStats = countFilesAndLines('frontend/src', ['.js', '.jsx']);
    report.frontend = { ...report.frontend, ...frontendStats };
  }

  // Аналіз backend
  if (fileExists('backend/src')) {
    const backendStats = countFilesAndLines('backend/src', ['.js']);
    report.backend = { ...report.backend, ...backendStats };
  }

  // Генерація рекомендацій
  if (report.frontend.lines > 10000) {
    report.recommendations.push('Розгляньте розбиття frontend на менші модулі');
  }
  
  if (report.backend.lines > 15000) {
    report.recommendations.push('Розгляньте рефакторинг backend для кращої модульності');
  }

  // Збереження звіту
  fs.writeFileSync('code-quality-report.json', JSON.stringify(report, null, 2));
  console.log('✅ Звіт про якість коду збережено в code-quality-report.json');
  
  return report;
};

const report = generateCodeQualityReport();

// 7. Підсумок
console.log('\n📈 Підсумок рефакторингу:');
console.log(`📁 Frontend: ${report.frontend.files} файлів, ${report.frontend.lines} рядків`);
console.log(`📁 Backend: ${report.backend.files} файлів, ${report.backend.lines} рядків`);

if (report.recommendations.length > 0) {
  console.log('\n💡 Рекомендації:');
  report.recommendations.forEach(rec => console.log(`   • ${rec}`));
}

console.log('\n✅ Автоматичний рефакторинг завершено!');
console.log('📋 Наступні кроки:');
console.log('   1. Перегляньте зміни в коді');
console.log('   2. Запустіть тести: npm test');
console.log('   3. Перевірте роботу додатку');
console.log('   4. Зробіть commit змін');

// 8. Створення .gitignore якщо не існує
const createGitignore = () => {
  const gitignoreContent = `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/

# Code quality reports
code-quality-report.json
bundle-report.html
`;

  if (!fileExists('.gitignore')) {
    fs.writeFileSync('.gitignore', gitignoreContent.trim());
    console.log('✅ Створено .gitignore файл');
  }
};

createGitignore();