#!/bin/bash

# Розширений health check скрипт
set -e

# Кольори
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"; }

# Конфігурація
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
HEALTH_CHECK_TIMEOUT=30
MAX_RETRIES=3

# Функція для перевірки HTTP endpoint'у
check_http_endpoint() {
    local url="$1"
    local expected_status="${2:-200}"
    local timeout="${3:-10}"
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time "$timeout" "$url" 2>/dev/null || echo "000")
        
        if [ "$response" = "$expected_status" ]; then
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            warn "Спроба $retries/$MAX_RETRIES для $url не вдалася (HTTP $response), повторюємо..."
            sleep 2
        fi
    done
    
    error "Endpoint $url недоступний після $MAX_RETRIES спроб (HTTP $response)"
    return 1
}

# Функція для перевірки TCP порту
check_tcp_port() {
    local host="$1"
    local port="$2"
    local timeout="${3:-5}"
    
    if timeout "$timeout" bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Функція для перевірки контейнера Docker
check_docker_container() {
    local service_name="$1"
    
    local container_id=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service_name" 2>/dev/null)
    
    if [ -z "$container_id" ]; then
        error "Контейнер $service_name не знайдено"
        return 1
    fi
    
    local status=$(docker inspect --format='{{.State.Status}}' "$container_id")
    local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "no-health-check")
    
    if [ "$status" != "running" ]; then
        error "Контейнер $service_name не запущений (статус: $status)"
        return 1
    fi
    
    if [ "$health" = "unhealthy" ]; then
        error "Контейнер $service_name нездоровий"
        return 1
    fi
    
    log "✅ Контейнер $service_name здоровий"
    return 0
}

