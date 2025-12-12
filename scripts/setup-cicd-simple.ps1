# Simple PowerShell script for CI/CD setup
param(
    [string]$Environment = "production",
    [string]$Action = "setup"
)

function Write-Log($Message) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Green
}

function Write-Error-Log($Message) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ERROR: $Message" -ForegroundColor Red
}

function Write-Warning-Log($Message) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] WARNING: $Message" -ForegroundColor Yellow
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    try {
        $dockerVersion = docker --version
        Write-Log "Docker installed: $dockerVersion"
    } catch {
        Write-Error-Log "Docker not installed or not available"
        return $false
    }
    
    try {
        $composeVersion = docker-compose --version
        Write-Log "Docker Compose installed: $composeVersion"
    } catch {
        Write-Error-Log "Docker Compose not installed or not available"
        return $false
    }
    
    return $true
}

function New-MonitoringDirectories {
    Write-Log "Creating monitoring directories..."
    
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
            Write-Log "Created: $dir"
        }
    }
}

function Start-Monitoring {
    Write-Log "Starting monitoring system..."
    
    Push-Location "monitoring"
    
    try {
        docker-compose -f docker-compose.monitoring.yml up -d
        Write-Log "Monitoring system started"
        return $true
    } catch {
        Write-Error-Log "Failed to start monitoring services: $_"
        return $false
    } finally {
        Pop-Location
    }
}

function Stop-Monitoring {
    Write-Log "Stopping monitoring system..."
    
    Push-Location "monitoring"
    
    try {
        docker-compose -f docker-compose.monitoring.yml down
        Write-Log "Monitoring system stopped"
    } catch {
        Write-Warning-Log "Failed to stop services: $_"
    } finally {
        Pop-Location
    }
}

function Test-MonitoringStatus {
    Write-Log "Checking monitoring status..."
    
    $services = @(
        @{Name="Prometheus"; Port=9090},
        @{Name="Grafana"; Port=3001},
        @{Name="AlertManager"; Port=9093}
    )
    
    $failedServices = @()
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Log "$($service.Name) is available on port $($service.Port)"
            } else {
                $failedServices += "$($service.Name):$($service.Port)"
            }
        } catch {
            $failedServices += "$($service.Name):$($service.Port)"
        }
    }
    
    if ($failedServices.Count -gt 0) {
        Write-Warning-Log "Unavailable services: $($failedServices -join ', ')"
        return $false
    } else {
        Write-Log "All monitoring services are working"
        return $true
    }
}

function Show-AccessInfo {
    Write-Log "Access information for monitoring:"
    Write-Host ""
    Write-Host "Grafana (Dashboards): http://localhost:3001" -ForegroundColor Cyan
    Write-Host "   Login: admin / Password: admin123"
    Write-Host ""
    Write-Host "Prometheus (Metrics): http://localhost:9090" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "AlertManager (Alerts): http://localhost:9093" -ForegroundColor Cyan
    Write-Host ""
    Write-Warning-Log "Don't forget to change passwords in production!"
}

function Invoke-Setup {
    Write-Log "Setting up CI/CD and automation for $Environment"
    
    if (!(Test-Prerequisites)) {
        Write-Error-Log "Prerequisites not met"
        return
    }
    
    New-MonitoringDirectories
    
    if ($Action -eq "setup" -or $Action -eq "start") {
        if (Start-Monitoring) {
            Write-Log "Waiting for services to start (30 seconds)..."
            Start-Sleep -Seconds 30
            Test-MonitoringStatus
        }
    }
    
    Show-AccessInfo
    
    Write-Log "CI/CD and automation setup completed!"
    Write-Log "Documentation: AUTOMATION.md"
}

# Execute actions
switch ($Action) {
    "setup" { Invoke-Setup }
    "start" { Start-Monitoring }
    "stop" { Stop-Monitoring }
    "status" { Test-MonitoringStatus }
    default { Invoke-Setup }
}