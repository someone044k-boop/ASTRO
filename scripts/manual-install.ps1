# Ручне встановлення без прав адміністратора

Write-Host "📦 Ручне встановлення компонентів..." -ForegroundColor Green

$downloadDir = "$env:USERPROFILE\Downloads\learning-school-setup"
New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null

Write-Host "📁 Директорія завантажень: $downloadDir" -ForegroundColor Cyan

# Перевірка Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "❌ Node.js не встановлено" -ForegroundColor Red
    Write-Host "📥 Завантажте та встановіть Node.js:" -ForegroundColor Yellow
    Write-Host "   https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi" -ForegroundColor Cyan
    Write-Host "   Після встановлення перезапустіть PowerShell" -ForegroundColor Yellow
    
    # Відкриття сторінки завантаження
    Start-Process "https://nodejs.org/en/download/"
} else {
    $nodeVersion = node --version
    Write-Host "✅ Node.js встановлено: $nodeVersion" -ForegroundColor Green
}

# Перевірка PostgreSQL
if (!(Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "❌ PostgreSQL не встановлено" -ForegroundColor Red
    Write-Host "📥 Завантажте та встановіть PostgreSQL:" -ForegroundColor Yellow
    Write-Host "   https://get.enterprisedb.com/postgresql/postgresql-15.5-1-windows-x64.exe" -ForegroundColor Cyan
    Write-Host "   Під час встановлення встановіть пароль: postgres123" -ForegroundColor Yellow
    
    # Відкриття сторінки завантаження
    Start-Process "https://www.postgresql.org/download/windows/"
} else {
    Write-Host "✅ PostgreSQL встановлено" -ForegroundColor Green
}

# Встановлення Redis (портативна версія)
$redisDir = "$env:USERPROFILE\Redis"
if (!(Test-Path "$redisDir\redis-server.exe")) {
    Write-Host ""
    Write-Host "📦 Завантаження Redis..." -ForegroundColor Yellow
    
    try {
        $redisUrl = "https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.zip"
        $redisZip = "$downloadDir\redis.zip"
        
        Invoke-WebRequest -Uri $redisUrl -OutFile $redisZip -UseBasicParsing
        Expand-Archive -Path $redisZip -DestinationPath $redisDir -Force
        
        Write-Host "✅ Redis встановлено в: $redisDir" -ForegroundColor Green
        
        # Додавання до PATH користувача
        $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($userPath -notlike "*$redisDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$userPath;$redisDir", "User")
            $env:PATH += ";$redisDir"
        }
        
    } catch {
        Write-Host "❌ Помилка завантаження Redis: $_" -ForegroundColor Red
        Write-Host "📥 Завантажте вручну:" -ForegroundColor Yellow
        Write-Host "   https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.zip" -ForegroundColor Cyan
    }
} else {
    Write-Host "✅ Redis вже встановлено" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Інструкції по встановленню:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Node.js:" -ForegroundColor Yellow
Write-Host "   - Завантажте з https://nodejs.org/" -ForegroundColor White
Write-Host "   - Встановіть з налаштуваннями за замовчуванням" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  PostgreSQL:" -ForegroundColor Yellow
Write-Host "   - Завантажте з https://www.postgresql.org/download/windows/" -ForegroundColor White
Write-Host "   - Під час встановлення встановіть пароль: postgres123" -ForegroundColor White
Write-Host "   - Запам'ятайте порт: 5432" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Redis:" -ForegroundColor Yellow
Write-Host "   - Автоматично завантажено в $redisDir" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Після встановлення всіх компонентів:" -ForegroundColor Cyan
Write-Host "   1. Перезапустіть PowerShell" -ForegroundColor White
Write-Host "   2. Запустіть: .\scripts\setup-database.ps1" -ForegroundColor White
Write-Host "   3. Запустіть: .\scripts\start-local.ps1" -ForegroundColor White
Write-Host ""

# Створення bat файлу для запуску Redis
$redisBatContent = @"
@echo off
echo Starting Redis Server...
cd /d "$redisDir"
redis-server.exe redis.windows.conf
pause
"@

$redisBatContent | Out-File -FilePath "$redisDir\start-redis.bat" -Encoding ASCII -Force

Write-Host "💡 Створено файл для запуску Redis: $redisDir\start-redis.bat" -ForegroundColor Cyan