# Функція для перевірки бази даних
check_database() {
    info "Перевірка бази даних..."
    
    # Перевірка контейнера
    if ! check_docker_container "postgres"; then
        return 1
    fi
    
    # Перевірка підключення
    local db_container=$(docker-compose -f "$COMPOSE_FILE" ps -q postgres)
    
    if ! docker exec "$db_container" pg_isready -U postgres -d learning_school -t "$HEALTH_CHECK_TIMEOUT"; then
        error "База даних не готова до підключень"
        return 1
    fi
    
    # Тестовий запит
    local result=$(docker exec "$db_container" psql -U postgres -d learning_school -t -c "SELECT 1;" 2>/dev/null | xargs)
    if [ "$result" != "1" ]; then
        error "Тестовий запит до бази даних не вдався"
        return 1
    fi
    
    # Перевірка розміру бази даних
    local db_size=$(docker exec "$db_container" psql -U postgres -d learning_school -t -c "SELECT pg_size_pretty(pg_database_size('learning_school'));" | xargs)
    
    # Перевірка активних підключень
    local connections=$(docker exec "$db_container" psql -U postgres -d learning_school -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
    
    log "✅ База даних здорова (розмір: $db_size, підключення: $connections)"
    return 0
}

# Функція для перевірки Redis
check_redis() {
    info "Перевірка Redis..."
    
    # Перевірка контейнера
    if ! check_docker_container "redis"; then
        return 1
    fi
    
    local redis_container=$(docker-compose -f "$COMPOSE_FILE" ps -q redis)
    
    # Перевірка ping
    if ! docker exec "$redis_container" redis-cli ping | grep -q "PONG"; then
        error "Redis не відповідає на ping"
        return 1
    fi
    
    # Тестове збереження та отримання
    local test_key="health_check_$(date +%s)"
    local test_value="test_value"
    
    docker exec "$redis_container" redis-cli set "$test_key" "$test_value" ex 60 > /dev/null
    local retrieved_value=$(docker exec "$redis_container" redis-cli get "$test_key")
    
    if [ "$retrieved_value" != "$test_value" ]; then
        error "Redis тест збереження/отримання не вдався"
        return 1
    fi
    
    # Очищення тестового ключа
    docker exec "$redis_container" redis-cli del "$test_key" > /dev/null
    
    # Перевірка використання пам'яті
    local memory_info=$(docker exec "$redis_container" redis-cli info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
    
    log "✅ Redis здоровий (пам'ять: $memory_info)"
    return 0
}

# Функція для перевірки backend API
check_backend_api() {
    info "Перевірка Backend API..."
    
    # Перевірка контейнера
    if ! check_docker_container "backend"; then
        return 1
    fi
    
    local base_url="http://localhost:4000"
    if [ "$ENVIRONMENT" = "production" ] && [ -n "$PRODUCTION_URL" ]; then
        base_url="$PRODUCTION_URL"
    elif [ "$ENVIRONMENT" = "staging" ] && [ -n "$STAGING_URL" ]; then
        base_url="$STAGING_URL"
    fi
    
    # Основні endpoint'и
    local endpoints=(
        "$base_url/health:200"
        "$base_url/api/health:200"
        "$base_url/api/health/detailed:200"
    )
    
    for endpoint_config in "${endpoints[@]}"; do
        local url=$(echo "$endpoint_config" | cut -d: -f1)
        local expected_status=$(echo "$endpoint_config" | cut -d: -f2)
        
        if ! check_http_endpoint "$url" "$expected_status"; then
            return 1
        fi
    done
    
    # Перевірка часу відповіді
    local start_time=$(date +%s%3N)
    check_http_endpoint "$base_url/health" "200" 5
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ "$response_time" -gt 2000 ]; then
        warn "Повільний час відповіді API: ${response_time}ms"
    fi
    
    log "✅ Backend API здоровий (час відповіді: ${response_time}ms)"
    return 0
}

# Функція для перевірки frontend
check_frontend() {
    info "Перевірка Frontend..."
    
    # Перевірка контейнера
    if ! check_docker_container "frontend"; then
        return 1
    fi
    
    local base_url="http://localhost:3000"
    if [ "$ENVIRONMENT" = "production" ] && [ -n "$PRODUCTION_URL" ]; then
        base_url="$PRODUCTION_URL"
    elif [ "$ENVIRONMENT" = "staging" ] && [ -n "$STAGING_URL" ]; then
        base_url="$STAGING_URL"
    fi
    
    # Перевірка головної сторінки
    if ! check_http_endpoint "$base_url" "200"; then
        return 1
    fi
    
    # Перевірка статичних ресурсів
    local static_endpoints=(
        "$base_url/manifest.json:200"
        "$base_url/robots.txt:200"
    )
    
    for endpoint_config in "${static_endpoints[@]}"; do
        local url=$(echo "$endpoint_config" | cut -d: -f1)
        local expected_status=$(echo "$endpoint_config" | cut -d: -f2)
        
        if ! check_http_endpoint "$url" "$expected_status"; then
            warn "Статичний ресурс недоступний: $url"
        fi
    done
    
    log "✅ Frontend здоровий"
    return 0
}

# Функція для перевірки SSL сертифікату
check_ssl_certificate() {
    if [ "$ENVIRONMENT" = "production" ] && [ -n "$PRODUCTION_URL" ]; then
        info "Перевірка SSL сертифікату..."
        
        local domain=$(echo "$PRODUCTION_URL" | sed 's|https\?://||' | cut -d'/' -f1)
        
        # Перевірка підключення SSL
        if ! echo | openssl s_client -servername "$domain" -connect "$domain:443" -verify_return_error > /dev/null 2>&1; then
            error "SSL сертифікат недійсний або недоступний"
            return 1
        fi
        
        # Перевірка терміну дії
        local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
        
        if [ -n "$expiry_date" ]; then
            local expiry_timestamp=$(date -d "$expiry_date" +%s)
            local current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ "$days_until_expiry" -lt 7 ]; then
                error "SSL сертифікат закінчується через $days_until_expiry днів!"
                return 1
            elif [ "$days_until_expiry" -lt 30 ]; then
                warn "SSL сертифікат закінчується через $days_until_expiry днів"
            fi
            
            log "✅ SSL сертифікат дійсний (закінчується через $days_until_expiry днів)"
        fi
    fi
    
    return 0
}

