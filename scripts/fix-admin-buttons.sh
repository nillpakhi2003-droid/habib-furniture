#!/bin/bash

# ================================================
# Fix Admin Buttons (Enable/Edit/Delete) Not Working
# ================================================

set -e

echo "🔧 Fixing Admin Buttons Issue..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root: sudo bash scripts/fix-admin-buttons.sh${NC}"
    exit 1
fi

APP_DIR="/var/www/habib-furniture"

# Go to app directory
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ App directory not found: $APP_DIR${NC}"
    exit 1
fi

cd "$APP_DIR"

echo "1️⃣ Checking .env file..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Source environment
source .env

# Check critical variables
echo "2️⃣ Checking environment variables..."

# Check AUTH_SECRET
if [ -z "$AUTH_SECRET" ] || [ ${#AUTH_SECRET} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  AUTH_SECRET is missing or too short. Generating...${NC}"
    NEW_SECRET=$(openssl rand -hex 32)
    if grep -q "^AUTH_SECRET=" .env; then
        sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=\"$NEW_SECRET\"|" .env
    else
        echo "AUTH_SECRET=\"$NEW_SECRET\"" >> .env
    fi
    echo -e "${GREEN}✅ AUTH_SECRET generated${NC}"
else
    echo -e "${GREEN}✅ AUTH_SECRET is set${NC}"
fi

# Check NODE_ENV
if [ "$NODE_ENV" != "production" ]; then
    echo -e "${YELLOW}⚠️  NODE_ENV is not set to production. Fixing...${NC}"
    if grep -q "^NODE_ENV=" .env; then
        sed -i 's|^NODE_ENV=.*|NODE_ENV="production"|' .env
    else
        echo 'NODE_ENV="production"' >> .env
    fi
    echo -e "${GREEN}✅ NODE_ENV set to production${NC}"
fi

# Re-source after changes
source .env

# Get domain from current .env or ask
DOMAIN="${NEXT_PUBLIC_APP_URL:-}"
if [ -z "$DOMAIN" ]; then
    read -p "Enter your domain (e.g., habibfurniture.com.bd): " INPUT_DOMAIN
    DOMAIN="http://$INPUT_DOMAIN"
fi

# Remove protocol for domain name
DOMAIN_NAME=$(echo "$DOMAIN" | sed 's|https\?://||' | sed 's|/.*||')

echo "3️⃣ Setting up CORS configuration for: $DOMAIN_NAME"

# Update NEXT_PUBLIC_APP_URL
if grep -q "^NEXT_PUBLIC_APP_URL=" .env; then
    sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"http://$DOMAIN_NAME\"|" .env
else
    echo "NEXT_PUBLIC_APP_URL=\"http://$DOMAIN_NAME\"" >> .env
fi

# Update NEXT_ALLOWED_ORIGINS
if grep -q "^NEXT_ALLOWED_ORIGINS=" .env; then
    sed -i "s|^NEXT_ALLOWED_ORIGINS=.*|NEXT_ALLOWED_ORIGINS=\"http://$DOMAIN_NAME,http://www.$DOMAIN_NAME\"|" .env
else
    echo "NEXT_ALLOWED_ORIGINS=\"http://$DOMAIN_NAME,http://www.$DOMAIN_NAME\"" >> .env
fi

echo -e "${GREEN}✅ CORS configured${NC}"

# Ensure PORT is set
if ! grep -q "^PORT=" .env; then
    echo 'PORT=10000' >> .env
    echo -e "${GREEN}✅ PORT set to 10000${NC}"
fi

echo ""
echo "4️⃣ Current .env configuration:"
echo "-----------------------------------"
grep -E "^(DATABASE_URL|AUTH_SECRET|NODE_ENV|PORT|NEXT_PUBLIC_APP_URL|NEXT_ALLOWED_ORIGINS)=" .env || true
echo "-----------------------------------"
echo ""

# Rebuild application
echo "5️⃣ Rebuilding application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Restart PM2
echo "6️⃣ Restarting application..."
pm2 restart habib-furniture

# Wait for restart
sleep 3

# Check PM2 status
echo "7️⃣ Checking application status..."
pm2 status

echo ""
echo -e "${GREEN}✅ Fix completed!${NC}"
echo ""
echo "🧪 Testing endpoints..."
sleep 2

# Test localhost
echo -n "Testing http://localhost:10000: "
if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:10000" | grep -q "200\|302"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test domain
echo -n "Testing http://$DOMAIN_NAME: "
if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://$DOMAIN_NAME" | grep -q "200\|302"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo ""
echo "📝 Next steps:"
echo "1. Clear your browser cache (Ctrl+Shift+Delete)"
echo "2. Logout and login again at: http://$DOMAIN_NAME/admin/logout"
echo "3. Login at: http://$DOMAIN_NAME/admin/login"
echo "4. Test buttons at: http://$DOMAIN_NAME/admin/products"
echo ""
echo "🔍 If still not working, check browser console (F12) for errors"
echo "   Run: pm2 logs habib-furniture"
echo ""
