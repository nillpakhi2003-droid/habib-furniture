#!/bin/bash

# ================================================
# VPS Deployment Diagnostics
# Checks all critical components
# ================================================

echo "🔍 Running VPS Deployment Diagnostics..."
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# 1. Check if we're root
echo -n "1. Running as root/sudo: "
if [ "$EUID" -eq 0 ]; then
    echo -e "${GREEN}✅ Yes${NC}"
else
    echo -e "${YELLOW}⚠️  No (some checks may be limited)${NC}"
fi
echo ""

# 2. Check application directory
echo -n "2. Application directory exists: "
if [ -d "/var/www/habib-furniture" ]; then
    echo -e "${GREEN}✅ Yes${NC}"
    APP_DIR="/var/www/habib-furniture"
else
    echo -e "${RED}❌ No${NC}"
    echo "   Expected: /var/www/habib-furniture"
    APP_DIR="."
fi
echo ""

# 3. Check Node.js
echo -n "3. Node.js installed: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Not found${NC}"
fi
echo ""

# 4. Check PM2
echo -n "4. PM2 installed: "
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}✅ $PM2_VERSION${NC}"
else
    echo -e "${RED}❌ Not found${NC}"
fi
echo ""

# 5. Check Nginx
echo -n "5. Nginx installed: "
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    echo -e "${GREEN}✅ $NGINX_VERSION${NC}"
else
    echo -e "${RED}❌ Not found${NC}"
fi
echo ""

# 6. Check PostgreSQL
echo -n "6. PostgreSQL client installed: "
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✅ $PSQL_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Not found locally${NC}"
fi
echo ""

# 7. Check .env file
echo -n "7. .env file exists: "
if [ -f "$APP_DIR/.env" ]; then
    echo -e "${GREEN}✅ Yes${NC}"
    
    # Check critical env vars
    cd "$APP_DIR"
    source .env 2>/dev/null
    
    echo -n "   - DATABASE_URL set: "
    [ -n "$DATABASE_URL" ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"
    
    echo -n "   - AUTH_SECRET set: "
    if [ -n "$AUTH_SECRET" ] && [ ${#AUTH_SECRET} -ge 32 ]; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌ (must be >= 32 chars)${NC}"
    fi
    
    echo -n "   - ADMIN_PHONE set: "
    [ -n "$ADMIN_PHONE" ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"
    
    echo -n "   - ADMIN_PASSWORD set: "
    [ -n "$ADMIN_PASSWORD" ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"
    
    echo -n "   - PORT set: "
    if [ -n "$PORT" ]; then
        echo -e "${GREEN}✅ ($PORT)${NC}"
    else
        echo -e "${YELLOW}⚠️  (defaults to 3000)${NC}"
    fi
    
    echo -n "   - NEXT_PUBLIC_APP_URL set: "
    [ -n "$NEXT_PUBLIC_APP_URL" ] && echo -e "${GREEN}✅${NC}" || echo -e "${YELLOW}⚠️${NC}"
else
    echo -e "${RED}❌ No${NC}"
fi
echo ""

# 8. Check built application
echo -n "8. Application built (.next folder): "
if [ -d "$APP_DIR/.next" ]; then
    echo -e "${GREEN}✅ Yes${NC}"
else
    echo -e "${RED}❌ No - run 'npm run build'${NC}"
fi
echo ""

# 9. Check PM2 processes
echo "9. PM2 Processes:"
if command -v pm2 &> /dev/null; then
    pm2 list
    echo ""
    
    # Check if habib-furniture is running
    if pm2 list | grep -q "habib-furniture"; then
        echo -e "   ${GREEN}✅ habib-furniture process found${NC}"
        
        # Check process status
        STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="habib-furniture") | .pm2_env.status' 2>/dev/null)
        if [ "$STATUS" = "online" ]; then
            echo -e "   ${GREEN}✅ Status: online${NC}"
        else
            echo -e "   ${RED}❌ Status: $STATUS${NC}"
        fi
    else
        echo -e "   ${RED}❌ habib-furniture process not found${NC}"
    fi
else
    echo -e "   ${RED}❌ PM2 not installed${NC}"
fi
echo ""

# 10. Check Nginx configuration
echo "10. Nginx Configuration:"
if [ -f "/etc/nginx/sites-available/habib-furniture" ]; then
    echo -e "    ${GREEN}✅ Config file exists${NC}"
    
    echo -n "    - Enabled: "
    if [ -L "/etc/nginx/sites-enabled/habib-furniture" ]; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
    
    echo -n "    - Config test: "
    sudo nginx -t 2>&1 | grep -q "successful" && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"
else
    echo -e "    ${RED}❌ Config file missing${NC}"
fi
echo ""

# 11. Check Nginx status
echo -n "11. Nginx service status: "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi
echo ""

# 12. Check ports
echo "12. Port Usage:"
for port in 80 443 3000 10000; do
    echo -n "    Port $port: "
    if command -v lsof &> /dev/null; then
        if lsof -i :$port &> /dev/null; then
            PROCESS=$(lsof -i :$port | tail -n1 | awk '{print $1}')
            echo -e "${GREEN}✅ In use by $PROCESS${NC}"
        else
            echo -e "${YELLOW}⚠️  Not in use${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  lsof not available${NC}"
    fi
done
echo ""

# 13. Test local endpoints
echo "13. Testing Local Endpoints:"
for endpoint in "http://localhost:10000" "http://localhost:10000/health" "http://localhost:3000"; do
    echo -n "    $endpoint: "
    if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$endpoint" 2>/dev/null | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ Responding${NC}"
    else
        echo -e "${RED}❌ Not responding${NC}"
    fi
done
echo ""

# 14. Check database connection
echo -n "14. Database connection: "
if [ -f "$APP_DIR/.env" ]; then
    cd "$APP_DIR"
    if npx prisma db execute --stdin <<< "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ Connected${NC}"
    else
        echo -e "${RED}❌ Cannot connect${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot test (no .env)${NC}"
fi
echo ""

# 15. Check logs
echo "15. Recent Application Logs:"
if [ -f "$APP_DIR/logs/pm2-error.log" ]; then
    echo -e "${BLUE}Last 10 error lines:${NC}"
    tail -n 10 "$APP_DIR/logs/pm2-error.log"
else
    echo -e "${YELLOW}⚠️  No error logs found${NC}"
fi
echo ""

# Summary
echo "========================================"
echo "📊 DIAGNOSIS COMPLETE"
echo "========================================"
echo ""
echo "💡 Recommendations:"
echo ""

# Check if app is running
if ! pm2 list 2>/dev/null | grep -q "habib-furniture.*online"; then
    echo -e "${RED}❌ Application is not running${NC}"
    echo "   Run: cd /var/www/habib-furniture && pm2 start ecosystem.config.js"
    echo ""
fi

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo -e "${RED}❌ Nginx is not running${NC}"
    echo "   Run: sudo systemctl start nginx"
    echo ""
fi

# Check if .env is missing critical vars
if [ -f "$APP_DIR/.env" ]; then
    cd "$APP_DIR"
    source .env 2>/dev/null
    if [ -z "$AUTH_SECRET" ] || [ ${#AUTH_SECRET} -lt 32 ]; then
        echo -e "${RED}❌ AUTH_SECRET is missing or too short${NC}"
        echo "   Generate: openssl rand -hex 32"
        echo ""
    fi
fi

echo "📚 For full fix, run:"
echo "   sudo bash /var/www/habib-furniture/scripts/fix-vps-deployment.sh"
echo ""