# Функція для перевірки використання ресурсів
check_resource_usage() {
    info "Перевірка використання ресурсів..."
    
    # CPU та Memory для кожного контейнера
    local containers=$(docker-compose -f "$COMPOSE_FILE" ps -q)
    local high_usage_containers=()
    
    for container in $containers; do
        local name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/\///')
        local stats=$(docker stats --no-stream --format "{{.CPUPerc}},{{.MemPerc}}" "$container")
        local cpu=$(echo "$stats" | cut -d, -f1 | sed 's/%//')
        local memory=$(echo "$stats" | cut -d, -f2 | sed 's/%//')
        
        # Перевірка порогів
        if (( $(echo "$cpu > 80" | bc -l) )) || (( $(echo "$memory > 85" | bc -l) )); then
            high_usage_containers+=("$name (CPU: ${cpu}%, Memory: ${memory}%)")
        fi
    done
    
    if [ ${#high_usage_containers[@]} -gt 0 ]; then
        warn "Контейнери з високим використанням ресурсів:"
        for container in "${high_usage_containers[@]}"; do
            warn "  - $container"
        done
    fi
    
    # Загальне використання диску
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        error "Критично високе використання диску: ${disk_usage}%"
        return 1
    elif [ "$disk_usage" -gt 80 ]; then
        warn "Високе використання диску: ${disk_usage}%"
    fi
    
    log "✅ Використання ресурсів в нормі (диск: ${disk_usage}%)"
    return 0
}

# Функція для комплексної перевірки
run_comprehensive_check() {
    log "🏥 Початок комплексної перевірки здоров'я системи ($ENVIRONMENT)"
    
    local checks_passed=0
    local total_checks=0
    local failed_checks=()
    
    # Завантаження змінних середовища
    if [ -f ".env.$ENVIRONMENT" ]; then
        source ".env.$ENVIRONMENT"
    fi
    
    # Список перевірок
    local checks=(
        "check_database:База даних"
        "check_redis:Redis"
        "check_backend_api:Backend API"
        "check_frontend:Frontend"
        "check_resource_usage:Використання ресурсів"
    )
    
    # Додаткові перевірки для production
    if [ "$ENVIRONMENT" = "production" ]; then
        checks+=("check_ssl_certificate:SSL сертифікат")
    fi
    
    # Виконання перевірок
    for check_config in "${checks[@]}"; do
        local check_function=$(echo "$check_config" | cut -d: -f1)
        local check_name=$(echo "$check_config" | cut -d: -f2)
        
        ((total_checks++))
        
        if $check_function; then
            ((checks_passed++))
        else
            failed_checks+=("$check_name")
        fi
    done
    
    # Підсумок
    local success_rate=$((checks_passed * 100 / total_checks))
    
    echo ""
    log "📊 Результати перевірки:"
    log "   Пройшло: $checks_passed/$total_checks ($success_rate%)"
    
    if [ ${#failed_checks[@]} -gt 0 ]; then
        error "   Не вдалося: ${failed_checks[*]}"
    fi
    
    if [ "$success_rate" -eq 100 ]; then
        log "🎉 Всі перевірки пройшли успішно!"
        return 0
    elif [ "$success_rate" -ge 80 ]; then
        warn "⚠️ Більшість перевірок пройшли, але є проблеми"
        return 1
    else
        error "🚨 Критичні проблеми в системі!"
        return 2
    fi
}

# Функція для швидкої перевірки
quick_check() {
    log "⚡ Швидка перевірка здоров'я системи ($ENVIRONMENT)"
    
    # Перевірка основних сервісів
    local services=("postgres" "redis" "backend" "frontend")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if ! check_docker_container "$service"; then
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log "✅ Всі основні сервіси працюють"
        return 0
    else
        error "❌ Проблеми з сервісами: ${failed_services[*]}"
        return 1
    fi
}

# Головна функція
main() {
    local check_type="${2:-comprehensive}"
    
    case "$check_type" in
        "quick")
            quick_check
            ;;
        "comprehensive"|*)
            run_comprehensive_check
            ;;
    esac
}

# Запуск
main "$@"