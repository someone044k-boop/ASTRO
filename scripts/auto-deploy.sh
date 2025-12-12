#!/bin/bash

# Автоматичний деплой з розширеними можливостями
set -e

# Кольори
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"; }

# Конфігурація
ENVIRONMENT=${1:-staging}
DEPLOYMENT_STRATEGY=${2:-rolling}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_BACKUP=${SKIP_BACKUP:-false}
AUTO_ROLLBACK=${AUTO_ROLLBACK:-true}
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=30

# Функція для відправки повідомлень
send_notification() {
    local status="$1"
    local message="$2"
    local emoji="📢"
    
    case "$status" in
        "start") emoji="🚀" ;;
        "success") emoji="✅" ;;
        "error") emoji="❌" ;;
        "warning") emoji="⚠️" ;;
        "rollback") emoji="🔄" ;;
    esac
    
    # Slack
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$emoji [$ENVIRONMENT] $message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || warn "Не вдалося відправити Slack повідомлення"
    fi
    
    # Email
    if [ -n "$DEPLOY_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "[$ENVIRONMENT] Deployment $status" "$DEPLOY_EMAIL" || warn "Не вдалося відправити email"
    fi
}

# Функція для перевірки передумов
check_prerequisites() {
    log "🔍 Перевірка передумов для деплою..."
    
    # Перевірка Git статусу
    if [ "$ENVIRONMENT" = "production" ]; then
        local current_branch=$(git branch --show-current)
        if [ "$current_branch" != "main" ]; then
            error "Production деплой можливий тільки з гілки 'main'. Поточна гілка: $current_branch"
        fi
        
        # Перевірка чи є uncommitted зміни
        if ! git diff-index --quiet HEAD --; then
            error "Є незакомічені зміни. Закомітьте або скасуйте зміни перед деплоєм"
        fi
    fi
    
    # Перевірка наявності необхідних файлів
    local required_files=(
        ".env.$ENVIRONMENT"
        "docker-compose.$ENVIRONMENT.yml"
        "frontend/Dockerfile.prod"
        "backend/Dockerfile.prod"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Необхідний файл не знайдено: $file"
        fi
    done
    
    # Перевірка Docker
    if ! command -v docker &> /dev/null; then
        error "Docker не встановлено"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не встановлено"
    fi
    
    log "✅ Всі передумови виконано"
}

# Функція для запуску тестів
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        warn "Тести пропущено (SKIP_TESTS=true)"
        return 0
    fi
    
    log "🧪 Запуск тестів..."
    
    # Backend тести
    info "Тестування backend..."
    cd backend
    npm test || error "Backend тести не пройшли"
    cd ..
    
    # Frontend тести
    info "Тестування frontend..."
    cd frontend
    CI=true npm test -- --coverage --watchAll=false || error "Frontend тести не пройшли"
    cd ..
    
    # Інтеграційні тести
    info "Інтеграційні тести..."
    node scripts/test-project.js || warn "Деякі інтеграційні тести не пройшли"
    
    # Security audit
    info "Security audit..."
    cd backend && npm audit --audit-level moderate || warn "Security issues знайдено в backend"
    cd ../frontend && npm audit --audit-level moderate || warn "Security issues знайдено в frontend"
    cd ..
    
    log "✅ Тести завершено"
}

# Функція для створення backup'у
create_backup() {
    if [ "$SKIP_BACKUP" = "true" ] || [ "$ENVIRONMENT" != "production" ]; then
        warn "Backup пропущено"
        return 0
    fi
    
    log "💾 Створення backup'у..."
    
    # Запуск скрипту backup'у
    if [ -f "scripts/auto-backup.sh" ]; then
        bash scripts/auto-backup.sh "$ENVIRONMENT" || error "Не вдалося створити backup"
    else
        warn "Скрипт backup'у не знайдено"
    fi
    
    log "✅ Backup створено"
}

# Функція для збірки образів
build_images() {
    log "🐳 Збірка Docker образів..."
    
    local build_args=""
    if [ "$ENVIRONMENT" = "production" ]; then
        build_args="--no-cache"
    fi
    
    # Frontend
    info "Збірка frontend образу..."
    docker build $build_args -t "learning-school-frontend:$ENVIRONMENT" -f frontend/Dockerfile.prod frontend/ || error "Не вдалося зібрати frontend образ"
    
    # Backend
    info "Збірка backend образу..."
    docker build $build_args -t "learning-school-backend:$ENVIRONMENT" -f backend/Dockerfile.prod backend/ || error "Не вдалося зібрати backend образ"
    
    # Тегування для registry (якщо потрібно)
    if [ -n "$DOCKER_REGISTRY" ]; then
        docker tag "learning-school-frontend:$ENVIRONMENT" "$DOCKER_REGISTRY/learning-school-frontend:$ENVIRONMENT"
        docker tag "learning-school-backend:$ENVIRONMENT" "$DOCKER_REGISTRY/learning-school-backend:$ENVIRONMENT"
        
        # Push до registry
        docker push "$DOCKER_REGISTRY/learning-school-frontend:$ENVIRONMENT" || warn "Не вдалося відправити frontend образ до registry"
        docker push "$DOCKER_REGISTRY/learning-school-backend:$ENVIRONMENT" || warn "Не вдалося відправити backend образ до registry"
    fi
    
    log "✅ Образи зібрано"
}

