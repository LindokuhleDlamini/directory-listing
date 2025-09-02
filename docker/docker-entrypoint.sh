#!/bin/sh

set -e

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Substitute environment variables in nginx configuration
log "Configuring Nginx with environment variables..."
envsubst '\$NGINX_PORT \$NGINX_HOST \$API_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Remove the template file
rm /etc/nginx/conf.d/default.conf.template

# Check if SSL certificates exist, generate if not
if [ ! -f /etc/nginx/ssl/nginx.crt ] || [ ! -f /etc/nginx/ssl/nginx.key ]; then
    log "SSL certificates not found, generating self-signed certificates..."
    mkdir -p /etc/nginx/ssl
    /generate-certs.sh
fi

# Test nginx configuration
log "Testing Nginx configuration..."
nginx -t

log "Starting Nginx..."
exec "$@"