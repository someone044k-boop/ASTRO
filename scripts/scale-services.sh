#!/bin/bash

# Horizontal Scaling Script for Production
# Онлайн школа навчання - Service Scaling Management

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; exit 1; }
info() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"; }

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
MIN_BACKEND_REPLICAS=1
MAX_BACKEND_REPLICAS=10
MIN_FRONTEND_REPLICAS=1
MAX_FRONTEND_REPLICAS=5

# Get current replica count
get_replicas() {
    local service=$1
    docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null | wc -l
}

# Scale a service
scale_service() {
    local service=$1
    local replicas=$2
    
    log "Scaling $service to $replicas replicas..."
    docker-compose -f "$COMPOSE_FILE" up -d --scale "$service=$replicas" --no-recreate
    
    # Wait for containers to be healthy
    local timeout=120
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        local healthy=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" | xargs -I {} docker inspect --format='{{.State.Health.Status}}' {} 2>/dev/null | grep -c "healthy" || echo "0")
        if [ "$healthy" -eq "$replicas" ]; then
            log "✅ $service scaled to $replicas replicas successfully"
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        info "Waiting for $service to be healthy... ($elapsed/$timeout seconds)"
    done
    
    warn "Timeout waiting for $service to be healthy"
    return 1
}

# Scale backend service
scale_backend() {
    local replicas=$1
    
    if [ "$replicas" -lt "$MIN_BACKEND_REPLICAS" ]; then
        error "Cannot scale backend below $MIN_BACKEND_REPLICAS replicas"
    fi
    
    if [ "$replicas" -gt "$MAX_BACKEND_REPLICAS" ]; then
        error "Cannot scale backend above $MAX_BACKEND_REPLICAS replicas"
    fi
    
    scale_service "backend" "$replicas"
}

# Scale frontend service
scale_frontend() {
    local replicas=$1
    
    if [ "$replicas" -lt "$MIN_FRONTEND_REPLICAS" ]; then
        error "Cannot scale frontend below $MIN_FRONTEND_REPLICAS replicas"
    fi
    
    if [ "$replicas" -gt "$MAX_FRONTEND_REPLICAS" ]; then
        error "Cannot scale frontend above $MAX_FRONTEND_REPLICAS replicas"
    fi
    
    scale_service "frontend" "$replicas"
}

# Auto-scale based on CPU usage
auto_scale() {
    local service=$1
    local cpu_threshold_up=${2:-70}
    local cpu_threshold_down=${3:-30}
    
    log "Auto-scaling $service (up: ${cpu_threshold_up}%, down: ${cpu_threshold_down}%)"
    
    # Get current CPU usage
    local containers=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service")
    local total_cpu=0
    local count=0
    
    for container in $containers; do
        local cpu=$(docker stats --no-stream --format "{{.CPUPerc}}" "$container" | sed 's/%//')
        total_cpu=$(echo "$total_cpu + $cpu" | bc)
        count=$((count + 1))
    done
    
    if [ $count -eq 0 ]; then
        error "No containers found for $service"
    fi
    
    local avg_cpu=$(echo "scale=2; $total_cpu / $count" | bc)
    local current_replicas=$(get_replicas "$service")
    
    info "Current $service: $current_replicas replicas, avg CPU: ${avg_cpu}%"
    
    # Determine scaling action
    if (( $(echo "$avg_cpu > $cpu_threshold_up" | bc -l) )); then
        local new_replicas=$((current_replicas + 1))
        log "CPU above threshold, scaling up to $new_replicas replicas"
        
        if [ "$service" = "backend" ]; then
            scale_backend "$new_replicas"
        else
            scale_frontend "$new_replicas"
        fi
    elif (( $(echo "$avg_cpu < $cpu_threshold_down" | bc -l) )) && [ "$current_replicas" -gt 1 ]; then
        local new_replicas=$((current_replicas - 1))
        log "CPU below threshold, scaling down to $new_replicas replicas"
        
        if [ "$service" = "backend" ]; then
            scale_backend "$new_replicas"
        else
            scale_frontend "$new_replicas"
        fi
    else
        info "No scaling action needed"
    fi
}

# Show current status
show_status() {
    log "📊 Current Service Status"
    echo ""
    
    echo "Service          Replicas    Status"
    echo "----------------------------------------"
    
    for service in backend frontend; do
        local replicas=$(get_replicas "$service")
        local status="Running"
        
        # Check health
        local containers=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null)
        local healthy=0
        local unhealthy=0
        
        for container in $containers; do
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
            if [ "$health" = "healthy" ]; then
                healthy=$((healthy + 1))
            else
                unhealthy=$((unhealthy + 1))
            fi
        done
        
        if [ $unhealthy -gt 0 ]; then
            status="Degraded ($healthy healthy, $unhealthy unhealthy)"
        fi
        
        printf "%-16s %-11s %s\n" "$service" "$replicas" "$status"
    done
    
    echo ""
    
    # Show resource usage
    log "📈 Resource Usage"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
        $(docker-compose -f "$COMPOSE_FILE" ps -q backend frontend 2>/dev/null) 2>/dev/null || true
}

# Rolling update
rolling_update() {
    local service=$1
    
    log "🔄 Performing rolling update for $service"
    
    local current_replicas=$(get_replicas "$service")
    
    # Scale up by 1
    log "Scaling up to $((current_replicas + 1)) replicas..."
    docker-compose -f "$COMPOSE_FILE" up -d --scale "$service=$((current_replicas + 1))" --no-recreate
    
    # Wait for new container to be healthy
    sleep 30
    
    # Get old containers
    local old_containers=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" | head -n "$current_replicas")
    
    # Remove old containers one by one
    for container in $old_containers; do
        log "Removing old container: $container"
        docker stop "$container" --time 30
        docker rm "$container"
        sleep 10
    done
    
    log "✅ Rolling update completed for $service"
}

# Main function
main() {
    local action=${1:-status}
    local service=${2:-}
    local replicas=${3:-}
    
    case "$action" in
        "scale")
            if [ -z "$service" ] || [ -z "$replicas" ]; then
                error "Usage: $0 scale <service> <replicas>"
            fi
            
            case "$service" in
                "backend")
                    scale_backend "$replicas"
                    ;;
                "frontend")
                    scale_frontend "$replicas"
                    ;;
                *)
                    error "Unknown service: $service. Use 'backend' or 'frontend'"
                    ;;
            esac
            ;;
        "auto")
            if [ -z "$service" ]; then
                error "Usage: $0 auto <service> [cpu_up_threshold] [cpu_down_threshold]"
            fi
            auto_scale "$service" "${3:-70}" "${4:-30}"
            ;;
        "status")
            show_status
            ;;
        "update")
            if [ -z "$service" ]; then
                error "Usage: $0 update <service>"
            fi
            rolling_update "$service"
            ;;
        *)
            echo "Usage: $0 <action> [options]"
            echo ""
            echo "Actions:"
            echo "  status                    Show current service status"
            echo "  scale <service> <n>       Scale service to n replicas"
            echo "  auto <service> [up] [dn]  Auto-scale based on CPU (default: up=70%, down=30%)"
            echo "  update <service>          Perform rolling update"
            echo ""
            echo "Services: backend, frontend"
            echo ""
            echo "Examples:"
            echo "  $0 status"
            echo "  $0 scale backend 3"
            echo "  $0 auto backend 80 20"
            echo "  $0 update frontend"
            exit 1
            ;;
    esac
}

main "$@"
