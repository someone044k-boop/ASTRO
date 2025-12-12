# Скрипт для налаштування бази даних PostgreSQL

Write-Host "🗄️  Налаштування бази даних PostgreSQL..." -ForegroundColor Green

# Перевірка чи PostgreSQL запущено
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne "Running") {
    Write-Host "🔄 Запуск сервісу PostgreSQL..." -ForegroundColor Yellow
    Start-Service $pgService.Name
}

# Очікування запуску сервісу
Start-Sleep -Seconds 3

# Встановлення змінної середовища для пароля
$env:PGPASSWORD = "postgres123"

Write-Host "📊 Створення бази даних..." -ForegroundColor Yellow

# Створення бази даних
try {
    # Перевірка підключення
    $testConnection = & psql -h localhost -U postgres -d postgres -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Підключення до PostgreSQL успішне" -ForegroundColor Green
        
        # Створення бази даних для розробки
        Write-Host "📝 Створення бази даних learning_school..." -ForegroundColor Yellow
        & psql -h localhost -U postgres -d postgres -c "CREATE DATABASE learning_school;" 2>$null
        
        # Створення бази даних для тестів
        Write-Host "📝 Створення бази даних learning_school_test..." -ForegroundColor Yellow
        & psql -h localhost -U postgres -d postgres -c "CREATE DATABASE learning_school_test;" 2>$null
        
        # Ініціалізація схеми для розробки
        if (Test-Path "database\init.sql") {
            Write-Host "🏗️  Ініціалізація схеми бази даних..." -ForegroundColor Yellow
            & psql -h localhost -U postgres -d learning_school -f "database\init.sql"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Схема бази даних створена успішно!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Помилка при створенні схеми (можливо вже існує)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️  Файл database\init.sql не знайдено" -ForegroundColor Yellow
        }
        
        # Ініціалізація схеми для тестів
        Write-Host "🧪 Ініціалізація тестової бази даних..." -ForegroundColor Yellow
        & psql -h localhost -U postgres -d learning_school_test -f "database\init.sql" 2>$null
        
    } else {
        Write-Host "❌ Не вдалося підключитися до PostgreSQL" -ForegroundColor Red
        Write-Host "Перевірте чи запущено сервіс PostgreSQL" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Помилка при роботі з базою даних: $_" -ForegroundColor Red
    exit 1
}

# Перевірка Redis
Write-Host "🔄 Перевірка Redis..." -ForegroundColor Yellow
try {
    $redisTest = & redis-cli ping 2>&1
    if ($redisTest -eq "PONG") {
        Write-Host "✅ Redis працює коректно" -ForegroundColor Green
    } else {
        Write-Host "🔄 Запуск Redis..." -ForegroundColor Yellow
        Start-Process "redis-server" -WindowStyle Hidden
        Start-Sleep -Seconds 2
        
        $redisTest2 = & redis-cli ping 2>&1
        if ($redisTest2 -eq "PONG") {
            Write-Host "✅ Redis запущено успішно" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Redis може не працювати коректно" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Не вдалося перевірити Redis: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Налаштування бази даних завершено!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Створені бази даних:" -ForegroundColor Cyan
Write-Host "  📊 learning_school (розробка)" -ForegroundColor White
Write-Host "  🧪 learning_school_test (тести)" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Дані для підключення:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  User: postgres" -ForegroundColor White
Write-Host "  Password: postgres123" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Тепер можна запускати проект: .\scripts\start-local.ps1" -ForegroundColor Green