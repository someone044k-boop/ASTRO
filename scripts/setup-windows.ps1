# Скрипт для встановлення необхідних компонентів на Windows
# Запускати з правами адміністратора

Write-Host "🚀 Встановлення необхідних компонентів для проекту..." -ForegroundColor Green

# Перевірка чи встановлено Chocolatey
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Встановлення Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Оновлення PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    
    Write-Host "✅ Chocolatey встановлено!" -ForegroundColor Green
} else {
    Write-Host "✅ Chocolatey вже встановлено" -ForegroundColor Green
}

# Встановлення Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Встановлення Node.js..." -ForegroundColor Yellow
    choco install nodejs -y
    Write-Host "✅ Node.js встановлено!" -ForegroundColor Green
} else {
    $nodeVersion = node --version
    Write-Host "✅ Node.js вже встановлено: $nodeVersion" -ForegroundColor Green
}

# Встановлення PostgreSQL
if (!(Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Встановлення PostgreSQL..." -ForegroundColor Yellow
    choco install postgresql -y --params '/Password:postgres123'
    
    # Додавання PostgreSQL до PATH
    $pgPath = "C:\Program Files\PostgreSQL\15\bin"
    if (Test-Path $pgPath) {
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($currentPath -notlike "*$pgPath*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$pgPath", "Machine")
        }
    }
    
    Write-Host "✅ PostgreSQL встановлено!" -ForegroundColor Green
    Write-Host "🔑 Пароль для користувача postgres: postgres123" -ForegroundColor Cyan
} else {
    Write-Host "✅ PostgreSQL вже встановлено" -ForegroundColor Green
}

# Встановлення Redis
if (!(Get-Command redis-server -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Встановлення Redis..." -ForegroundColor Yellow
    
    # Завантаження Redis для Windows
    $redisUrl = "https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.zip"
    $redisZip = "$env:TEMP\redis.zip"
    $redisDir = "C:\Redis"
    
    Invoke-WebRequest -Uri $redisUrl -OutFile $redisZip
    Expand-Archive -Path $redisZip -DestinationPath $redisDir -Force
    
    # Додавання Redis до PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    if ($currentPath -notlike "*$redisDir*") {
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$redisDir", "Machine")
    }
    
    # Створення сервісу Redis
    & "$redisDir\redis-server.exe" --service-install --service-name Redis --port 6379
    & "$redisDir\redis-server.exe" --service-start --service-name Redis
    
    Write-Host "✅ Redis встановлено та запущено як сервіс!" -ForegroundColor Green
} else {
    Write-Host "✅ Redis вже встановлено" -ForegroundColor Green
}

# Встановлення Docker Desktop (опціонально)
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Встановлення Docker Desktop..." -ForegroundColor Yellow
    choco install docker-desktop -y
    Write-Host "✅ Docker Desktop встановлено!" -ForegroundColor Green
    Write-Host "⚠️  Перезапустіть комп'ютер після встановлення Docker" -ForegroundColor Yellow
} else {
    Write-Host "✅ Docker вже встановлено" -ForegroundColor Green
}

# Оновлення PATH для поточної сесії
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

Write-Host ""
Write-Host "🎉 Встановлення завершено!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Встановлені компоненти:" -ForegroundColor Cyan
Write-Host "  ✅ Node.js" -ForegroundColor White
Write-Host "  ✅ PostgreSQL (пароль: postgres123)" -ForegroundColor White
Write-Host "  ✅ Redis" -ForegroundColor White
Write-Host "  ✅ Docker Desktop" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Наступні кроки:" -ForegroundColor Cyan
Write-Host "  1. Перезапустіть PowerShell або Command Prompt" -ForegroundColor White
Write-Host "  2. Запустіть: .\scripts\setup-database.ps1" -ForegroundColor White
Write-Host "  3. Запустіть: .\scripts\start-local.ps1" -ForegroundColor White
Write-Host ""