# Функція для rolling deployment
rolling_deployment() {
    log "🔄 Rolling deployment..."
    
    local compose_file="docker-compose.$ENVIRONMENT.yml"
    
    # Запуск нових контейнерів поруч зі старими
    info "Запуск нових контейнерів..."
    docker-compose -f "$compose_file" up -d --scale backend=2 --scale frontend=2 || error "Не вдалося запустити нові контейнери"
    
    # Очікування готовності нових контейнерів
    info "Очікування готовності нових контейнерів..."
    sleep 60
    
    # Health check нових контейнерів
    if ! bash scripts/health-check.sh "$ENVIRONMENT" quick; then
        error "Нові контейнери не пройшли health check"
    fi
    
    # Зупинка старих контейнерів
    info "Зупинка старих контейнерів..."
    docker-compose -f "$compose_file" up -d --scale backend=1 --scale frontend=1
    
    log "✅ Rolling deployment завершено"
}

# Функція для blue-green deployment
blue_green_deployment() {
    log "🔵🟢 Blue-Green deployment..."
    
    local compose_file="docker-compose.$ENVIRONMENT.yml"
    local backup_compose_file="docker-compose.$ENVIRONMENT.backup.yml"
    
    # Створення backup конфігурації
    cp "$compose_file" "$backup_compose_file"
    
    # Зупинка поточних контейнерів
    info "Зупинка поточних контейнерів (Blue)..."
    docker-compose -f "$compose_file" down || warn "Не вдалося зупинити контейнери"
    
    # Запуск нових контейнерів (Green)
    info "Запуск нових контейнерів (Green)..."
    docker-compose -f "$compose_file" up -d || error "Не вдалося запустити нові контейнери"
    
    log "✅ Blue-Green deployment завершено"
}

# Функція для canary deployment
canary_deployment() {
    log "🐤 Canary deployment..."
    
    local compose_file="docker-compose.$ENVIRONMENT.yml"
    
    # Запуск одного canary контейнера
    info "Запуск canary контейнера..."
    docker-compose -f "$compose_file" up -d --scale backend=2 || error "Не вдалося запустити canary контейнер"
    
    # Моніторинг canary контейнера
    info "Моніторинг canary контейнера (5 хвилин)..."
    local canary_start_time=$(date +%s)
    local canary_duration=300 # 5 хвилин
    
    while [ $(($(date +%s) - canary_start_time)) -lt $canary_duration ]; do
        if ! bash scripts/health-check.sh "$ENVIRONMENT" quick; then
            error "Canary контейнер не пройшов health check"
        fi
        sleep 30
    done
    
    # Якщо canary успішний, розгортаємо повністю
    info "Canary успішний, повне розгортання..."
    docker-compose -f "$compose_file" up -d || error "Не вдалося завершити розгортання"
    
    log "✅ Canary deployment завершено"
}

# Функція для виконання деплою
deploy() {
    local compose_file="docker-compose.$ENVIRONMENT.yml"
    
    case "$DEPLOYMENT_STRATEGY" in
        "rolling")
            rolling_deployment
            ;;
        "blue-green")
            blue_green_deployment
            ;;
        "canary")
            canary_deployment
            ;;
        "simple"|*)
            log "🚀 Простий деплой..."
            docker-compose -f "$compose_file" down || warn "Не вдалося зупинити контейнери"
            docker-compose -f "$compose_file" up -d || error "Не вдалося запустити контейнери"
            ;;
    esac
}

# Функція для запуску міграцій
run_migrations() {
    log "📊 Запуск міграцій бази даних..."
    
    local compose_file="docker-compose.$ENVIRONMENT.yml"
    
    # Очікування готовності бази даних
    info "Очікування готовності бази даних..."
    local retries=0
    while [ $retries -lt 30 ]; do
        if docker-compose -f "$compose_file" exec -T postgres pg_isready -U postgres; then
            break
        fi
        retries=$((retries + 1))
        sleep 2
    done
    
    # Запуск міграцій
    docker-compose -f "$compose_file" exec -T backend npm run migrate || error "Міграції не виконались"
    
    log "✅ Міграції завершено"
}

