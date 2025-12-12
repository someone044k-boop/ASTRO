# Автоматизація та CI/CD

## ✅ Реалізована система автоматизації

### 🔄 GitHub Actions Pipeline

#### Автоматичні процеси
- ✅ **Continuous Integration**: Автоматичне тестування при кожному push/PR
- ✅ **Continuous Deployment**: Автоматичний деплой на staging/production
- ✅ **Automated Testing**: Unit, integration та security тести
- ✅ **Code Quality**: ESLint, security audit, code analysis
- ✅ **Dependency Management**: Автоматична перевірка оновлень залежностей

#### Заплановані завдання
- ✅ **Нічні backup'и**: Щодня о 2:00 UTC
- ✅ **Health checks**: Щодня о 6:00 UTC  
- ✅ **Dependency updates**: Щотижня в понеділок о 9:00 UTC
- ✅ **Security scans**: При кожному PR

### 🐳 Docker автоматизація

#### Стратегії деплою
- ✅ **Rolling Deployment**: Поступове оновлення без downtime
- ✅ **Blue-Green Deployment**: Миттєве переключення між версіями
- ✅ **Canary Deployment**: Тестування на частині трафіку
- ✅ **Simple Deployment**: Базовий деплой для розробки

#### Автоматичні перевірки
- ✅ **Health Checks**: Перевірка стану всіх сервісів
- ✅ **Resource Monitoring**: Моніторинг CPU, RAM, Disk
- ✅ **Performance Tests**: Автоматичне тестування продуктивності
- ✅ **Security Scans**: Сканування вразливостей

### 📊 Система моніторингу

#### Prometheus + Grafana Stack
- ✅ **Metrics Collection**: Збір метрик з усіх сервісів
- ✅ **Alerting**: Автоматичні алерти в Slack/Email
- ✅ **Dashboards**: Візуалізація метрик та трендів
- ✅ **Log Aggregation**: Централізований збір логів

#### Автоматичні алерти
- ✅ **System Alerts**: CPU, Memory, Disk usage
- ✅ **Application Alerts**: Error rates, response times
- ✅ **Infrastructure Alerts**: Container health, SSL expiry
- ✅ **Business Alerts**: User activity, payment issues

### 💾 Backup автоматизація

#### Автоматичні backup'и
- ✅ **Database Backups**: Щоденні backup'и PostgreSQL
- ✅ **File Backups**: Backup статичних файлів та конфігурацій
- ✅ **Cloud Storage**: Автоматична відправка в S3/Cloud Storage
- ✅ **Retention Policy**: Автоматичне видалення старих backup'ів
- ✅ **Integrity Checks**: Перевірка цілісності backup'ів

#### Disaster Recovery
- ✅ **Automated Restore**: Скрипти для швидкого відновлення
- ✅ **Rollback Procedures**: Автоматичний rollback при помилках
- ✅ **Data Validation**: Перевірка даних після відновлення

## 🚀 Команди для автоматизації

### Windows (PowerShell)
```powershell
# Повне налаштування CI/CD та моніторингу
.\scripts\setup-cicd.ps1 -Environment production -Action setup

# Запуск моніторингу
.\scripts\setup-cicd.ps1 -Environment production -Action start

# Перевірка статусу
.\scripts\setup-cicd.ps1 -Environment production -Action status

# Health check
.\scripts\health-check.ps1 -Environment production -CheckType comprehensive

# Створення backup'у
.\scripts\auto-backup.ps1 -Environment production
```

### Linux/macOS (Bash)
```bash
# Повне налаштування моніторингу
./scripts/setup-monitoring.sh production setup

# Автоматичний деплой
./scripts/auto-deploy.sh production rolling

# Health check
./scripts/health-check.sh production comprehensive

# Створення backup'у
./scripts/auto-backup.sh production

# Моніторинг системи
./scripts/monitoring.sh production --report
```

### Docker команди
```bash
# Запуск моніторингу
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Перегляд логів моніторингу
docker-compose -f docker-compose.monitoring.yml logs -f

# Зупинка моніторингу
docker-compose -f docker-compose.monitoring.yml down
```

