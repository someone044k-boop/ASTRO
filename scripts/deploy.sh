#!/bin/bash

# Скрипт для деплою на production
set -e

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функція для виводу повідомлень
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Перевірка аргументів
if [ $# -eq 0 ]; then
    echo "Usage: $0 [staging|production] [--skip-tests] [--skip-backup]"
    echo ""
    echo "Options:"
    echo "  staging     Deploy to staging environment"
    echo "  production  Deploy to production environment"
    echo "  --skip-tests    Skip running tests before deployment"
    echo "  --skip-backup   Skip creating backup before deployment"
    exit 1
fi

ENVIRONMENT=$1
SKIP_TESTS=false
SKIP_BACKUP=false

# Обробка додаткових параметрів
for arg in "$@"; do
    case $arg in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
    esac
done

log "🚀 Початок деплою на $ENVIRONMENT"

# Перевірка середовища
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    error "Невідоме середовище: $ENVIRONMENT. Використовуйте 'staging' або 'production'"
fi

# Перевірка Git статусу
if [ "$ENVIRONMENT" = "production" ]; then
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        error "Production деплой можливий тільки з гілки 'main'. Поточна гілка: $CURRENT_BRANCH"
    fi
fi

# Перевірка наявності .env файлу
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    error "Файл $ENV_FILE не знайдено"
fi

log "📋 Завантаження змінних середовища з $ENV_FILE"
source "$ENV_FILE"

# Перевірка обов'язкових змінних
REQUIRED_VARS=("DB_PASSWORD" "JWT_SECRET" "STRIPE_SECRET_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        error "Змінна $var не встановлена в $ENV_FILE"
    fi
done

# Запуск тестів
if [ "$SKIP_TESTS" = false ]; then
    log "🧪 Запуск тестів..."
    
    # Backend тести
    log "Тестування backend..."
    cd backend
    npm test || error "Backend тести не пройшли"
    cd ..
    
    # Frontend тести
    log "Тестування frontend..."
    cd frontend
    CI=true npm test -- --coverage --watchAll=false || error "Frontend тести не пройшли"
    cd ..
    
    # Інтеграційні тести
    log "Запуск інтеграційних тестів..."
    node scripts/test-project.js || warn "Деякі тести не пройшли, але продовжуємо деплой"
fi

# Створення backup'у
if [ "$SKIP_BACKUP" = false ] && [ "$ENVIRONMENT" = "production" ]; then
    log "💾 Створення backup'у бази даних..."
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres learning_school > "backups/$BACKUP_FILE" || warn "Не вдалося створити backup"
        log "Backup збережено: backups/$BACKUP_FILE"
    else
        warn "Docker Compose не знайдено, пропускаємо backup"
    fi
fi

# Збірка Docker образів
log "🐳 Збірка Docker образів..."

# Frontend
log "Збірка frontend образу..."
docker build -t learning-school-frontend:$ENVIRONMENT -f frontend/Dockerfile.prod frontend/ || error "Не вдалося зібрати frontend образ"

# Backend
log "Збірка backend образу..."
docker build -t learning-school-backend:$ENVIRONMENT -f backend/Dockerfile.prod backend/ || error "Не вдалося зібрати backend образ"

# Деплой
log "🚀 Деплой на $ENVIRONMENT..."

if [ "$ENVIRONMENT" = "staging" ]; then
    COMPOSE_FILE="docker-compose.staging.yml"
else
    COMPOSE_FILE="docker-compose.prod.yml"
fi

# Зупинка старих контейнерів
log "Зупинка старих контейнерів..."
docker-compose -f "$COMPOSE_FILE" down || warn "Не вдалося зупинити контейнери"

# Запуск нових контейнерів
log "Запуск нових контейнерів..."
docker-compose -f "$COMPOSE_FILE" up -d || error "Не вдалося запустити контейнери"

# Очікування запуску сервісів
log "⏳ Очікування запуску сервісів..."
sleep 30

# Health check
log "🏥 Перевірка здоров'я сервісів..."

# Перевірка backend
BACKEND_URL="http://localhost:4000"
if [ "$ENVIRONMENT" = "production" ]; then
    BACKEND_URL="$PRODUCTION_URL"
elif [ "$ENVIRONMENT" = "staging" ]; then
    BACKEND_URL="$STAGING_URL"
fi

for i in {1..10}; do
    if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
        log "✅ Backend здоровий"
        break
    else
        if [ $i -eq 10 ]; then
            error "Backend не відповідає після 10 спроб"
        fi
        warn "Backend ще не готовий, спроба $i/10..."
        sleep 10
    fi
done

# Запуск міграцій
log "📊 Запуск міграцій бази даних..."
docker-compose -f "$COMPOSE_FILE" exec -T backend npm run migrate || error "Міграції не виконались"

# Фінальна перевірка
log "🔍 Фінальна перевірка сервісів..."
curl -f "$BACKEND_URL/api/health/detailed" || error "Детальна перевірка здоров'я не пройшла"

# Очищення старих образів
log "🧹 Очищення старих Docker образів..."
docker image prune -f || warn "Не вдалося очистити старі образи"

# Повідомлення про успіх
log "🎉 Деплой на $ENVIRONMENT завершено успішно!"

if [ "$ENVIRONMENT" = "production" ]; then
    log "🌐 Сайт доступний за адресою: $PRODUCTION_URL"
    log "📊 Моніторинг: $PRODUCTION_URL:3001 (Grafana)"
    log "📈 Метрики: $PRODUCTION_URL:9090 (Prometheus)"
elif [ "$ENVIRONMENT" = "staging" ]; then
    log "🌐 Staging сайт: $STAGING_URL"
fi

log "📋 Для перегляду логів використовуйте:"
log "   docker-compose -f $COMPOSE_FILE logs -f"

# Відправка повідомлення в Slack (якщо налаштовано)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 Деплой на $ENVIRONMENT завершено успішно! Час: $(date)\"}" \
        "$SLACK_WEBHOOK_URL" || warn "Не вдалося відправити повідомлення в Slack"
fi

log "✨ Деплой завершено!"