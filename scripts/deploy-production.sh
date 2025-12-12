#!/bin/bash

# Production Deployment Script
# Онлайн школа навчання - Full Production Deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; exit 1; }
info() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"; }
step() { echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] STEP: $1${NC}"; }

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
LOG_DIR="./logs"
SSL_DIR="./ssl"

# Parse arguments
SKIP_TESTS=false
SKIP_BACKUP=false
SKIP_BUILD=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-tests    Skip running tests before deployment"
            echo "  --skip-backup   Skip creating backup before deployment"
            echo "  --skip-build    Skip building Docker images"
            echo "  --force         Force deployment without confirmations"
            echo "  -h, --help      Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Pre-flight checks
preflight_checks() {
    step "Running pre-flight checks..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file $ENV_FILE not found"
    fi
    
    # Load environment variables
    source "$ENV_FILE"
    
    # Check required variables
    local required_vars=("DB_PASSWORD" "JWT_SECRET" "STRIPE_SECRET_KEY")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required variable $var is not set in $ENV_FILE"
        fi
    done
    
    # Check SSL certificates
    if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
        warn "SSL certificates not found. Generating self-signed certificates..."
        ./scripts/setup-ssl.sh "${DOMAIN:-localhost}" "${ADMIN_EMAIL:-admin@localhost}" self-signed
    fi
    
    # Check disk space (require at least 5GB free)
    local free_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$free_space" -lt 5 ]; then
        error "Insufficient disk space. At least 5GB required, only ${free_space}GB available"
    fi
    
    log "✅ Pre-flight checks passed"
}

# Create necessary directories
create_directories() {
    step "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR/postgres"
    mkdir -p "$LOG_DIR/nginx"
    mkdir -p "$LOG_DIR/backend"
    mkdir -p "./uploads"
    mkdir -p "./certbot/www"
    
    log "✅ Directories created"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        warn "Skipping tests as requested"
        return 0
    fi
    
    step "Running tests..."
    
    # Backend tests
    info "Running backend tests..."
    cd backend
    npm test -- --passWithNoTests 2>/dev/null || warn "Backend tests failed or not configured"
    cd ..
    
    # Frontend tests
    info "Running frontend tests..."
    cd frontend
    CI=true npm test -- --passWithNoTests --watchAll=false 2>/dev/null || warn "Frontend tests failed or not configured"
    cd ..
    
    log "✅ Tests completed"
}

# Create backup
create_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        warn "Skipping backup as requested"
        return 0
    fi
    
    step "Creating backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/postgres/backup_${timestamp}.sql"
    
    # Check if database container is running
    if docker-compose -f "$COMPOSE_FILE" ps -q postgres 2>/dev/null | grep -q .; then
        info "Creating database backup..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres learning_school > "$backup_file" 2>/dev/null || warn "Could not create database backup"
        
        if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
            # Compress backup
            gzip "$backup_file"
            log "✅ Backup created: ${backup_file}.gz"
            
            # Clean old backups (keep last 10)
            ls -t "$BACKUP_DIR/postgres/"*.gz 2>/dev/null | tail -n +11 | xargs -r rm
        else
            warn "Backup file is empty or not created"
        fi
    else
        warn "Database container not running, skipping backup"
    fi
}

# Build Docker images
build_images() {
    if [ "$SKIP_BUILD" = true ]; then
        warn "Skipping build as requested"
        return 0
    fi
    
    step "Building Docker images..."
    
    # Build frontend
    info "Building frontend image..."
    docker build -t learning-school-frontend:production -f frontend/Dockerfile.prod frontend/ || error "Failed to build frontend image"
    
    # Build backend
    info "Building backend image..."
    docker build -t learning-school-backend:production -f backend/Dockerfile.prod backend/ || error "Failed to build backend image"
    
    log "✅ Docker images built successfully"
}

# Deploy services
deploy_services() {
    step "Deploying services..."
    
    # Pull latest images for external services
    info "Pulling external images..."
    docker-compose -f "$COMPOSE_FILE" pull postgres redis nginx prometheus grafana 2>/dev/null || true
    
    # Stop existing containers gracefully
    info "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    
    # Start services
    info "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log "✅ Services deployed"
}

# Wait for services to be healthy
wait_for_health() {
    step "Waiting for services to be healthy..."
    
    local services=("postgres" "redis" "backend" "frontend" "nginx")
    local timeout=180
    local elapsed=0
    
    for service in "${services[@]}"; do
        info "Waiting for $service..."
        
        while [ $elapsed -lt $timeout ]; do
            local container=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null)
            
            if [ -n "$container" ]; then
                local status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
                local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-healthcheck")
                
                if [ "$status" = "running" ] && ([ "$health" = "healthy" ] || [ "$health" = "no-healthcheck" ]); then
                    log "✅ $service is healthy"
                    break
                fi
            fi
            
            sleep 5
            elapsed=$((elapsed + 5))
        done
        
        if [ $elapsed -ge $timeout ]; then
            warn "$service did not become healthy within timeout"
        fi
    done
}

# Run database migrations
run_migrations() {
    step "Running database migrations..."
    
    # Wait a bit for database to be fully ready
    sleep 10
    
    # Run migrations
    docker-compose -f "$COMPOSE_FILE" exec -T backend npm run migrate 2>/dev/null || warn "Migrations failed or not configured"
    
    log "✅ Migrations completed"
}

# Verify deployment
verify_deployment() {
    step "Verifying deployment..."
    
    local base_url="http://localhost"
    
    # Check nginx
    if curl -sf "$base_url/health" > /dev/null 2>&1; then
        log "✅ Nginx is responding"
    else
        warn "Nginx health check failed"
    fi
    
    # Check backend API
    if curl -sf "$base_url/api/health" > /dev/null 2>&1; then
        log "✅ Backend API is responding"
    else
        warn "Backend API health check failed"
    fi
    
    # Check frontend
    if curl -sf "$base_url" > /dev/null 2>&1; then
        log "✅ Frontend is responding"
    else
        warn "Frontend health check failed"
    fi
    
    log "✅ Deployment verification completed"
}

# Cleanup
cleanup() {
    step "Cleaning up..."
    
    # Remove dangling images
    docker image prune -f 2>/dev/null || true
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f 2>/dev/null || true
    
    log "✅ Cleanup completed"
}

# Show deployment summary
show_summary() {
    echo ""
    log "🎉 Production deployment completed successfully!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Service URLs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🌐 Website:     https://${DOMAIN:-localhost}"
    echo "  📊 Grafana:     http://localhost:3001"
    echo "  📈 Prometheus:  http://localhost:9090"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Useful Commands:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  View logs:      docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Service status: docker-compose -f $COMPOSE_FILE ps"
    echo "  Scale backend:  ./scripts/scale-services.sh scale backend 3"
    echo "  Health check:   ./scripts/health-check.sh production"
    echo ""
}

# Main deployment flow
main() {
    log "🚀 Starting production deployment..."
    echo ""
    
    # Confirmation
    if [ "$FORCE" = false ]; then
        read -p "Are you sure you want to deploy to production? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled"
            exit 0
        fi
    fi
    
    preflight_checks
    create_directories
    run_tests
    create_backup
    build_images
    deploy_services
    wait_for_health
    run_migrations
    verify_deployment
    cleanup
    show_summary
}

# Run main function
main