## 📋 Налаштування автоматизації

### GitHub Secrets
Необхідні секрети для GitHub Actions:

```
# Docker Registry
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password

# Server Access
STAGING_HOST=staging.server.ip
STAGING_USER=deploy
STAGING_SSH_KEY=-----BEGIN PRIVATE KEY-----...
PRODUCTION_HOST=production.server.ip
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=-----BEGIN PRIVATE KEY-----...

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=admin@yourdomain.com

# Security
SNYK_TOKEN=your_snyk_token

# Cloud Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BACKUP_BUCKET=learning-school-backups
```

### Environment Variables
Змінні середовища в `.env.production`:

```bash
# Application
NODE_ENV=production
DB_PASSWORD=secure_production_password
JWT_SECRET=secure_jwt_secret
STRIPE_SECRET_KEY=sk_live_...

# URLs
PRODUCTION_URL=https://yourdomain.com
STAGING_URL=https://staging.yourdomain.com

# Monitoring
GRAFANA_PASSWORD=secure_grafana_password
PROMETHEUS_RETENTION=30d

# Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=admin@yourdomain.com
SMTP_USERNAME=alerts@yourdomain.com
SMTP_PASSWORD=smtp_password

# Backup
S3_BACKUP_BUCKET=learning-school-backups
BACKUP_RETENTION_DAYS=30
BACKUP_EMAIL=backup@yourdomain.com
```

### Cron Jobs (Linux/macOS)
```bash
# Додати до crontab (crontab -e)

# Щоденний backup о 2:00
0 2 * * * /path/to/scripts/auto-backup.sh production >> /var/log/auto-backup.log 2>&1

# Health check кожні 5 хвилин
*/5 * * * * /path/to/scripts/health-check.sh production quick >> /var/log/health-check.log 2>&1

# Моніторинг кожні 10 хвилин
*/10 * * * * /path/to/scripts/monitoring.sh production >> /var/log/monitoring.log 2>&1

# Очищення логів щотижня
0 3 * * 0 find /var/log -name "*.log" -mtime +7 -delete
```

### Windows Task Scheduler
Автоматично створюється скриптом `setup-cicd.ps1`:

- **LearningSchool-AutoBackup**: Щоденний backup о 2:00
- **LearningSchool-HealthCheck**: Health check кожні 5 хвилин
- **LearningSchool-Monitoring**: Моніторинг кожні 10 хвилин

## 📊 Моніторинг дашборди

### Grafana Dashboards
Доступні за адресою: `http://localhost:3001`

1. **System Overview**
   - CPU, Memory, Disk usage
   - Network traffic
   - Container status
   - System load

2. **Application Metrics**
   - Request rate and response time
   - Error rates by endpoint
   - Database performance
   - Cache hit rates

3. **Business Metrics**
   - User registrations
   - Course enrollments
   - Payment transactions
   - Active users

4. **Infrastructure**
   - Docker container health
   - Database connections
   - Redis performance
   - SSL certificate status

### Prometheus Metrics
Доступні за адресою: `http://localhost:9090`

- **System metrics**: CPU, Memory, Disk, Network
- **Application metrics**: HTTP requests, response times, errors
- **Database metrics**: Connections, queries, performance
- **Custom metrics**: Business KPIs, user activity

### AlertManager
Доступний за адресою: `http://localhost:9093`

- **Critical alerts**: System down, high error rate
- **Warning alerts**: High resource usage, slow responses
- **Info alerts**: Deployments, maintenance windows

## 🔧 Налаштування алертів

### Slack Integration
```yaml
# alertmanager.yml
slack_configs:
- api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
  channel: '#alerts'
  title: '🚨 Production Alert'
  text: |
    {{ range .Alerts }}
    *Alert:* {{ .Annotations.summary }}
    *Description:* {{ .Annotations.description }}
    *Severity:* {{ .Labels.severity }}
    {{ end }}
```

