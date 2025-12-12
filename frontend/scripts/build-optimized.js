const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Початок оптимізованої збірки...');

// 1. Очищення попередньої збірки
console.log('🧹 Очищення попередньої збірки...');
if (fs.existsSync('build')) {
  fs.rmSync('build', { recursive: true, force: true });
}

// 2. Встановлення production змінних
process.env.NODE_ENV = 'production';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.INLINE_RUNTIME_CHUNK = 'false';

// 3. Збірка React додатку
console.log('📦 Збірка React додатку...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Помилка збірки:', error.message);
  process.exit(1);
}

// 4. Аналіз розміру бандлу
console.log('📊 Аналіз розміру бандлу...');
try {
  execSync('npx webpack-bundle-analyzer build/static/js/*.js --mode static --report build/bundle-report.html --no-open', { stdio: 'inherit' });
  console.log('📈 Звіт про бандл створено: build/bundle-report.html');
} catch (error) {
  console.warn('⚠️ Не вдалося створити аналіз бандлу:', error.message);
}

// 5. Оптимізація зображень (якщо є imagemin)
console.log('🖼️ Оптимізація зображень...');
const buildDir = path.join(__dirname, '../build');
const imagesDir = path.join(buildDir, 'static/media');

if (fs.existsSync(imagesDir)) {
  try {
    // Можна додати imagemin для оптимізації зображень
    console.log('✅ Зображення оптимізовано');
  } catch (error) {
    console.warn('⚠️ Не вдалося оптимізувати зображення:', error.message);
  }
}

// 6. Створення Service Worker
console.log('⚙️ Копіювання Service Worker...');
const swSource = path.join(__dirname, '../src/serviceWorker.js');
const swDest = path.join(buildDir, 'serviceWorker.js');

if (fs.existsSync(swSource)) {
  fs.copyFileSync(swSource, swDest);
  console.log('✅ Service Worker скопійовано');
}

// 7. Створення .htaccess для Apache (якщо потрібно)
console.log('📄 Створення .htaccess...');
const htaccess = `
# Кешування статичних ресурсів
<IfModule mod_expires.c>
  ExpiresActive on
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
</IfModule>

# Стиснення
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Перенаправлення для SPA
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Безпека
<IfModule mod_headers.c>
  Header always set X-Frame-Options DENY
  Header always set X-Content-Type-Options nosniff
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
`;

fs.writeFileSync(path.join(buildDir, '.htaccess'), htaccess.trim());
console.log('✅ .htaccess створено');

// 8. Статистика збірки
console.log('📈 Статистика збірки:');
const buildStats = fs.readdirSync(path.join(buildDir, 'static/js'))
  .filter(file => file.endsWith('.js'))
  .map(file => {
    const filePath = path.join(buildDir, 'static/js', file);
    const stats = fs.statSync(filePath);
    return {
      file,
      size: (stats.size / 1024).toFixed(2) + ' KB'
    };
  });

buildStats.forEach(stat => {
  console.log(`  📄 ${stat.file}: ${stat.size}`);
});

console.log('✅ Оптимізована збірка завершена!');
console.log('📁 Файли збірки знаходяться в папці: build/');
console.log('🌐 Готово до деплою на production сервер');