# Функція для health check після деплою
post_deploy_health_check() {
    log "🏥 Post-deploy health check..."
    
    local retries=0
    while [ $retries -lt $HEALTH_CHECK_RETRIES ]; do
        if bash scripts/health-check.sh "$ENVIRONMENT" comprehensive; then
            log "✅ Health check пройшов"
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $HEALTH_CHECK_RETRIES ]; then
            warn "Health check не пройшов, спроба $retries/$HEALTH_CHECK_RETRIES"
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    error "Health check не пройшов після $HEALTH_CHECK_RETRIES спроб"
    return 1
}

# Функція для rollback
rollback() {
    log "🔄 Виконання rollback..."
    
    send_notification "rollback" "Виконується rollback через помилки деплою"
    
    local compose_file="docker-compose.$ENVIRONMENT.yml"
    local backup_compose_file="docker-compose.$ENVIRONMENT.backup.yml"
    
    # Відновлення з backup конфігурації
    if [ -f "$backup_compose_file" ]; then
        cp "$backup_compose_file" "$compose_file"
    fi
    
    # Зупинка поточних контейнерів
    docker-compose -f "$compose_file" down || warn "Не вдалося зупинити контейнери"
    
    # Запуск попередньої версії
    docker-compose -f "$compose_file" up -d || error "Не вдалося виконати rollback"
    
    # Health check після rollback
    if bash scripts/health-check.sh "$ENVIRONMENT" quick; then
        log "✅ Rollback виконано успішно"
        send_notification "success" "Rollback виконано успішно"
    else
        error "Rollback не вдався"
    fi
}

# Функція для очищення
cleanup() {
    log "🧹 Очищення..."
    
    # Видалення невикористовуваних образів
    docker image prune -f || warn "Не вдалося очистити образи"
    
    # Видалення backup файлів
    rm -f "docker-compose.$ENVIRONMENT.backup.yml" || warn "Не вдалося видалити backup файл"
    
    log "✅ Очищення завершено"
}

# Головна функція
main() {
    local deployment_start_time=$(date +%s)
    
    log "🚀 Початок автоматичного деплою на $ENVIRONMENT (стратегія: $DEPLOYMENT_STRATEGY)"
    send_notification "start" "Початок деплою на $ENVIRONMENT"
    
    # Завантаження змінних середовища
    if [ -f ".env.$ENVIRONMENT" ]; then
        source ".env.$ENVIRONMENT"
    fi
    
    # Обробка помилок з автоматичним rollback
    if [ "$AUTO_ROLLBACK" = "true" ]; then
        trap 'rollback' ERR
    fi
    
    # Виконання етапів деплою
    check_prerequisites
    run_tests
    create_backup
    build_images
    deploy
    run_migrations
    
    # Post-deploy перевірки
    if ! post_deploy_health_check; then
        if [ "$AUTO_ROLLBACK" = "true" ]; then
            rollback
            exit 1
        else
            error "Post-deploy health check не пройшов"
        fi
    fi
    
    cleanup
    
    # Розрахунок часу деплою
    local deployment_end_time=$(date +%s)
    local duration=$((deployment_end_time - deployment_start_time))
    
    log "🎉 Деплой завершено успішно!"
    log "⏱️ Час деплою: ${duration} секунд"
    
    # Фінальне повідомлення
    local url=""
    if [ "$ENVIRONMENT" = "production" ] && [ -n "$PRODUCTION_URL" ]; then
        url="$PRODUCTION_URL"
    elif [ "$ENVIRONMENT" = "staging" ] && [ -n "$STAGING_URL" ]; then
        url="$STAGING_URL"
    fi
    
    local message="Деплой на $ENVIRONMENT завершено успішно! Час: ${duration}s"
    if [ -n "$url" ]; then
        message="$message. URL: $url"
    fi
    
    send_notification "success" "$message"
}

# Показ допомоги
show_help() {
    echo "Використання: $0 [ENVIRONMENT] [STRATEGY] [OPTIONS]"
    echo ""
    echo "ENVIRONMENT:"
    echo "  staging     Деплой на staging"
    echo "  production  Деплой на production"
    echo ""
    echo "STRATEGY:"
    echo "  simple      Простий деплой (за замовчуванням)"
    echo "  rolling     Rolling deployment"
    echo "  blue-green  Blue-Green deployment"
    echo "  canary      Canary deployment"
    echo ""
    echo "OPTIONS:"
    echo "  --skip-tests     Пропустити тести"
    echo "  --skip-backup    Пропустити backup"
    echo "  --no-rollback    Вимкнути автоматичний rollback"
    echo "  --help           Показати цю допомогу"
    echo ""
    echo "Змінні середовища:"
    echo "  SKIP_TESTS=true         Пропустити тести"
    echo "  SKIP_BACKUP=true        Пропустити backup"
    echo "  AUTO_ROLLBACK=false     Вимкнути rollback"
    echo "  DOCKER_REGISTRY=...     Docker registry URL"
}

# Обробка аргументів
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --no-rollback)
            AUTO_ROLLBACK=false
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Запуск
main "$@"