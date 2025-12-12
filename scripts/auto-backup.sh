#!/bin/bash

# Автоматичний backup скрипт
set -e

# Кольори
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"; }

# Конфігурація
ENVIRONMENT=${1:-production}
BACKUP_DIR="/backups"
RETENTION_DAYS=30
S3_BUCKET=${S3_BACKUP_BUCKET:-"learning-school-backups"}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

# Створення директорії для backup'ів
mkdir -p "$BACKUP_DIR"

# Функція для створення backup'у бази даних
backup_database() {
    log "🗄️ Створення backup'у бази даних..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/db_backup_${ENVIRONMENT}_${timestamp}.sql"
    local compressed_file="${backup_file}.gz"
    
    # Отримання контейнера PostgreSQL
    local db_container=$(docker-compose -f "$COMPOSE_FILE" ps -q postgres)
    if [ -z "$db_container" ]; then
        error "Контейнер PostgreSQL не знайдено"
    fi
    
    # Створення backup'у
    docker exec "$db_container" pg_dump -U postgres learning_school > "$backup_file" || error "Не вдалося створити backup бази даних"
    
    # Стиснення backup'у
    gzip "$backup_file" || error "Не вдалося стиснути backup"
    
    log "✅ Backup створено: $(basename "$compressed_file")"
    echo "$compressed_file"
}

# Функція для backup'у файлів
backup_files() {
    log "📁 Створення backup'у файлів..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/files_backup_${ENVIRONMENT}_${timestamp}.tar.gz"
    
    # Директорії для backup'у
    local dirs_to_backup=(
        "frontend/public/images"
        "backend/uploads"
        ".env.${ENVIRONMENT}"
        "docker-compose.${ENVIRONMENT}.yml"
    )
    
    # Створення архіву
    tar -czf "$backup_file" "${dirs_to_backup[@]}" 2>/dev/null || warn "Деякі файли не вдалося додати до архіву"
    
    log "✅ Backup файлів створено: $(basename "$backup_file")"
    echo "$backup_file"
}

# Функція для відправки backup'у в cloud storage
upload_to_cloud() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    
    if command -v aws &> /dev/null && [ -n "$S3_BUCKET" ]; then
        log "☁️ Відправка backup'у в S3..."
        aws s3 cp "$file_path" "s3://$S3_BUCKET/$ENVIRONMENT/" || warn "Не вдалося відправити backup в S3"
        log "✅ Backup відправлено в S3: s3://$S3_BUCKET/$ENVIRONMENT/$file_name"
    else
        warn "AWS CLI не налаштовано або S3_BUCKET не встановлено"
    fi
}

# Функція для очищення старих backup'ів
cleanup_old_backups() {
    log "🧹 Очищення старих backup'ів..."
    
    # Локальні backup'и
    find "$BACKUP_DIR" -name "*backup_${ENVIRONMENT}_*" -type f -mtime +$RETENTION_DAYS -delete
    
    # S3 backup'и (якщо AWS CLI доступний)
    if command -v aws &> /dev/null && [ -n "$S3_BUCKET" ]; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3 ls "s3://$S3_BUCKET/$ENVIRONMENT/" | while read -r line; do
            local file_date=$(echo "$line" | awk '{print $1}')
            local file_name=$(echo "$line" | awk '{print $4}')
            
            if [[ "$file_date" < "$cutoff_date" ]]; then
                aws s3 rm "s3://$S3_BUCKET/$ENVIRONMENT/$file_name" || warn "Не вдалося видалити старий backup з S3: $file_name"
            fi
        done
    fi
    
    log "✅ Старі backup'и очищено"
}

# Функція для перевірки цілісності backup'у
verify_backup() {
    local backup_file="$1"
    
    log "🔍 Перевірка цілісності backup'у..."
    
    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file"; then
            log "✅ Backup пройшов перевірку цілісності"
            return 0
        else
            error "Backup пошкоджено!"
        fi
    else
        # Для SQL файлів перевіряємо наявність ключових рядків
        if grep -q "PostgreSQL database dump" "$backup_file" && grep -q "PostgreSQL database dump complete" "$backup_file"; then
            log "✅ SQL backup пройшов перевірку цілісності"
            return 0
        else
            error "SQL backup пошкоджено або неповний!"
        fi
    fi
}

# Функція для відправки повідомлення про статус backup'у
send_notification() {
    local status="$1"
    local message="$2"
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local emoji="✅"
        if [ "$status" = "error" ]; then
            emoji="❌"
        elif [ "$status" = "warning" ]; then
            emoji="⚠️"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$emoji [$ENVIRONMENT] Backup: $message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || warn "Не вдалося відправити Slack повідомлення"
    fi
    
    # Email notification
    if [ -n "$BACKUP_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "[$ENVIRONMENT] Backup Status" "$BACKUP_EMAIL" || warn "Не вдалося відправити email"
    fi
}

# Головна функція
main() {
    log "🚀 Початок автоматичного backup'у для $ENVIRONMENT"
    
    # Завантаження змінних середовища
    if [ -f ".env.$ENVIRONMENT" ]; then
        source ".env.$ENVIRONMENT"
    fi
    
    local backup_start_time=$(date +%s)
    local backup_files=()
    
    # Створення backup'у бази даних
    local db_backup=$(backup_database)
    backup_files+=("$db_backup")
    
    # Перевірка цілісності
    verify_backup "$db_backup"
    
    # Створення backup'у файлів
    local files_backup=$(backup_files)
    backup_files+=("$files_backup")
    
    # Відправка в cloud storage
    for backup_file in "${backup_files[@]}"; do
        upload_to_cloud "$backup_file"
    done
    
    # Очищення старих backup'ів
    cleanup_old_backups
    
    # Розрахунок часу виконання
    local backup_end_time=$(date +%s)
    local duration=$((backup_end_time - backup_start_time))
    
    # Розрахунок загального розміру backup'ів
    local total_size=0
    for backup_file in "${backup_files[@]}"; do
        if [ -f "$backup_file" ]; then
            local size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo 0)
            total_size=$((total_size + size))
        fi
    done
    
    local size_mb=$((total_size / 1024 / 1024))
    
    log "🎉 Backup завершено успішно!"
    log "⏱️ Час виконання: ${duration} секунд"
    log "📊 Загальний розмір: ${size_mb} MB"
    log "📁 Файли backup'у: ${#backup_files[@]}"
    
    # Відправка повідомлення про успіх
    send_notification "success" "Backup завершено успішно. Час: ${duration}s, Розмір: ${size_mb}MB"
}

# Обробка помилок
trap 'send_notification "error" "Backup завершився з помилкою на рядку $LINENO"' ERR

# Запуск
main "$@"