# Скрипт для локального запуску проекту

Write-Host "🚀 Запуск проекту локально..." -ForegroundColor Green

# Перевірка необхідних компонентів
$components = @(
    @{Name="Node.js"; Command="node"; Version="--version"},
    @{Name="PostgreSQL"; Command="psql"; Version="--version"},
    @{Name="Redis"; Command="redis-cli"; Version="--version"}
)

Write-Host "🔍 Перевірка компонентів..." -ForegroundColor Yellow
foreach ($component in $components) {
    try {
        $version = & $component.Command $component.Version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $($component.Name): OK" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($component.Name): Не знайдено" -ForegroundColor Red
            Write-Host "Запустіть спочатку: .\scripts\setup-windows.ps1" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "  ❌ $($component.Name): Помилка перевірки" -ForegroundColor Red
    }
}

# Перевірка чи Redis запущено
Write-Host "🔄 Перевірка Redis..." -ForegroundColor Yellow
try {
    $redisTest = & redis-cli ping 2>&1
    if ($redisTest -ne "PONG") {
        Write-Host "🔄 Запуск Redis..." -ForegroundColor Yellow
        Start-Process "redis-server" -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "🔄 Запуск Redis..." -ForegroundColor Yellow
    Start-Process "redis-server" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

# Встановлення залежностей Backend
Write-Host "📦 Встановлення залежностей Backend..." -ForegroundColor Yellow
Set-Location "backend"
if (!(Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Помилка встановлення залежностей Backend" -ForegroundColor Red
        exit 1
    }
}

# Створення .env файлу для backend якщо не існує
if (!(Test-Path ".env")) {
    Write-Host "📝 Створення .env файлу для Backend..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

Set-Location ".."

# Встановлення залежностей Frontend
Write-Host "📦 Встановлення залежностей Frontend..." -ForegroundColor Yellow
Set-Location "frontend"
if (!(Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Помилка встановлення залежностей Frontend" -ForegroundColor Red
        exit 1
    }
}

# Створення .env файлу для frontend якщо не існує
if (!(Test-Path ".env")) {
    Write-Host "📝 Створення .env файлу для Frontend..." -ForegroundColor Yellow
    "REACT_APP_API_URL=http://localhost:4000/api" | Out-File -FilePath ".env" -Encoding UTF8
}

Set-Location ".."

Write-Host ""
Write-Host "🎉 Готово до запуску!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Запуск сервісів..." -ForegroundColor Cyan

# Функція для запуску процесу в новому вікні
function Start-ServiceInNewWindow {
    param(
        [string]$Title,
        [string]$Command,
        [string]$Arguments,
        [string]$WorkingDirectory
    )
    
    $processArgs = @{
        FilePath = "powershell.exe"
        ArgumentList = @(
            "-NoExit",
            "-Command",
            "& { Write-Host '$Title' -ForegroundColor Green; Set-Location '$WorkingDirectory'; $Command $Arguments }"
        )
        WindowStyle = "Normal"
    }
    
    Start-Process @processArgs
}

# Запуск Backend
Write-Host "🔧 Запуск Backend сервера..." -ForegroundColor Yellow
Start-ServiceInNewWindow -Title "🔧 Backend Server (http://localhost:4000)" -Command "npm" -Arguments "run dev" -WorkingDirectory "$PWD\backend"

# Очікування запуску backend
Start-Sleep -Seconds 3

# Запуск Frontend
Write-Host "🎨 Запуск Frontend додатку..." -ForegroundColor Yellow
Start-ServiceInNewWindow -Title "🎨 Frontend App (http://localhost:3000)" -Command "npm" -Arguments "start" -WorkingDirectory "$PWD\frontend"

Write-Host ""
Write-Host "🎉 Проект запущено!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Доступні сервіси:" -ForegroundColor Cyan
Write-Host "  🎨 Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  🔧 Backend:   http://localhost:4000" -ForegroundColor White
Write-Host "  📊 API Docs:  http://localhost:4000/api-docs" -ForegroundColor White
Write-Host "  🗄️  Database: localhost:5432" -ForegroundColor White
Write-Host "  🔄 Redis:     localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Тестовий користувач:" -ForegroundColor Cyan
Write-Host "  Email: admin@learning-school.com" -ForegroundColor White
Write-Host "  Пароль: admin123" -ForegroundColor White
Write-Host ""
Write-Host "⏹️  Для зупинки: Закрийте вікна PowerShell або натисніть Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Очікування перед відкриттям браузера
Start-Sleep -Seconds 5

# Відкриття браузера
Write-Host "🌐 Відкриття браузера..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host "✨ Успішного використання!" -ForegroundColor Green