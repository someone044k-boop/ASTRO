# Дизайн Документ

## Огляд

Онлайн школа навчання - це сучасна веб-платформа з модерним дизайном, що поєднує містичну тематику з передовими технологіями. Архітектура побудована на мікросервісному підході з використанням Node.js бекенду, React/Vue фронтенду, PostgreSQL базою даних та Redis кешуванням.

Дизайн орієнтований на створення захоплюючого користувацького досвіду з плавними анімаціями, багатим мультимедійним контентом та інтуїтивною навігацією. Платформа підтримує повний цикл навчання від реєстрації до завершення курсів з інтегрованими платіжними системами та персоналізованими кабінетами.

## Архітектура

### Загальна Архітектура

Система побудована за принципом модульної архітектури з чіткою сепарацією відповідальностей:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│   React/Vue     │◄──►│   Node.js       │◄──►│   Services      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │   PostgreSQL    │
                       │                 │    │   Database      │
                       └─────────────────┘    └─────────────────┘
```

### Технологічний Стек

**Frontend:**
- React.js або Vue.js для інтерактивного UI
- CSS3/SCSS для стилізації з анімаціями
- Webpack для збірки та оптимізації
- PWA підтримка для мобільних пристроїв

**Backend:**
- Node.js з Express.js фреймворком
- RESTful API з GraphQL для складних запитів
- JWT аутентифікація
- Multer для завантаження файлів

**База Даних:**
- PostgreSQL для основних даних
- Redis для кешування та сесій
- Elasticsearch для пошуку контенту

**Інфраструктура:**
- Docker контейнеризація
- Nginx як reverse proxy
- CDN для статичного контенту

## Компоненти та Інтерфейси

### Основні Компоненти

#### 1. Навігаційна Система
```javascript
interface NavigationComponent {
  mainMenu: MenuItem[]
  subMenus: SubMenuItem[]
  userMenu: UserMenuItem[]
  animations: AnimationConfig
}

interface MenuItem {
  id: string
  title: string
  path: string
  subItems?: SubMenuItem[]
  icon?: string
}
```

#### 2. Система Аутентифікації
```javascript
interface AuthenticationService {
  login(credentials: LoginCredentials): Promise<AuthResult>
  register(userData: RegisterData): Promise<AuthResult>
  logout(): Promise<void>
  refreshToken(): Promise<string>
  validateSession(): Promise<boolean>
}

interface UserProfile {
  id: string
  email: string
  phone?: string
  avatar?: string
  enrolledCourses: CourseEnrollment[]
  progress: LearningProgress
}
```

#### 3. Навчальні Модулі
```javascript
interface CourseModule {
  id: string
  title: string
  level: number
  tabs: CourseTab[]
  content: RichContent
  progress: ProgressTracker
}

interface CourseTab {
  name: string
  type: 'theory' | 'practice' | 'influence' | 'heroes' | 'exam'
  content: TabContent
  subSections?: SubSection[]
}
```

#### 4. Інтерактивні Уроки
```javascript
interface LessonPlayer {
  slides: Slide[]
  audioPlayer: AudioController
  navigation: SlideNavigation
  fullscreenMode: boolean
  progressBar: ProgressIndicator
}

interface Slide {
  id: string
  content: RichContent
  audioTrack?: AudioTrack
  duration?: number
}
```

#### 5. Магазин Артефактів
```javascript
interface ArtifactShop {
  categories: ShopCategory[]
  products: Product[]
  cart: ShoppingCart
  animations: ProductAnimation[]
}

interface Product {
  id: string
  name: string
  description: RichContent
  images: ProductImage[]
  price: number
  category: string
}
```

#### 6. Астрологічний Калькулятор
```javascript
interface AstroCalculator {
  inputPanel: BirthDataInput
  outputPanel: NatalChartDisplay
  calculations: AstrologyEngine
}

interface BirthDataInput {
  date: Date
  time: Time
  location: GeographicLocation
}
```

### API Інтерфейси

#### REST API Endpoints
```
GET    /api/courses                 - Отримати список курсів
POST   /api/courses/:id/enroll      - Записатися на курс
GET    /api/lessons/:id             - Отримати урок
POST   /api/progress                - Оновити прогрес
GET    /api/shop/products           - Товари магазину
POST   /api/shop/purchase           - Покупка товару
POST   /api/astro/calculate         - Розрахунок натальної карти
GET    /api/content/:page           - Контент сторінки
```

## Моделі Даних

### Користувач
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Курси
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course_tabs (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  content JSONB,
  order_index INTEGER
);
```

