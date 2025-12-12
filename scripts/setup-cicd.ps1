# PowerShell скрипт для налаштування CI/CD та автоматизації
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("setup", "start", "stop", "status")]
    [string]$Action = "setup"
)

# Кольори для виводу
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Log($Message) {
    Write-ColorOutput Green "[$(Get-Date -Format 'HH:mm:ss')] $Message"
}

function Write-Error-Log($Message) {
    Write-ColorOutput Red "[$(Get-Date -Format 'HH:mm:ss')] ERROR: $Message"
}

function Write-Warning-Log($Message) {
    Write-ColorOutput Yellow "[$(Get-Date -Format 'HH:mm:ss')] WARNING: $Message"
}

function Write-Info-Log($Message) {
    Write-ColorOutput Blue "[$(Get-Date -Format 'HH:mm:ss')] INFO: $Message"
}

# Функція для перевірки передумов
function Test-Prerequisites {
    Write-Log "🔍 Перевірка передумов..."
    
    # Перевірка Docker
    try {
        $dockerVersion = docker --version
        Write-Log "✅ Docker встановлено: $dockerVersion"
    } catch {
        Write-Error-Log "Docker не встановлено або недоступний"
        return $false
    }
    
    # Перевірка Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Log "✅ Docker Compose встановлено: $composeVersion"
    } catch {
        Write-Error-Log "Docker Compose не встановлено або недоступний"
        return $false
    }
    
    # Перевірка Git
    try {
        $gitVersion = git --version
        Write-Log "✅ Git встановлено: $gitVersion"
    } catch {
        Write-Error-Log "Git не встановлено або недоступний"
        return $false
    }
    
    # Перевірка Node.js
    try {
        $nodeVersion = node --version
        Write-Log "✅ Node.js встановлено: $nodeVersion"
    } catch {
        Write-Warning-Log "Node.js не встановлено (потрібно для локальних тестів)"
    }
    
    return $true
}

# Функція для створення директорій
function New-MonitoringDirectories {
    Write-Log "📁 Створення директорій для моніторингу..."
    
    $directories = @(
        "monitoring\grafana\provisioning\datasources",
        "monitoring\grafana\provisioning\dashboards", 
        "monitoring\grafana\dashboards",
        "monitoring\data\prometheus",
        "monitoring\data\grafana",
        "monitoring\data\alertmanager",
        "monitoring\data\loki",
        "backups",
        "logs"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Log "Створено: $dir"
        }
    }
}

# Функція для створення .env файлів
function New-EnvironmentFiles {
    Write-Log "⚙️ Створення .env файлів..."
    
    # .env для моніторингу
    $monitoringEnv = @"
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
"@
    
    $monitoringEnvPath = "monitoring\.env"
    if (!(Test-Path $monitoringEnvPath)) {
        $monitoringEnv | Out-File -FilePath $monitoringEnvPath -Encoding UTF8
        Write-Log "Створено: $monitoringEnvPath"
    }
    
    # .env для середовища
    $envTemplate = @"
NODE_ENV=$Environment
DB_HOST=localhost
DB_PORT=5432
DB_NAME=learning_school
DB_USER=postgres
DB_PASSWORD=your_secure_password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# URLs
PRODUCTION_URL=https://yourdomain.com
STAGING_URL=https://staging.yourdomain.com

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
ALERT_EMAIL=admin@yourdomain.com

# Backup
S3_BACKUP_BUCKET=learning-school-backups
BACKUP_EMAIL=backup@yourdomain.com
"@
    
    $envPath = ".env.$Environment"
    if (!(Test-Path $envPath)) {
        $envTemplate | Out-File -FilePath $envPath -Encoding UTF8
        Write-Log "Створено: $envPath"
        Write-Warning-Log "Не забудьте оновити змінні в $envPath"
    }
}

