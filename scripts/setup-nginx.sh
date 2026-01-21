#!/bin/bash

# ================================================
# Nginx Configuration Script for Ubuntu
# ================================================

if [ -z "$1" ]; then
    echo "Usage: sudo bash scripts/setup-nginx.sh yourdomain.com [app_port]"
    echo "Example: sudo bash scripts/setup-nginx.sh habibfurniture.com 10000"
    exit 1
fi

DOMAIN=$1
APP_PORT=${2:-3000}

# Get current project directory
PROJECT_DIR=$(pwd)

echo "🌐 Configuring Nginx for domain: $DOMAIN (app on :$APP_PORT)"
echo "📂 Project directory: $PROJECT_DIR"

# Create Nginx configuration
cat > /tmp/habib-furniture << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Increase upload size for images
    client_max_body_size 50M;

    # Serve uploaded images directly (bypass Next.js)
    location /uploads/ {
        alias ${PROJECT_DIR}/public/uploads/;
        access_log off;
        expires max;
    }

    # Logging
    access_log /var/log/nginx/habib-furniture-access.log;
    error_log /var/log/nginx/habib-furniture-error.log;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:${APP_PORT};
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Move to sites-available
sudo mv /tmp/habib-furniture /etc/nginx/sites-available/habib-furniture

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Enable site
sudo ln -sf /etc/nginx/sites-available/habib-furniture /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
    echo ""
    echo "🎉 Nginx configured successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Make sure your application is running:"
    echo "   pm2 start npm --name habib-furniture -- start"
    echo ""
    echo "2. Setup SSL certificate:"
    echo "   sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
    echo ""
    echo "3. Test your site:"
    echo "   http://${DOMAIN}"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi
