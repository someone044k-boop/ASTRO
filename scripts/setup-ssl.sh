#!/bin/bash

# SSL Certificate Setup Script for Production
# Онлайн школа навчання - SSL Configuration with Let's Encrypt

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
DOMAIN=${1:-"yourdomain.com"}
EMAIL=${2:-"admin@yourdomain.com"}
SSL_DIR="./ssl"
CERTBOT_DIR="./certbot"

# Check if running as root or with sudo
check_permissions() {
    if [ "$EUID" -ne 0 ] && ! groups | grep -q docker; then
        error "Please run as root or ensure user is in docker group"
    fi
}

# Create necessary directories
create_directories() {
    log "Creating SSL directories..."
    mkdir -p "$SSL_DIR"
    mkdir -p "$CERTBOT_DIR/www"
    mkdir -p "$CERTBOT_DIR/conf"
}

# Generate self-signed certificate for initial setup
generate_self_signed() {
    log "Generating self-signed certificate for initial setup..."
    
    if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
        warn "SSL certificates already exist. Skipping self-signed generation."
        return 0
    fi
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/privkey.pem" \
        -out "$SSL_DIR/fullchain.pem" \
        -subj "/C=UA/ST=Kyiv/L=Kyiv/O=Learning School/CN=$DOMAIN" \
        2>/dev/null
    
    # Create chain.pem (same as fullchain for self-signed)
    cp "$SSL_DIR/fullchain.pem" "$SSL_DIR/chain.pem"
    
    log "Self-signed certificate generated successfully"
}

# Request Let's Encrypt certificate
request_letsencrypt() {
    log "Requesting Let's Encrypt certificate for $DOMAIN..."
    
    # Check if certbot is available
    if ! command -v certbot &> /dev/null; then
        warn "Certbot not found. Using Docker certbot..."
        
        # Use Docker certbot
        docker run -it --rm \
            -v "$SSL_DIR:/etc/letsencrypt" \
            -v "$CERTBOT_DIR/www:/var/www/certbot" \
            certbot/certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN" \
            -d "www.$DOMAIN"
    else
        certbot certonly \
            --webroot \
            --webroot-path="$CERTBOT_DIR/www" \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN" \
            -d "www.$DOMAIN"
    fi
    
    # Copy certificates to SSL directory
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
        cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$SSL_DIR/"
        log "Let's Encrypt certificates installed successfully"
    fi
}

# Setup automatic renewal
setup_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > "$CERTBOT_DIR/renew.sh" << 'EOF'
#!/bin/bash
# Certificate renewal script

DOMAIN="$1"
SSL_DIR="./ssl"

# Renew certificates
docker run --rm \
    -v "$SSL_DIR:/etc/letsencrypt" \
    -v "./certbot/www:/var/www/certbot" \
    certbot/certbot renew --quiet

# Reload nginx if certificates were renewed
if [ $? -eq 0 ]; then
    docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
    echo "$(date): Certificates renewed and nginx reloaded" >> ./logs/ssl-renewal.log
fi
EOF
    
    chmod +x "$CERTBOT_DIR/renew.sh"
    
    # Create cron job for renewal (runs twice daily)
    CRON_JOB="0 0,12 * * * cd $(pwd) && $CERTBOT_DIR/renew.sh $DOMAIN >> ./logs/ssl-renewal.log 2>&1"
    
    # Check if cron job already exists
    if ! crontab -l 2>/dev/null | grep -q "ssl-renewal"; then
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log "Cron job for certificate renewal added"
    else
        warn "Cron job for certificate renewal already exists"
    fi
}

# Verify SSL configuration
verify_ssl() {
    log "Verifying SSL configuration..."
    
    if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
        error "SSL certificates not found in $SSL_DIR"
    fi
    
    # Check certificate validity
    EXPIRY=$(openssl x509 -enddate -noout -in "$SSL_DIR/fullchain.pem" | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ "$DAYS_UNTIL_EXPIRY" -lt 0 ]; then
        error "SSL certificate has expired!"
    elif [ "$DAYS_UNTIL_EXPIRY" -lt 7 ]; then
        warn "SSL certificate expires in $DAYS_UNTIL_EXPIRY days!"
    elif [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
        warn "SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
    else
        log "SSL certificate is valid for $DAYS_UNTIL_EXPIRY days"
    fi
    
    # Verify certificate chain
    if openssl verify -CAfile "$SSL_DIR/chain.pem" "$SSL_DIR/fullchain.pem" > /dev/null 2>&1; then
        log "Certificate chain is valid"
    else
        warn "Certificate chain verification failed (may be self-signed)"
    fi
}

# Generate DH parameters for enhanced security
generate_dhparam() {
    log "Generating DH parameters (this may take a while)..."
    
    if [ -f "$SSL_DIR/dhparam.pem" ]; then
        warn "DH parameters already exist. Skipping generation."
        return 0
    fi
    
    openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048
    log "DH parameters generated successfully"
}

# Main function
main() {
    log "🔐 Starting SSL setup for $DOMAIN"
    
    check_permissions
    create_directories
    
    case "${3:-self-signed}" in
        "self-signed")
            generate_self_signed
            ;;
        "letsencrypt")
            request_letsencrypt
            setup_renewal
            ;;
        "verify")
            verify_ssl
            exit 0
            ;;
        *)
            error "Unknown option: $3. Use 'self-signed', 'letsencrypt', or 'verify'"
            ;;
    esac
    
    generate_dhparam
    verify_ssl
    
    log "🎉 SSL setup completed successfully!"
    log ""
    log "Next steps:"
    log "1. Update nginx/nginx-ssl.conf with your domain: $DOMAIN"
    log "2. Start the production stack: docker-compose -f docker-compose.production.yml up -d"
    log "3. For Let's Encrypt, ensure port 80 is accessible and run:"
    log "   ./scripts/setup-ssl.sh $DOMAIN $EMAIL letsencrypt"
}

# Show usage
usage() {
    echo "Usage: $0 <domain> <email> [self-signed|letsencrypt|verify]"
    echo ""
    echo "Examples:"
    echo "  $0 example.com admin@example.com self-signed"
    echo "  $0 example.com admin@example.com letsencrypt"
    echo "  $0 example.com admin@example.com verify"
}

# Run
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

main "$@"