# Функція для запуску моніторингу
function Start-Monitoring {
    Write-Log "🚀 Запуск системи моніторингу..."
    
    Push-Location "monitoring"
    
    try {
        # Запуск сервісів моніторингу
        docker-compose -f docker-compose.monitoring.yml up -d
        Write-Log "✅ Система моніторингу запущена"
    } catch {
        Write-Error-Log "Не вдалося запустити сервіси моніторингу: $_"
        return $false
    } finally {
        Pop-Location
    }
    
    return $true
}

# Функція для зупинки моніторингу
function Stop-Monitoring {
    Write-Log "🛑 Зупинка системи моніторингу..."
    
    Push-Location "monitoring"
    
    try {
        docker-compose -f docker-compose.monitoring.yml down
        Write-Log "✅ Система моніторингу зупинена"
    } catch {
        Write-Warning-Log "Не вдалося зупинити сервіси: $_"
    } finally {
        Pop-Location
    }
}

# Функція для перевірки статусу
function Test-MonitoringStatus {
    Write-Log "🔍 Перевірка статусу моніторингу..."
    
    $services = @(
        @{Name="Prometheus"; Port=9090},
        @{Name="Grafana"; Port=3001},
        @{Name="AlertManager"; Port=9093},
        @{Name="Node Exporter"; Port=9100},
        @{Name="cAdvisor"; Port=8080}
    )
    
    $failedServices = @()
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Log "✅ $($service.Name) доступний на порту $($service.Port)"
            } else {
                $failedServices += "$($service.Name):$($service.Port)"
            }
        } catch {
            $failedServices += "$($service.Name):$($service.Port)"
        }
    }
    
    if ($failedServices.Count -gt 0) {
        Write-Warning-Log "Недоступні сервіси: $($failedServices -join ', ')"
        return $false
    } else {
        Write-Log "🎉 Всі сервіси моніторингу працюють"
        return $true
    }
}

# Функція для створення Windows Task Scheduler завдань
function New-ScheduledTasks {
    Write-Log "⏰ Налаштування заплановanych завдань..."
    
    # Backup завдання (щодня о 2:00)
    $backupAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$(Get-Location)\scripts\auto-backup.ps1`" -Environment $Environment"
    $backupTrigger = New-ScheduledTaskTrigger -Daily -At "02:00"
    $backupSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    
    try {
        Register-ScheduledTask -TaskName "LearningSchool-AutoBackup" -Action $backupAction -Trigger $backupTrigger -Settings $backupSettings -Force
        Write-Log "✅ Backup завдання створено"
    } catch {
        Write-Warning-Log "Не вдалося створити backup завдання: $_"
    }
    
    # Health check завдання (кожні 5 хвилин)
    $healthAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$(Get-Location)\scripts\health-check.ps1`" -Environment $Environment"
    $healthTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
    
    try {
        Register-ScheduledTask -TaskName "LearningSchool-HealthCheck" -Action $healthAction -Trigger $healthTrigger -Settings $backupSettings -Force
        Write-Log "✅ Health check завдання створено"
    } catch {
        Write-Warning-Log "Не вдалося створити health check завдання: $_"
    }
}

# Функція для показу інформації про доступ
function Show-AccessInfo {
    Write-Log "🌐 Інформація про доступ до моніторингу:"
    Write-Host ""
    Write-ColorOutput Cyan "📊 Grafana (Dashboards): http://localhost:3001"
    Write-Host "   Логін: admin / Пароль: admin123"
    Write-Host ""
    Write-ColorOutput Cyan "🔍 Prometheus (Metrics): http://localhost:9090"
    Write-Host ""
    Write-ColorOutput Cyan "🚨 AlertManager (Alerts): http://localhost:9093"
    Write-Host ""
    Write-ColorOutput Cyan "📈 Node Exporter (System): http://localhost:9100"
    Write-Host ""
    Write-ColorOutput Cyan "🐳 cAdvisor (Containers): http://localhost:8080"
    Write-Host ""
    Write-Warning-Log "Не забудьте змінити паролі в production!"
}

