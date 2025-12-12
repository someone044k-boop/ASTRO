# 🚀 Швидкий запуск проекту "Онлайн школа навчання"

## 📋 Передумови

Переконайтеся, що у вас встановлено:
- **Node.js** (версія 18 або вище)
- **PostgreSQL** (версія 12 або вище)
- **Redis** (для кешування)
- **Git**

## ⚡ СУПЕР ШВИДКИЙ ЗАПУСК (Windows)

### Автоматичне встановлення (рекомендовано)
```powershell
# Запустіть PowerShell як адміністратор та виконайте:
.\scripts\quick-install.ps1

# Після встановлення перезапустіть PowerShell та виконайте:
.\scripts\setup-database.ps1
.\scripts\start-local.ps1
```

**Готово! Проект запуститься автоматично на http://localhost:3000**

## 🏃‍♂️ Швидкий запуск з Docker

### 1. Клонування репозиторію
```bash
git clone <repository-url>
cd learning-school
```

### 2. Запуск всіх сервісів
```bash
# Запуск всіх сервісів (база даних, backend, frontend)
docker-compose up -d

# Перегляд логів
docker-compose logs -f
```

### 3. Доступ до додатку
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **База даних**: localhost:5432
- **Redis**: localhost:6379

### 4. Тестовий користувач
- **Email**: admin@learning-school.com
- **Пароль**: admin123
- **Роль**: Адміністратор

## 🛠 Локальний запуск (без Docker)

### 1. Встановлення залежностей

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 2. Налаштування бази даних

#### Встановлення PostgreSQL та Redis
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib redis-server

# macOS (з Homebrew)
brew install postgresql redis

# Windows (з Chocolatey)
choco install postgresql redis-64
```

#### Створення бази даних
```bash
# Підключення до PostgreSQL
sudo -u postgres psql

# Створення бази даних та користувача
CREATE DATABASE learning_school;
CREATE USER postgres WITH PASSWORD 'postgres123';
GRANT ALL PRIVILEGES ON DATABASE learning_school TO postgres;
\q
```

#### Ініціалізація схеми
```bash
# З директорії проекту
psql -h localhost -U postgres -d learning_school -f database/init.sql
```

### 3. Налаштування змінних середовища

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Відредагуйте `.env` файл:
```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=learning_school
DB_USER=postgres
DB_PASSWORD=postgres123
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```bash
cd frontend
echo "REACT_APP_API_URL=http://localhost:4000/api" > .env
```

### 4. Запуск сервісів

#### Запуск Redis
```bash
redis-server
```

#### Запуск Backend
```bash
cd backend
npm run dev
```

#### Запуск Frontend
```bash
cd frontend
npm start
```

## 🧪 Запуск тестів

### Backend тести
```bash
cd backend
npm test
```

### Frontend тести
```bash
cd frontend
npm test
```

### Тести з покриттям
```bash
# Backend
cd backend
npm run test:coverage

# Frontend
cd frontend
npm run test:coverage
```

## 📁 Структура проекту

```
learning-school/
├── backend/                 # Node.js API сервер
│   ├── src/
│   │   ├── controllers/     # Контролери API
│   │   ├── models/         # Моделі даних
│   │   ├── routes/         # Маршрути API
│   │   ├── middleware/     # Middleware функції
│   │   ├── services/       # Бізнес логіка
│   │   └── utils/          # Утиліти
│   ├── __tests__/          # Тести
│   └── package.json
├── frontend/               # React додаток
│   ├── src/
│   │   ├── components/     # React компоненти
│   │   ├── pages/          # Сторінки
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API сервіси
│   │   ├── store/          # Redux store
│   │   └── utils/          # Утиліти
│   ├── public/
│   └── package.json
├── database/               # SQL скрипти
├── nginx/                  # Nginx конфігурація
├── docker-compose.yml      # Docker композиція
└── README.md
```

## 🔧 Корисні команди

### Docker команди
```bash
# Перезапуск сервісів
docker-compose restart

# Зупинка всіх сервісів
docker-compose down

# Зупинка з видаленням volumes
docker-compose down -v

# Перебудова образів
docker-compose build --no-cache

# Перегляд статусу
docker-compose ps
```

### Робота з базою даних
```bash
# Підключення до бази в Docker
docker-compose exec postgres psql -U postgres -d learning_school

# Бекап бази даних
docker-compose exec postgres pg_dump -U postgres learning_school > backup.sql

# Відновлення з бекапу
docker-compose exec -T postgres psql -U postgres learning_school < backup.sql
```

### Логи та діагностика
```bash
# Перегляд логів конкретного сервісу
docker-compose logs -f backend
docker-compose logs -f frontend

# Перегляд використання ресурсів
docker-compose top
```

## 🚨 Вирішення проблем

### Порти зайняті
```bash
# Перевірка зайнятих портів
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000

# Зупинка процесів на портах
sudo fuser -k 3000/tcp
sudo fuser -k 4000/tcp
```

### Проблеми з правами доступу
```bash
# Надання прав на директорії
sudo chown -R $USER:$USER ./backend/node_modules
sudo chown -R $USER:$USER ./frontend/node_modules
```

### Очищення Docker
```bash
# Видалення всіх контейнерів та образів
docker system prune -a

# Видалення volumes
docker volume prune
```

## 📚 API Документація

Після запуску backend сервера, API документація доступна за адресою:
- **Swagger UI**: http://localhost:4000/api-docs

## 🎯 Основні функції

- ✅ **Автентифікація користувачів** (JWT)
- ✅ **Управління курсами** та уроками
- ✅ **Відстеження прогресу** навчання
- ✅ **Інтернет-магазин** з товарами
- ✅ **Система платежів** (Stripe)
- ✅ **Адміністративна панель**
- ✅ **Адаптивний дизайн**
- ✅ **Офлайн підтримка**

## 🤝 Підтримка

Якщо у вас виникли проблеми:
1. Перевірте логи: `docker-compose logs -f`
2. Переконайтеся, що всі порти вільні
3. Перезапустіть сервіси: `docker-compose restart`
4. Очистіть кеш: `docker system prune`

---

**Успішного навчання! 🎓**