### Email Alerts
```yaml
# alertmanager.yml
email_configs:
- to: 'admin@yourdomain.com'
  subject: '🚨 {{ .GroupLabels.alertname }}'
  body: |
    {{ range .Alerts }}
    Alert: {{ .Annotations.summary }}
    Description: {{ .Annotations.description }}
    Time: {{ .StartsAt }}
    {{ end }}
```

### Custom Webhooks
```yaml
# alertmanager.yml
webhook_configs:
- url: 'https://your-webhook-endpoint.com/alerts'
  send_resolved: true
```

## 🔍 Troubleshooting автоматизації

### Типові проблеми

#### GitHub Actions не запускаються
```bash
# Перевірка workflow файлу
yamllint .github/workflows/ci-cd.yml

# Перевірка secrets
# GitHub → Settings → Secrets and variables → Actions
```

#### Моніторинг не працює
```bash
# Перевірка Docker контейнерів
docker-compose -f monitoring/docker-compose.monitoring.yml ps

# Перевірка логів
docker-compose -f monitoring/docker-compose.monitoring.yml logs prometheus
docker-compose -f monitoring/docker-compose.monitoring.yml logs grafana

# Перезапуск моніторингу
docker-compose -f monitoring/docker-compose.monitoring.yml restart
```

#### Backup'и не створюються
```bash
# Перевірка cron jobs
crontab -l

# Перевірка логів backup'у
tail -f /var/log/auto-backup.log

# Ручний запуск backup'у
./scripts/auto-backup.sh production
```

#### Алерти не приходять
```bash
# Перевірка AlertManager
curl http://localhost:9093/api/v1/status

# Перевірка Slack webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_SLACK_WEBHOOK_URL

# Перевірка email налаштувань
docker-compose -f monitoring/docker-compose.monitoring.yml logs alertmanager
```

### Логи та діагностика

#### Важливі лог файли
```bash
# Application logs
/var/log/backend/app.log
/var/log/frontend/access.log
/var/log/nginx/error.log

# System logs
/var/log/syslog
/var/log/docker.log

# Automation logs
/var/log/auto-backup.log
/var/log/health-check.log
/var/log/monitoring.log
```

#### Команди діагностики
```bash
# Перевірка системних ресурсів
htop
df -h
free -h

# Перевірка Docker
docker system df
docker system prune

# Перевірка мережі
netstat -tulpn
ss -tulpn
```

## 📈 Метрики успіху автоматизації

### SLA цілі
- **Uptime**: 99.9%
- **Deployment frequency**: Daily
- **Lead time**: < 1 hour
- **MTTR**: < 30 minutes
- **Change failure rate**: < 5%

### KPI автоматизації
- **Automated deployments**: 100%
- **Test coverage**: > 80%
- **Security vulnerabilities**: 0 high/critical
- **Backup success rate**: 100%
- **Alert response time**: < 5 minutes

### Звіти та аналітика
- **Weekly automation report**: Статистика деплоїв, тестів, алертів
- **Monthly performance review**: Аналіз метрик та покращення
- **Quarterly security audit**: Перевірка безпеки та compliance

## 🎯 Наступні кроки

### Покращення автоматизації
1. **Infrastructure as Code**: Terraform для управління інфраструктурою
2. **GitOps**: ArgoCD для автоматичного деплою
3. **Chaos Engineering**: Chaos Monkey для тестування стійкості
4. **AI/ML Monitoring**: Аномалії detection та predictive alerts

### Розширення моніторингу
1. **APM Integration**: New Relic, DataDog для глибшого аналізу
2. **Real User Monitoring**: Відстеження реальних користувачів
3. **Synthetic Monitoring**: Автоматичне тестування user journeys
4. **Business Intelligence**: Інтеграція з BI системами

### Автоматизація безпеки
1. **SAST/DAST**: Автоматичне сканування коду та додатків
2. **Dependency scanning**: Автоматична перевірка вразливостей
3. **Compliance monitoring**: Автоматична перевірка compliance
4. **Incident response**: Автоматизація реагування на інциденти