# Функція для створення PowerShell версій bash скриптів
function New-PowerShellScripts {
    Write-Log "📝 Створення PowerShell скриптів..."
    
    # Health check скрипт
    $healthCheckScript = @'
param(
    [string]$Environment = "production",
    [string]$CheckType = "comprehensive"
)

function Test-ServiceHealth($ServiceName, $Port) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 10 -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Test-DockerContainer($ServiceName) {
    try {
        $status = docker inspect --format='{{.State.Status}}' $ServiceName 2>$null
        return $status -eq "running"
    } catch {
        return $false
    }
}

Write-Host "🏥 Перевірка здоров'я системи ($Environment)" -ForegroundColor Green

$services = @(
    @{Name="postgres"; Port=5432},
    @{Name="redis"; Port=6379},
    @{Name="backend"; Port=4000},
    @{Name="frontend"; Port=3000}
)

$failedServices = @()

foreach ($service in $services) {
    if (Test-ServiceHealth $service.Name $service.Port) {
        Write-Host "✅ $($service.Name) здоровий" -ForegroundColor Green
    } else {
        $failedServices += $service.Name
        Write-Host "❌ $($service.Name) недоступний" -ForegroundColor Red
    }
}

if ($failedServices.Count -eq 0) {
    Write-Host "🎉 Всі сервіси працюють" -ForegroundColor Green
    exit 0
} else {
    Write-Host "🚨 Проблеми з сервісами: $($failedServices -join ', ')" -ForegroundColor Red
    exit 1
}
'@
    
    $healthCheckScript | Out-File -FilePath "scripts\health-check.ps1" -Encoding UTF8
    
    # Auto backup скрипт
    $autoBackupScript = @'
param(
    [string]$Environment = "production"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups"
$backupFile = "$backupDir\db_backup_${Environment}_${timestamp}.sql"

Write-Host "🗄️ Створення backup'у бази даних..." -ForegroundColor Green

if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

try {
    # Створення backup'у PostgreSQL
    docker exec postgres pg_dump -U postgres learning_school > $backupFile
    
    # Стиснення backup'у
    Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip" -Force
    Remove-Item $backupFile
    
    Write-Host "✅ Backup створено: $backupFile.zip" -ForegroundColor Green
    
    # Очищення старих backup'ів (старших за 7 днів)
    Get-ChildItem $backupDir -Filter "*.zip" | Where-Object {$_.CreationTime -lt (Get-Date).AddDays(-7)} | Remove-Item -Force
    
} catch {
    Write-Host "❌ Помилка створення backup'у: $_" -ForegroundColor Red
    exit 1
}
'@
    
    $autoBackupScript | Out-File -FilePath "scripts\auto-backup.ps1" -Encoding UTF8
    
    Write-Log "✅ PowerShell скрипти створено"
}

# Головна функція
function Invoke-Setup {
    Write-Log "🚀 Налаштування CI/CD та автоматизації для $Environment"
    
    if (!(Test-Prerequisites)) {
        Write-Error-Log "Передумови не виконано"
        return
    }
    
    New-MonitoringDirectories
    New-EnvironmentFiles
    New-PowerShellScripts
    
    if ($Action -eq "setup" -or $Action -eq "start") {
        if (Start-Monitoring) {
            Write-Info-Log "Очікування запуску сервісів (30 секунд)..."
            Start-Sleep -Seconds 30
            Test-MonitoringStatus
        }
    }
    
    New-ScheduledTasks
    Show-AccessInfo
    
    Write-Log "🎉 CI/CD та автоматизація налаштовані!"
    Write-Log "📚 Документація: DEPLOYMENT.md"
}

# Виконання дій
switch ($Action) {
    "setup" { Invoke-Setup }
    "start" { Start-Monitoring }
    "stop" { Stop-Monitoring }
    "status" { Test-MonitoringStatus }
    default { Invoke-Setup }
}