### Прогрес Навчання
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  lesson_id UUID,
  completed_at TIMESTAMP,
  progress_percentage INTEGER DEFAULT 0
);
```

### Товари Магазину
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  images JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Контент
```sql
CREATE TABLE content_pages (
  id UUID PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  meta_data JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Властивості Коректності

*Властивість - це характеристика або поведінка, яка повинна залишатися істинною для всіх валідних виконань системи - по суті, формальне твердження про те, що система повинна робити. Властивості служать мостом між специфікаціями, зрозумілими людині, та гарантіями коректності, які можна перевірити машиною.*

### Властивість 1: Навігаційна послідовність підменю
*Для будь-якого* пункту головного меню з підменю, при наведенні курсора система повинна відображати відповідне підменю з правильною кількістю елементів
**Перевіряє: Вимоги 1.2, 1.3, 1.4**

### Властивість 2: Універсальна навігація сторінок
*Для будь-якого* пункту навігації, клік повинен призводити до переходу на відповідну сторінку з активацією плавних анімацій
**Перевіряє: Вимоги 1.5**

### Властивість 3: Цикл реєстрації користувача
*Для будь-яких* валідних даних реєстрації, успішна реєстрація повинна створювати новий кабінет студента та перенаправляти на персональну панель
**Перевіряє: Вимоги 2.2**

### Властивість 4: Цикл аутентифікації користувача
*Для будь-яких* валідних облікових даних, успішний вхід повинен аутентифікувати користувача та відображати опції персонального меню
**Перевіряє: Вимоги 2.3**

### Властивість 5: Персональне меню аутентифікованих користувачів
*Для будь-якого* аутентифікованого користувача, доступ до персонального меню повинен відображати всі опції кабінету студента
**Перевіряє: Вимоги 2.4**

### Властивість 6: Завершення сесії
*Для будь-якого* користувача, вихід з системи повинен завершувати сесію та повертати до публічної навігації
**Перевіряє: Вимоги 2.5**

### Властивість 7: Структура курсів за рівнями
*Для будь-якого* курсу вищого рівня (2й, 3й, 4й), інтерфейс повинен відображати п'ять стандартних вкладок
**Перевіряє: Вимоги 3.3**

### Властивість 8: Перенаправлення на оплату курсів
*Для будь-якого* курсу та студента, клік на кнопку запису повинен перенаправляти на сторінку оплати або доступу
**Перевіряє: Вимоги 3.5**

### Властивість 9: Структура практичних уроків
*Для будь-якого* практичного уроку, сторінка повинна відображати меню навігації слайдів з лівого боку
**Перевіряє: Вимоги 4.1**

### Властивість 10: Стандартний макет уроків
*Для будь-якого* уроку з контентом, система повинна відображати альбомний слайд А4 з аудіопрогравачем знизу
**Перевіряє: Вимоги 4.2**

### Властивість 11: Функціональність аудіопрогравача
*Для будь-якого* аудіо треку, програвач повинен надавати контроль швидкості, гучності та смугу прогресу з градієнтом
**Перевіряє: Вимоги 4.3**

### Властивість 12: Навігація слайдів
*Для будь-якого* набору слайдів, система повинна відображати номер поточного слайду, загальну кількість та кнопки навігації
**Перевіряє: Вимоги 4.4**

### Властивість 13: Повноекранний режим
*Для будь-якого* слайду, активація повноекранного режиму повинна розгортати слайд на весь екран з адаптованими елементами управління
**Перевіряє: Вимоги 4.5**

### Властивість 14: Багатий контент на всіх сторінках
*Для будь-якої* сторінки контенту, система управління контентом повинна відображати багатий текст з мультимедіа елементами
**Перевіряє: Вимоги 5.1**

### Властивість 15: Динамічний контент FAQ
*Для будь-якого* підрозділу FAQ, система повинна відображати різноманітні формати контенту з багатим текстом та кольоровими елементами
**Перевіряє: Вимоги 5.3**

### Властивість 16: Візуальні ефекти магазину
*Для будь-якої* сторінки магазину, система повинна відображати контент з анімаціями обертання (1 секунда за годинниковою стрілкою)
**Перевіряє: Вимоги 6.1**

### Властивість 17: Послідовна навігація магазину
*Для будь-якого* розділу магазину, система повинна підтримувати послідовне ліве навігаційне меню на всіх сторінках
**Перевіряє: Вимоги 6.2**

### Властивість 18: Інформація про товари
*Для будь-якого* товару, сторінка повинна відображати повну інформацію про товар з функціональними кнопками покупки
**Перевіряє: Вимоги 6.3**

### Властивість 19: Обробка транзакцій
*Для будь-якої* транзакції, платіжний шлюз повинен коректно обробляти запит на покупку
**Перевіряє: Вимоги 6.4**

### Властивість 20: Інтерфейс введення астрологічних даних
*Для будь-якого* користувача, астрологічний калькулятор повинен надавати панель введення для дати, часу та місця народження
**Перевіряє: Вимоги 7.2**

### Властивість 21: Розрахунок натальних карт
*Для будь-яких* валідних даних народження, калькулятор повинен обробити дані та згенерувати натальну карту
**Перевіряє: Вимоги 7.3**

### Властивість 22: Відображення результатів розрахунків
*Для будь-якого* успішного розрахунку, система повинна відобразити результати в панелі виводу
**Перевіряє: Вимоги 7.4**

### Властивість 23: Комплексна астрологічна інформація
*Для будь-якої* згенерованої натальної карти, система повинна представити повну астрологічну інформацію
**Перевіряє: Вимоги 7.5**

### Властивість 24: Відображення прогресу курсів
*Для будь-якого* студента з записаними курсами, система повинна відображати курси та прогрес завершення
**Перевіряє: Вимоги 8.1**

### Властивість 25: Деталізація прогресу курсу
*Для будь-якого* курсу, система повинна показувати завершені уроки, поточну позицію та контент що залишився
**Перевіряє: Вимоги 8.2**

### Властивість 26: Автоматичне оновлення прогресу
*Для будь-якого* завершеного уроку, система повинна автоматично оновлювати індикатори прогресу
**Перевіряє: Вимоги 8.3**

### Властивість 27: Редагування профілю
*Для будь-якого* студента, кабінет повинен дозволяти зміну паролю, телефону, електронної пошти та аватара
**Перевіряє: Вимоги 8.4**

### Властивість 28: Система сповіщень
*Для будь-якого* студента, система повинна відображати системні сповіщення та особисті повідомлення в окремих вкладках
**Перевіряє: Вимоги 8.5**

### Властивість 29: Форматування багатого тексту
*Для будь-якого* контенту, система управління повинна підтримувати форматування з кольоровими фонами та різноманітними макетами
**Перевіряє: Вимоги 9.1**

### Властивість 30: Інтеграція мультимедіа
*Для будь-якого* мультимедійного контенту, система повинна безперешкодно інтегрувати зображення, відео та інтерактивні віджети
**Перевіряє: Вимоги 9.2**

### Властивість 31: Інтеграція соціальних мереж
*Для будь-якої* сторінки з соціальними мережами, система повинна відображати іконки з робочими посиланнями
**Перевіряє: Вимоги 9.3**

### Властивість 32: Посилання на юридичні документи
*Для будь-якого* юридичного посилання, система повинна надавати доступ до документів на окремих сторінках
**Перевіряє: Вимоги 9.5**

### Властивість 33: Адаптивний дизайн для мобільних
*Для будь-якого* мобільного пристрою, платформа повинна адаптувати макет інтерфейсу для мобільних екранів
**Перевіряє: Вимоги 10.1**

### Властивість 34: Оптимізація повноекранного режиму на мобільних
*Для будь-якого* мобільного пристрою в повноекранному режимі, система повинна оптимізувати макет слайду та аудіопрогравача
**Перевіряє: Вимоги 10.2**

### Властивість 35: Touch-інтерфейс для планшетів
*Для будь-якого* планшету, платформа повинна надавати зручні для дотику елементи інтерфейсу
**Перевіряє: Вимоги 10.3**

### Властивість 36: Універсальна адаптивність
*Для будь-якого* розміру екрану, платформа повинна підтримувати повну функціональність при застосуванні адаптивного дизайну
**Перевіряє: Вимоги 10.4**

## Обробка Помилок

### Стратегія Обробки Помилок

**Клієнтська Сторона:**
- Валідація форм в реальному часі з користувацькими повідомленнями
- Graceful degradation для відсутніх функцій браузера
- Offline режим з локальним кешуванням критичних даних
- Retry механізми для мережевих запитів

**Серверна Сторона:**
- Централізована обробка помилок з логуванням
- Валідація даних на рівні API з детальними повідомленнями
- Rate limiting для захисту від зловживань
- Fallback механізми для зовнішніх сервісів

**База Даних:**
- Транзакційна цілісність для критичних операцій
- Backup та recovery процедури
- Connection pooling з автоматичним відновленням
- Моніторинг продуктивності запитів

### Коди Помилок

```javascript
const ErrorCodes = {
  // Аутентифікація
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  
  // Курси
  COURSE_NOT_FOUND: 'COURSE_001',
  COURSE_ACCESS_DENIED: 'COURSE_002',
  COURSE_ENROLLMENT_FAILED: 'COURSE_003',
  
  // Платежі
  PAYMENT_PROCESSING_ERROR: 'PAY_001',
  PAYMENT_INSUFFICIENT_FUNDS: 'PAY_002',
  PAYMENT_GATEWAY_TIMEOUT: 'PAY_003',
  
  // Контент
  CONTENT_NOT_FOUND: 'CONTENT_001',
  CONTENT_LOADING_ERROR: 'CONTENT_002',
  
  // Астрологія
  ASTRO_INVALID_DATA: 'ASTRO_001',
  ASTRO_CALCULATION_ERROR: 'ASTRO_002'
}
```

## Стратегія Тестування

### Підхід Подвійного Тестування

Система використовує комплексний підхід до тестування, що поєднує unit тестування та property-based тестування для забезпечення максимального покриття та надійності.

**Unit Тестування:**
- Перевіряє конкретні приклади, граничні випадки та умови помилок
- Тестує точки інтеграції між компонентами
- Фокусується на конкретних сценаріях використання
- Використовує Jest для JavaScript/TypeScript компонентів

**Property-Based Тестування:**
- Перевіряє універсальні властивості, які повинні виконуватися для всіх входів
- Використовує бібліотеку fast-check для JavaScript/TypeScript
- Кожен property-based тест налаштований на мінімум 100 ітерацій
- Кожен тест позначений коментарем з посиланням на відповідну властивість коректності

### Конфігурація Property-Based Тестування

**Бібліотека:** fast-check для JavaScript/TypeScript
**Мінімальні ітерації:** 100 для кожного property тесту
**Формат тегування:** `**Feature: online-learning-school, Property {number}: {property_text}**`

### Приклади Тестів

**Unit Тест:**
```javascript
describe('User Authentication', () => {
  test('should login with valid credentials', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    const result = await authService.login(credentials);
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });
});
```

**Property-Based Тест:**
```javascript
// **Feature: online-learning-school, Property 3: Цикл реєстрації користувача**
describe('User Registration Property', () => {
  test('should create account for any valid registration data', () => {
    fc.assert(fc.property(
      fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8 }),
        phone: fc.option(fc.string({ minLength: 10 }))
      }),
      async (userData) => {
        const result = await authService.register(userData);
        expect(result.success).toBe(true);
        expect(result.userId).toBeDefined();
      }
    ), { numRuns: 100 });
  });
});
```

### Покриття Тестування

- **Unit тести:** Конкретні функції, компоненти та інтеграційні точки
- **Property тести:** Всі 36 властивостей коректності з дизайн-документу
- **E2E тести:** Критичні користувацькі сценарії (реєстрація, покупка курсу, проходження уроку)
- **Performance тести:** Навантажувальне тестування для критичних ендпоінтів
- **Security тести:** Тестування аутентифікації, авторизації та валідації входів
## Технічні Деталі

### Frontend Архітектура

**Структура Проекту:**
```
src/
├── components/           # Переиспользуемые UI компоненты
│   ├── common/          # Общие компоненты (Header, Footer, Navigation)
│   ├── course/          # Компоненты курсов
│   ├── shop/            # Компоненты магазина
│   └── astro/           # Астрологические компоненты
├── pages/               # Страницы приложения
├── services/            # API сервисы и бизнес логика
├── store/               # State management (Vuex/Redux)
├── styles/              # Глобальные стили и темы
└── utils/               # Утилиты и хелперы
```

**State Management:**
- Vuex (для Vue.js) или Redux (для React.js)
- Модульная архитектура store
- Middleware для логирования и персистентности

**Анимации и Переходы:**
- CSS3 transitions и animations
- Framer Motion (React) или Vue Transition (Vue.js)
- GSAP для сложных анимаций
- Intersection Observer API для анимаций при скролле

### Backend Архитектура

**Микросервисная Структура:**
```
services/
├── auth-service/        # Аутентификация и авторизация
├── course-service/      # Управление курсами
├── content-service/     # Управление контентом
├── shop-service/        # Магазин и платежи
├── astro-service/       # Астрологические расчеты
├── notification-service/ # Уведомления
└── api-gateway/         # API Gateway
```

**API Design:**
- RESTful API с GraphQL для сложных запросов
- OpenAPI/Swagger документация
- Версионирование API (v1, v2)
- Rate limiting и throttling

### База Данных

**PostgreSQL Схема:**
```sql
-- Расширенная схема пользователей
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  role VARCHAR(50) DEFAULT 'student',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Курсы и уроки
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  thumbnail_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  content JSONB,
  audio_url VARCHAR(500),
  slides JSONB,
  order_index INTEGER,
  duration_minutes INTEGER
);

-- Прогресс и записи
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  progress_percentage INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  lesson_id UUID REFERENCES lessons(id),
  completed_at TIMESTAMP,
  time_spent_minutes INTEGER DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);

-- Магазин
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  images JSONB,
  inventory_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

-- Контент и страницы
CREATE TABLE content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  meta_data JSONB,
  parent_id UUID REFERENCES content_pages(id),
  order_index INTEGER,
  status VARCHAR(50) DEFAULT 'published',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Астрологические данные
CREATE TABLE natal_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  birth_location JSONB NOT NULL,
  chart_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Уведомления
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Кеширование (Redis)

**Стратегия Кеширования:**
```javascript
// Конфигурация Redis
const cacheConfig = {
  // Сессии пользователей
  sessions: { ttl: 3600 * 24 }, // 24 часа
  
  // Контент страниц
  content: { ttl: 3600 * 2 }, // 2 часа
  
  // Данные курсов
  courses: { ttl: 3600 * 6 }, // 6 часов
  
  // Результаты астрологических расчетов
  astroCalculations: { ttl: 3600 * 24 * 7 }, // 7 дней
  
  // API responses
  apiResponses: { ttl: 300 } // 5 минут
};
```

### Безопасность

**Аутентификация и Авторизация:**
- JWT токены с refresh token механизмом
- bcrypt для хеширования паролей
- OAuth2 интеграция для социальных сетей
- Role-based access control (RBAC)

**Защита API:**
- CORS настройки
- Rate limiting (express-rate-limit)
- Input validation и sanitization
- SQL injection защита через параметризованные запросы
- XSS защита через Content Security Policy

**Шифрование:**
- HTTPS для всех соединений
- Шифрование чувствительных данных в БД
- Secure cookie настройки

### Производительность

**Оптимизация Frontend:**
- Code splitting и lazy loading
- Image optimization и WebP формат
- Service Workers для кеширования
- Bundle analysis и tree shaking

**Оптимизация Backend:**
- Connection pooling для БД
- Query optimization и индексы
- Compression middleware (gzip)
- CDN для статических ресурсов

**Мониторинг:**
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Логирование (Winston/Bunyan)
- Health checks для сервисов

### Развертывание

**Контейнеризация:**
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - api-gateway
      
  api-gateway:
    build: ./backend/api-gateway
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: learning_school
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
volumes:
  postgres_data:
```

### Интеграции

**Платежные Системы:**
- Stripe для международных платежей
- LiqPay для украинского рынка
- Webhook обработка для статусов платежей

**Внешние Сервисы:**
- YouTube API для видео контента
- Telegram Bot API для уведомлений
- Email сервис (SendGrid/Mailgun)
- SMS сервис для верификации

**Астрологические Расчеты:**
- Swiss Ephemeris для точных расчетов
- Геолокация API для определения координат
- Timezone API для корректного времени

### Масштабирование

**Горизонтальное Масштабирование:**
- Load balancer (Nginx/HAProxy)
- Микросервисная архитектура
- Database sharding стратегии
- CDN для глобального распределения

**Вертикальное Масштабирование:**
- Auto-scaling группы
- Resource monitoring
- Performance profiling
- Capacity planning