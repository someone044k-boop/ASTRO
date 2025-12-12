# Швидке встановлення через Chocolatey (потрібні права адміністратора)

Write-Host "⚡ Швидке встановлення компонентів..." -ForegroundColor Green

# Перевірка прав адміністратора
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Потрібні права адміністратора!" -ForegroundColor Red
    Write-Host "Запустіть PowerShell як адміністратор та повторіть команду" -ForegroundColor Yellow
    pause
    exit 1
}

# Встановлення Chocolatey якщо не встановлено
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Встановлення Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

Write-Host "📦 Встановлення пакетів..." -ForegroundColor Yellow

# Встановлення всіх необхідних пакетів одразу
choco install nodejs postgresql redis-64 git -y

Write-Host "🔧 Налаштування PostgreSQL..." -ForegroundColor Yellow

# Запуск PostgreSQL сервісу
Start-Service postgresql*

# Встановлення пароля для postgres
$env:PGPASSWORD = "postgres123"

Write-Host ""
Write-Host "✅ Встановлення завершено!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Наступні кроки:" -ForegroundColor Cyan
Write-Host "  1. Перезапустіть PowerShell" -ForegroundColor White
Write-Host "  2. Запустіть: .\scripts\setup-database.ps1" -ForegroundColor White
Write-Host "  3. Запустіть: .\scripts\start-local.ps1" -ForegroundColor White
Write-Host ""

pause