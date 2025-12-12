#!/bin/bash

# Скрипт для моніторингу системи
set -e

# Кольори
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функції для виводу
log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"; }

# Конфігурація
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_RESPONSE_TIME=2000

# Функція для відправки алертів
send_alert() {
    local message="$1"
    local severity="$2"
    
    # Slack webhook
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local emoji="⚠️"
        if [ "$severity" = "critical" ]; then
            emoji="🚨"
        elif [ "$severity" = "warning" ]; then
            emoji="⚠️"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$emoji [$ENVIRONMENT] $message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || warn "Не вдалося відправити Slack алерт"
    fi
    
    # Email (якщо налаштовано)
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "[$ENVIRONMENT] System Alert" "$ALERT_EMAIL" || warn "Не вдалося відправити email алерт"
    fi
    
    # Логування
    if [ "$severity" = "critical" ]; then
        error "$message"
    else
        warn "$message"
    fi
}

# Перевірка здоров'я контейнерів
check_containers() {
    info "Перевірка стану контейнерів..."
    
    local containers=$(docker-compose -f "$COMPOSE_FILE" ps -q)
    local unhealthy_containers=()
    
    for container in $containers; do
        local status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health-check")
        local name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/\///')
        
        if [ "$status" = "unhealthy" ]; then
            unhealthy_containers+=("$name")
        elif [ "$status" = "no-health-check" ]; then
            # Перевірка чи контейнер запущений
            local running=$(docker inspect --format='{{.State.Running}}' "$container")
            if [ "$running" != "true" ]; then
                unhealthy_containers+=("$name (not running)")
            fi
        fi
    done
    
    if [ ${#unhealthy_containers[@]} -gt 0 ]; then
        send_alert "Нездорові контейнери: ${unhealthy_containers[*]}" "critical"
        return 1
    else
        log "✅ Всі контейнери здорові"
        return 0
    fi
}

# Перевірка використання ресурсів
check_resources() {
    info "Перевірка використання ресурсів..."
    
    # CPU
    local cpu_usage=$(docker stats --no-stream --format "table {{.CPUPerc}}" | tail -n +2 | sed 's/%//' | sort -nr | head -1)
    if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        send_alert "Високе використання CPU: ${cpu_usage}%" "warning"
    fi
    
    # Memory
    local containers=$(docker-compose -f "$COMPOSE_FILE" ps -q)
    for container in $containers; do
        local stats=$(docker stats --no-stream --format "{{.MemPerc}}" "$container" | sed 's/%//')
        local name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/\///')
        
        if (( $(echo "$stats > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
            send_alert "Високе використання пам'яті в $name: ${stats}%" "warning"
        fi
    done
    
    # Disk space
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt "$ALERT_THRESHOLD_DISK" ]; then
        send_alert "Високе використання диску: ${disk_usage}%" "critical"
    fi
    
    log "📊 CPU: ${cpu_usage}%, Disk: ${disk_usage}%"
}

# Перевірка API endpoints
check_api_health() {
    info "Перевірка API endpoints..."
    
    local base_url="http://localhost:4000"
    if [ "$ENVIRONMENT" = "production" ] && [ -n "$PRODUCTION_URL" ]; then
        base_url="$PRODUCTION_URL"
    elif [ "$ENVIRONMENT" = "staging" ] && [ -n "$STAGING_URL" ]; then
        base_url="$STAGING_URL"
    fi
    
    local endpoints=(
        "/health"
        "/api/health"
        "/api/health/detailed"
    )
    
    local failed_endpoints=()
    
    for endpoint in "${endpoints[@]}"; do
        local start_time=$(date +%s%3N)
        local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time 10 "$base_url$endpoint")
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        if [ "$response" != "200" ]; then
            failed_endpoints+=("$endpoint (HTTP $response)")
        elif [ "$response_time" -gt "$ALERT_THRESHOLD_RESPONSE_TIME" ]; then
            send_alert "Повільний відгук $endpoint: ${response_time}ms" "warning"
        fi
    done
    
    if [ ${#failed_endpoints[@]} -gt 0 ]; then
        send_alert "Недоступні endpoints: ${failed_endpoints[*]}" "critical"
        return 1
    else
        log "✅ Всі API endpoints доступні"
        return 0
    fi
}

# Перевірка бази даних
check_database() {
    info "Перевірка бази даних..."
    
    local db_container=$(docker-compose -f "$COMPOSE_FILE" ps -q postgres)
    if [ -z "$db_container" ]; then
        send_alert "Контейнер PostgreSQL не знайдено" "critical"
        return 1
    fi
    
    # Перевірка підключення
    if ! docker exec "$db_container" pg_isready -U postgres > /dev/null 2>&1; then
        send_alert "PostgreSQL не готовий до підключень" "critical"
        return 1
    fi
    
    # Перевірка розміру бази даних
    local db_size=$(docker exec "$db_container" psql -U postgres -d learning_school -t -c "SELECT pg_size_pretty(pg_database_size('learning_school'));" | xargs)
    
    # Перевірка кількості підключень
    local connections=$(docker exec "$db_container" psql -U postgres -d learning_school -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
    
    log "📊 DB Size: $db_size, Active connections: $connections"
    
    # Алерт якщо забагато підключень
    if [ "$connections" -gt 50 ]; then
        send_alert "Забагато активних підключень до БД: $connections" "warning"
    fi
}

# Перевірка Redis
check_redis() {
    info "Перевірка Redis..."
    
    local redis_container=$(docker-compose -f "$COMPOSE_FILE" ps -q redis)
    if [ -z "$redis_container" ]; then
        send_alert "Контейнер Redis не знайдено" "critical"
        return 1
    fi
    
    # Перевірка підключення
    if ! docker exec "$redis_container" redis-cli ping | grep -q "PONG"; then
        send_alert "Redis не відповідає на ping" "critical"
        return 1
    fi
    
    # Перевірка використання пам'яті
    local memory_usage=$(docker exec "$redis_container" redis-cli info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
    
    log "📊 Redis memory usage: $memory_usage"
}

# Перевірка логів на помилки
check_logs() {
    info "Перевірка логів на помилки..."
    
    local services=("backend" "frontend" "postgres" "redis")
    local error_count=0
    
    for service in "${services[@]}"; do
        local container=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null)
        if [ -n "$container" ]; then
            local errors=$(docker logs "$container" --since="5m" 2>&1 | grep -i "error\|exception\|fatal" | wc -l)
            if [ "$errors" -gt 0 ]; then
                error_count=$((error_count + errors))
                warn "$service має $errors помилок за останні 5 хвилин"
            fi
        fi
    done
    
    if [ "$error_count" -gt 10 ]; then
        send_alert "Високий рівень помилок в логах: $error_count за 5 хвилин" "warning"
    fi
}

# Перевірка SSL сертифікатів
check_ssl() {
    if [ "$ENVIRONMENT" = "production" ] && [ -n "$PRODUCTION_URL" ]; then
        info "Перевірка SSL сертифікату..."
        
        local domain=$(echo "$PRODUCTION_URL" | sed 's|https\?://||' | cut -d'/' -f1)
        local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
        
        if [ -n "$expiry_date" ]; then
            local expiry_timestamp=$(date -d "$expiry_date" +%s)
            local current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ "$days_until_expiry" -lt 30 ]; then
                send_alert "SSL сертифікат закінчується через $days_until_expiry днів" "warning"
            elif [ "$days_until_expiry" -lt 7 ]; then
                send_alert "SSL сертифікат закінчується через $days_until_expiry днів!" "critical"
            fi
            
            log "🔒 SSL сертифікат дійсний ще $days_until_expiry днів"
        fi
    fi
}

# Генерація звіту
generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="monitoring_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== MONITORING REPORT ==="
        echo "Environment: $ENVIRONMENT"
        echo "Timestamp: $timestamp"
        echo ""
        
        echo "=== CONTAINER STATUS ==="
        docker-compose -f "$COMPOSE_FILE" ps
        echo ""
        
        echo "=== RESOURCE USAGE ==="
        docker stats --no-stream
        echo ""
        
        echo "=== DISK USAGE ==="
        df -h
        echo ""
        
        echo "=== SYSTEM LOAD ==="
        uptime
        echo ""
        
    } > "$report_file"
    
    info "Звіт збережено: $report_file"
}

# Головна функція
main() {
    log "🔍 Початок моніторингу системи ($ENVIRONMENT)"
    
    local checks_passed=0
    local total_checks=0
    
    # Завантаження змінних середовища
    if [ -f ".env.$ENVIRONMENT" ]; then
        source ".env.$ENVIRONMENT"
    fi
    
    # Запуск перевірок
    ((total_checks++)); check_containers && ((checks_passed++))
    ((total_checks++)); check_resources && ((checks_passed++))
    ((total_checks++)); check_api_health && ((checks_passed++))
    ((total_checks++)); check_database && ((checks_passed++))
    ((total_checks++)); check_redis && ((checks_passed++))
    ((total_checks++)); check_logs && ((checks_passed++))
    
    if [ "$ENVIRONMENT" = "production" ]; then
        ((total_checks++)); check_ssl && ((checks_passed++))
    fi
    
    # Підсумок
    local success_rate=$((checks_passed * 100 / total_checks))
    
    if [ "$success_rate" -eq 100 ]; then
        log "✅ Всі перевірки пройшли успішно ($checks_passed/$total_checks)"
    elif [ "$success_rate" -ge 80 ]; then
        warn "⚠️ Більшість перевірок пройшли ($checks_passed/$total_checks, $success_rate%)"
    else
        send_alert "Критичні проблеми в системі ($checks_passed/$total_checks перевірок пройшли)" "critical"
    fi
    
    # Генерація звіту (опціонально)
    if [ "$2" = "--report" ]; then
        generate_report
    fi
    
    log "🏁 Моніторинг завершено"
}

# Запуск
main "$@"