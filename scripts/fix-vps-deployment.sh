#!/bin/bash

# ================================================
# VPS Deployment Fix Script
# Fixes product add/edit/delete issues
# ================================================

set -e

echo "🔧 Starting VPS Deployment Fix..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root: sudo bash scripts/fix-vps-deployment.sh${NC}"
    exit 1
fi

# Get domain from user
read -p "Enter your domain (e.g., habibfurniture.com.bd): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domain is required${NC}"
    exit 1
fi

APP_DIR="/var/www/habib-furniture"
APP_PORT=10000

echo ""
echo "📋 Configuration:"
echo "   Domain: $DOMAIN"
echo "   App Directory: $APP_DIR"
echo "   App Port: $APP_PORT"
echo ""

# Step 1: Stop conflicting services
echo "1️⃣ Stopping PM2 processes..."
pm2 stop all || true
pm2 delete all || true

# Step 2: Clean nginx configuration
echo "2️⃣ Cleaning Nginx configuration..."
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/habib-furniture
rm -f /etc/nginx/sites-available/habib-furniture

# Step 3: Create new nginx configuration
echo "3️⃣ Creating Nginx configuration for $DOMAIN..."
cat > /etc/nginx/sites-available/habib-furniture << 'NGINX_CONFIG'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Increase upload size for images
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/habib-furniture-access.log;
    error_log /var/log/nginx/habib-furniture-error.log;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for long operations
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:10000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Public uploads
    location /uploads {
        proxy_pass http://localhost:10000;
        add_header Cache-Control "public, max-age=86400";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_CONFIG

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/habib-furniture

# Enable site
ln -sf /etc/nginx/sites-available/habib-furniture /etc/nginx/sites-enabled/

# Test nginx config
echo "4️⃣ Testing Nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

# Reload nginx
echo "5️⃣ Reloading Nginx..."
systemctl reload nginx

# Step 4: Check if we're in the right directory
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ App directory not found: $APP_DIR${NC}"
    echo "Please ensure the app is installed in $APP_DIR"
    exit 1
fi

cd $APP_DIR

# Step 5: Check required files
echo "6️⃣ Checking required files..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Please edit .env file with your database credentials"
    fi
fi

# Step 6: Configure environment variables
echo "7️⃣ Configuring environment variables..."
source .env 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set in .env${NC}"
    exit 1
fi

# Check and fix AUTH_SECRET
if [ -z "$AUTH_SECRET" ] || [ ${#AUTH_SECRET} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  AUTH_SECRET missing or too short. Generating...${NC}"
    NEW_SECRET=$(openssl rand -hex 32)
    if grep -q "^AUTH_SECRET=" .env; then
        sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=\"$NEW_SECRET\"|" .env
    else
        echo "AUTH_SECRET=\"$NEW_SECRET\"" >> .env
    fi
    echo -e "${GREEN}✅ AUTH_SECRET generated${NC}"
fi

# Set NODE_ENV to production
if ! grep -q "^NODE_ENV=\"production\"" .env; then
    if grep -q "^NODE_ENV=" .env; then
        sed -i 's|^NODE_ENV=.*|NODE_ENV="production"|' .env
    else
        echo 'NODE_ENV="production"' >> .env
    fi
    echo -e "${GREEN}✅ NODE_ENV set to production${NC}"
fi

# Configure NEXT_PUBLIC_APP_URL
if ! grep -q "^NEXT_PUBLIC_APP_URL=" .env; then
    echo "NEXT_PUBLIC_APP_URL=\"http://$DOMAIN\"" >> .env
    echo -e "${GREEN}✅ NEXT_PUBLIC_APP_URL configured${NC}"
else
    sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"http://$DOMAIN\"|" .env
fi

# Configure NEXT_ALLOWED_ORIGINS (critical for server actions)
if ! grep -q "^NEXT_ALLOWED_ORIGINS=" .env; then
    echo "NEXT_ALLOWED_ORIGINS=\"http://$DOMAIN,http://www.$DOMAIN\"" >> .env
    echo -e "${GREEN}✅ NEXT_ALLOWED_ORIGINS configured${NC}"
else
    sed -i "s|^NEXT_ALLOWED_ORIGINS=.*|NEXT_ALLOWED_ORIGINS=\"http://$DOMAIN,http://www.$DOMAIN\"|" .env
fi

# Set PORT
if ! grep -q "^PORT=" .env; then
    echo "PORT=10000" >> .env
fi

# Re-source after modifications
source .env

echo "8️⃣ Checking database connection..."

echo "8️⃣ Checking database connection..."
# Step 7: Check if database is accessible
npx prisma db push --skip-generate 2>&1 | grep -q "error" && {
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Please check your DATABASE_URL in .env"
    exit 1
}

echo -e "${GREEN}✅ Database connection OK${NC}"

# Step 8: Build the application
echo "9️⃣ Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 9: Create logs directory
mkdir -p logs

# Step 10: Start with PM2
echo "🔟 Starting application with PM2..."
pm2 start ecosystem.config.js

# Step 11: Save PM2 configuration
pm2 save

# Step 12: Setup PM2 startup
pm2 startup systemd -u root --hp /root

echo ""
echo -e "${GREEN}✅ Deployment fix completed!${NC}"
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🔍 Testing endpoints:"
echo "   http://$DOMAIN"
echo "   http://$DOMAIN/health"
echo ""
echo "📝 Useful commands:"
echo "   pm2 logs              - View application logs"
echo "   pm2 restart all       - Restart application"
echo "   pm2 monit             - Monitor application"
echo "   nginx -t              - Test nginx config"
echo "   systemctl status nginx - Check nginx status"
echo ""
echo "🧪 Test your site:"
sleep 3
curl -I http://$DOMAIN || echo "Site not responding yet - give it a few seconds"
echo ""
echo "🔑 Next steps:"
echo "1. Test product add/edit/delete at: http://$DOMAIN/admin/products"
echo "2. Check PM2 logs if issues persist: pm2 logs"
echo "3. Setup SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
