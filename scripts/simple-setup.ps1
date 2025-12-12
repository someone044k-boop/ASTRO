# Простий скрипт встановлення

Write-Host "🚀 Простий скрипт встановлення компонентів" -ForegroundColor Green
Write-Host ""

# Перевірка Node.js
Write-Host "🔍 Перевірка Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js встановлено: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js не знайдено"
    }
} catch {
    Write-Host "❌ Node.js не встановлено" -ForegroundColor Red
    Write-Host "📥 Завантажте з: https://nodejs.org/" -ForegroundColor Cyan
    Start-Process "https://nodejs.org/en/download/"
    Write-Host "Після встановлення перезапустіть PowerShell та повторіть" -ForegroundColor Yellow
    exit 1
}

# Перевірка PostgreSQL
Write-Host "🔍 Перевірка PostgreSQL..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL встановлено: $pgVersion" -ForegroundColor Green
    } else {
        throw "PostgreSQL не знайдено"
    }
} catch {
    Write-Host "❌ PostgreSQL не встановлено" -ForegroundColor Red
    Write-Host "📥 Завантажте з: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "⚠️  Під час встановлення встановіть пароль: postgres123" -ForegroundColor Yellow
    Start-Process "https://www.postgresql.org/download/windows/"
    Write-Host "Після встановлення перезапустіть PowerShell та повторіть" -ForegroundColor Yellow
    exit 1
}

# Встановлення Redis
Write-Host "🔍 Перевірка Redis..." -ForegroundColor Yellow
$redisDir = "$env:USERPROFILE\Redis"

if (!(Test-Path "$redisDir\redis-server.exe")) {
    Write-Host "📦 Завантаження Redis..." -ForegroundColor Yellow
    
    try {
        New-Item -ItemType Directory -Path $redisDir -Force | Out-Null
        
        $redisUrl = "https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.zip"
        $redisZip = "$env:TEMP\redis.zip"
        
        Invoke-WebRequest -Uri $redisUrl -OutFile $redisZip -UseBasicParsing
        Expand-Archive -Path $redisZip -DestinationPath $redisDir -Force
        
        # Додавання до PATH
        $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($userPath -notlike "*$redisDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$userPath;$redisDir", "User")
            $env:PATH += ";$redisDir"
        }
        
        Write-Host "✅ Redis встановлено в: $redisDir" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Помилка завантаження Redis: $_" -ForegroundColor Red
        Write-Host "📥 Завантажте вручну з: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "✅ Redis вже встановлено" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Всі компоненти встановлено!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Наступні кроки:" -ForegroundColor Cyan
Write-Host "  1. .\scripts\setup-database.ps1" -ForegroundColor White
Write-Host "  2. .\scripts\start-local.ps1" -ForegroundColor White
Write-Host ""