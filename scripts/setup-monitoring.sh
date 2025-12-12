#!/bin/bash

# Скрипт для налаштування моніторингу
set -e

# Кольори
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"; }

# Конфігурація
ENVIRONMENT=${1:-production}
MONITORING_DIR="monitoring"

# Функція для створення директорій
create_directories() {
    log "📁 Створення директорій для моніторингу..."
    
    local dirs=(
        "$MONITORING_DIR/grafana/provisioning/datasources"
        "$MONITORING_DIR/grafana/provisioning/dashboards"
        "$MONITORING_DIR/grafana/dashboards"
        "$MONITORING_DIR/data/prometheus"
        "$MONITORING_DIR/data/grafana"
        "$MONITORING_DIR/data/alertmanager"
        "$MONITORING_DIR/data/loki"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        log "Створено: $dir"
    done
}

# Функція для налаштування дозволів
setup_permissions() {
    log "🔐 Налаштування дозволів..."
    
    # Grafana потребує специфічних дозволів
    sudo chown -R 472:472 "$MONITORING_DIR/data/grafana" 2>/dev/null || warn "Не вдалося встановити дозволи для Grafana"
    
    # Prometheus
    sudo chown -R 65534:65534 "$MONITORING_DIR/data/prometheus" 2>/dev/null || warn "Не вдалося встановити дозволи для Prometheus"
    
    # Loki
    sudo chown -R 10001:10001 "$MONITORING_DIR/data/loki" 2>/dev/null || warn "Не вдалося встановити дозволи для Loki"
}

# Функція для створення .env файлу для моніторингу
create_monitoring_env() {
    log "⚙️ Створення .env файлу для моніторингу..."
    
    local env_file="$MONITORING_DIR/.env"
    
    cat > "$env_file" << EOF
# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin123
DOMAIN=localhost

# AlertManager
ALERT_EMAIL=admin@learning-school.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# SMTP для email алертів
SMTP_USERNAME=alerts@learning-school.com
SMTP_PASSWORD=your_smtp_password

# Database
DB_PASSWORD=your_db_password
EOF
    
    log "Створено: $env_file"
    warn "Не забудьте оновити змінні в $env_file"
}

# Функція для запуску моніторингу
start_monitoring() {
    log "🚀 Запуск системи моніторингу..."
    
    cd "$MONITORING_DIR"
    
    # Перевірка наявності Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не встановлено"
    fi
    
    # Запуск сервісів моніторингу
    docker-compose -f docker-compose.monitoring.yml up -d || error "Не вдалося запустити сервіси моніторингу"
    
    cd ..
    
    log "✅ Система моніторингу запущена"
}

# Функція для перевірки статусу
check_monitoring_status() {
    log "🔍 Перевірка статусу моніторингу..."
    
    local services=(
        "prometheus:9090"
        "grafana:3001"
        "alertmanager:9093"
        "node-exporter:9100"
        "cadvisor:8080"
    )
    
    local failed_services=()
    
    for service_config in "${services[@]}"; do
        local service=$(echo "$service_config" | cut -d: -f1)
        local port=$(echo "$service_config" | cut -d: -f2)
        
        if curl -f "http://localhost:$port" > /dev/null 2>&1; then
            log "✅ $service доступний на порту $port"
        else
            failed_services+=("$service:$port")
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        warn "Недоступні сервіси: ${failed_services[*]}"
        return 1
    else
        log "🎉 Всі сервіси моніторингу працюють"
        return 0
    fi
}

# Функція для створення базових дашбордів
create_basic_dashboards() {
    log "📊 Створення базових дашбордів..."
    
    # System Overview Dashboard
    cat > "$MONITORING_DIR/grafana/dashboards/system-overview.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "System Overview",
    "tags": ["system"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "CPU Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "Memory Usage %"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      }
    ],
    "time": {"from": "now-1h", "to": "now"},
    "refresh": "30s"
  }
}
EOF
    
    # Application Dashboard
    cat > "$MONITORING_DIR/grafana/dashboards/application.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Learning School Application",
    "tags": ["application"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "HTTP Requests Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8}
      }
    ],
    "time": {"from": "now-1h", "to": "now"},
    "refresh": "30s"
  }
}
EOF
    
    log "✅ Базові дашборди створено"
}

