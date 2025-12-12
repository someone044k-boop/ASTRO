# Деплой та CI/CD

## ✅ Реалізована CI/CD система

### 🔄 GitHub Actions Pipeline

#### Автоматичні перевірки
- ✅ Тестування backend та frontend
- ✅ ESLint та code quality перевірки
- ✅ Security audit (npm audit)
- ✅ Аналіз коду та метрики
- ✅ Збірка production версій

#### Деплой процес
- ✅ Автоматичний деплой на staging (develop гілка)
- ✅ Ручний деплой на production (main гілка)
- ✅ Blue-green deployment для zero downtime
- ✅ Автоматичні backup'и перед деплоєм
- ✅ Health checks після деплою

### 🐳 Docker оптимізації

#### Production образи
- ✅ Multi-stage builds для мінімального розміру
- ✅ Non-root користувачі для безпеки
- ✅ Health checks для всіх сервісів
- ✅ Оптимізовані Nginx та Node.js конфігурації

#### Orchestration
- ✅ Docker Compose для production
- ✅ Resource limits та reservations
- ✅ Persistent volumes для даних
- ✅ Network isolation

### 📊 Моніторинг та алерти

#### Prometheus + Grafana
- ✅ Збір метрик з усіх сервісів
- ✅ Дашборди для візуалізації
- ✅ Алерти за критичними метриками
- ✅ Історичні дані та тренди

#### Автоматичні перевірки
- ✅ Health checks контейнерів
- ✅ Моніторинг ресурсів (CPU, RAM, Disk)
- ✅ Перевірка API endpoints
- ✅ Моніторинг бази даних та Redis
- ✅ Перевірка SSL сертифікатів

### 💾 Backup стратегії

#### Автоматичні backup'и
- ✅ Щоденні backup'и бази даних
- ✅ Збереження в cloud storage
- ✅ Ротація backup'ів (30 днів)
- ✅ Тестування відновлення

## 🚀 Команди для деплою

### Локальний деплой
```bash
# Staging
./scripts/deploy.sh staging

# Production
./scripts/deploy.sh production

# З пропуском тестів
./scripts/deploy.sh production --skip-tests

# З пропуском backup'у
./scripts/deploy.sh staging --skip-backup
```

### Моніторинг
```bash
# Перевірка системи
./scripts/monitoring.sh production

# З генерацією звіту
./scripts/monitoring.sh production --report

# Перевірка staging
./scripts/monitoring.sh staging
```

### Docker команди
```bash
# Збірка production образів
docker build -t learning-school-frontend:prod -f frontend/Dockerfile.prod frontend/
docker build -t learning-school-backend:prod -f backend/Dockerfile.prod backend/

# Запуск production stack
docker-compose -f docker-compose.prod.yml up -d

# Перегляд логів
docker-compose -f docker-compose.prod.yml logs -f

# Зупинка
docker-compose -f docker-compose.prod.yml down
```

## 📋 Налаштування середовищ

### Змінні середовища

#### .env.staging
```bash
NODE_ENV=staging
DB_PASSWORD=staging_password
JWT_SECRET=staging_jwt_secret
STRIPE_SECRET_KEY=sk_test_...
STAGING_URL=https://staging.yourdomain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

#### .env.production
```bash
NODE_ENV=production
DB_PASSWORD=secure_production_password
JWT_SECRET=secure_jwt_secret
STRIPE_SECRET_KEY=sk_live_...
PRODUCTION_URL=https://yourdomain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
ALERT_EMAIL=admin@yourdomain.com
```

### GitHub Secrets
```
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password
STAGING_HOST=staging.server.ip
STAGING_USER=deploy
STAGING_SSH_KEY=-----BEGIN PRIVATE KEY-----...
PRODUCTION_HOST=production.server.ip
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=-----BEGIN PRIVATE KEY-----...
SLACK_WEBHOOK=https://hooks.slack.com/...
SNYK_TOKEN=your_snyk_token
```

## 🔧 Налаштування серверів

### Staging сервер
```bash
# Встановлення Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Встановлення Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Створення користувача для деплою
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# Налаштування SSH ключів
sudo mkdir -p /home/deploy/.ssh
sudo chown deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
```

### Production сервер
```bash
# Те ж саме + додаткові налаштування безпеки
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Fail2ban для захисту SSH
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Автоматичні оновлення безпеки
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📊 Моніторинг дашборди

### Grafana дашборди
1. **System Overview**
   - CPU, Memory, Disk usage
   - Network traffic
   - Container status

2. **Application Metrics**
   - Request rate and response time
   - Error rates
   - Database performance

3. **Business Metrics**
   - User registrations
   - Course enrollments
   - Payment transactions

### Алерти
- **Critical**: Система недоступна, високий error rate
- **Warning**: Високе використання ресурсів, повільні запити
- **Info**: Високий трафік, нові деплої

## 🔍 Troubleshooting

### Типові проблеми

#### Деплой не вдається
```bash
# Перевірка логів
docker-compose -f docker-compose.prod.yml logs backend

# Перевірка health checks
curl -f http://localhost:4000/health

# Перевірка змінних середовища
docker-compose -f docker-compose.prod.yml exec backend env
```

#### Високе використання ресурсів
```bash
# Аналіз використання пам'яті
docker stats

# Перевірка повільних запитів
curl http://localhost:4000/api/optimization/queries/slow

# Оптимізація бази даних
curl -X POST http://localhost:4000/api/optimization/database/optimize
```

#### Проблеми з SSL
```bash
# Перевірка сертифікату
openssl s_client -servername yourdomain.com -connect yourdomain.com:443

# Оновлення Let's Encrypt
sudo certbot renew --dry-run
```

## 📚 Наступні кроки

### Покращення CI/CD
1. **Parallel testing** - Паралельне виконання тестів
2. **Canary deployments** - Поступовий rollout
3. **Feature flags** - Управління функціями
4. **A/B testing** - Тестування варіантів

### Розширення моніторингу
1. **APM integration** - New Relic, DataDog
2. **Log aggregation** - ELK Stack
3. **Synthetic monitoring** - Pingdom, UptimeRobot
4. **Real User Monitoring** - Google Analytics, Hotjar

### Автоматизація
1. **Auto-scaling** - Kubernetes HPA
2. **Self-healing** - Automatic restart policies
3. **Chaos engineering** - Chaos Monkey
4. **Performance testing** - Load testing in CI

## 🎯 Метрики успіху

### SLA цілі
- **Uptime**: 99.9%
- **Response time**: < 2s (95th percentile)
- **Error rate**: < 1%
- **Deployment frequency**: Daily
- **Lead time**: < 1 hour
- **MTTR**: < 30 minutes

### KPI
- Zero-downtime deployments: 100%
- Automated test coverage: > 80%
- Security vulnerabilities: 0 high/critical
- Performance regression: 0%