# Функція для налаштування алертів
setup_alerts() {
    log "🚨 Налаштування алертів..."
    
    # Перевірка наявності Slack webhook
    if [ -z "$SLACK_WEBHOOK_URL" ] || [ "$SLACK_WEBHOOK_URL" = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" ]; then
        warn "Slack webhook не налаштовано. Оновіть SLACK_WEBHOOK_URL в $MONITORING_DIR/.env"
    fi
    
    # Перевірка email налаштувань
    if [ -z "$ALERT_EMAIL" ] || [ "$ALERT_EMAIL" = "admin@learning-school.com" ]; then
        warn "Email для алертів не налаштовано. Оновіть ALERT_EMAIL в $MONITORING_DIR/.env"
    fi
    
    log "✅ Алерти налаштовано (перевірте конфігурацію)"
}

# Функція для створення cron job'ів
setup_cron_jobs() {
    log "⏰ Налаштування cron job'ів..."
    
    # Backup cron job
    local backup_cron="0 2 * * * /bin/bash $(pwd)/scripts/auto-backup.sh production >> /var/log/auto-backup.log 2>&1"
    
    # Health check cron job
    local health_cron="*/5 * * * * /bin/bash $(pwd)/scripts/health-check.sh production quick >> /var/log/health-check.log 2>&1"
    
    # Monitoring cron job
    local monitoring_cron="*/10 * * * * /bin/bash $(pwd)/scripts/monitoring.sh production >> /var/log/monitoring.log 2>&1"
    
    # Додавання до crontab
    (crontab -l 2>/dev/null; echo "$backup_cron") | crontab - || warn "Не вдалося додати backup cron job"
    (crontab -l 2>/dev/null; echo "$health_cron") | crontab - || warn "Не вдалося додати health check cron job"
    (crontab -l 2>/dev/null; echo "$monitoring_cron") | crontab - || warn "Не вдалося додати monitoring cron job"
    
    log "✅ Cron job'и налаштовано"
}

# Функція для показу інформації про доступ
show_access_info() {
    log "🌐 Інформація про доступ до моніторингу:"
    echo ""
    echo "📊 Grafana (Dashboards): http://localhost:3001"
    echo "   Логін: admin / Пароль: admin123"
    echo ""
    echo "🔍 Prometheus (Metrics): http://localhost:9090"
    echo ""
    echo "🚨 AlertManager (Alerts): http://localhost:9093"
    echo ""
    echo "📈 Node Exporter (System): http://localhost:9100"
    echo ""
    echo "🐳 cAdvisor (Containers): http://localhost:8080"
    echo ""
    warn "Не забудьте змінити паролі в production!"
}

# Головна функція
main() {
    log "🚀 Налаштування системи моніторингу для $ENVIRONMENT"
    
    create_directories
    create_monitoring_env
    setup_permissions
    create_basic_dashboards
    start_monitoring
    
    # Очікування запуску сервісів
    info "Очікування запуску сервісів (30 секунд)..."
    sleep 30
    
    check_monitoring_status
    setup_alerts
    setup_cron_jobs
    
    show_access_info
    
    log "🎉 Система моніторингу налаштована!"
    log "📚 Документація: monitoring/README.md"
}

# Функція для зупинки моніторингу
stop_monitoring() {
    log "🛑 Зупинка системи моніторингу..."
    
    cd "$MONITORING_DIR"
    docker-compose -f docker-compose.monitoring.yml down || warn "Не вдалося зупинити сервіси"
    cd ..
    
    log "✅ Система моніторингу зупинена"
}

# Функція для перезапуску моніторингу
restart_monitoring() {
    log "🔄 Перезапуск системи моніторингу..."
    
    stop_monitoring
    sleep 5
    start_monitoring
    
    log "✅ Система моніторингу перезапущена"
}

# Обробка аргументів
case "${2:-setup}" in
    "setup")
        main
        ;;
    "start")
        start_monitoring
        ;;
    "stop")
        stop_monitoring
        ;;
    "restart")
        restart_monitoring
        ;;
    "status")
        check_monitoring_status
        ;;
    *)
        echo "Використання: $0 [ENVIRONMENT] [ACTION]"
        echo ""
        echo "ENVIRONMENT: staging, production (за замовчуванням: production)"
        echo ""
        echo "ACTION:"
        echo "  setup    - Повне налаштування моніторингу (за замовчуванням)"
        echo "  start    - Запуск моніторингу"
        echo "  stop     - Зупинка моніторингу"
        echo "  restart  - Перезапуск моніторингу"
        echo "  status   - Перевірка статусу"
        exit 1
        ;;
esac