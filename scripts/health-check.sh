#!/bin/bash

# ============================================
# Health Check Script
# ============================================

echo "🏥 Running health checks..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ERRORS=0

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Load env
export $(cat .env 2>/dev/null | grep -v '^#' | xargs)

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ DATABASE_URL configured${NC}"
    
    # Test database connection
    npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database connection OK${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        ((ERRORS++))
    fi
fi

# Check AUTH_SECRET
if [ -z "$AUTH_SECRET" ]; then
    echo -e "${RED}❌ AUTH_SECRET not set${NC}"
    ((ERRORS++))
elif [ ${#AUTH_SECRET} -lt 32 ]; then
    echo -e "${RED}❌ AUTH_SECRET too short (minimum 32 characters)${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ AUTH_SECRET configured${NC}"
fi

# Check NODE_ENV
if [ "$NODE_ENV" != "production" ]; then
    echo -e "${YELLOW}⚠️  NODE_ENV is not 'production' (current: ${NODE_ENV})${NC}"
else
    echo -e "${GREEN}✅ NODE_ENV set to production${NC}"
fi

# Check if build exists
if [ ! -d ".next" ]; then
    echo -e "${RED}❌ .next directory not found (run: npm run build)${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Application built${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules not found (run: npm install)${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Check port availability
PORT=3000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $PORT is already in use${NC}"
else
    echo -e "${GREEN}✅ Port $PORT is available${NC}"
fi

# Check disk space
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}❌ Disk usage critical: ${DISK_USAGE}%${NC}"
    ((ERRORS++))
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "${YELLOW}⚠️  Disk usage high: ${DISK_USAGE}%${NC}"
else
    echo -e "${GREEN}✅ Disk space OK: ${DISK_USAGE}%${NC}"
fi

# Check optional features
echo -e "\n${YELLOW}Optional Features:${NC}"

if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    echo -e "${GREEN}✅ Telegram backup configured${NC}"
else
    echo -e "${YELLOW}⚠️  Telegram backup not configured${NC}"
fi

if [ -n "$RESEND_API_KEY" ] || [ -n "$SMTP_HOST" ]; then
    echo -e "${GREEN}✅ Email notifications configured${NC}"
else
    echo -e "${YELLOW}⚠️  Email notifications not configured${NC}"
fi

if [ -n "$NEXT_PUBLIC_SENTRY_DSN" ]; then
    echo -e "${GREEN}✅ Error monitoring configured${NC}"
else
    echo -e "${YELLOW}⚠️  Error monitoring not configured${NC}"
fi

if [ -n "$REDIS_URL" ]; then
    echo -e "${GREEN}✅ Redis configured${NC}"
else
    echo -e "${YELLOW}⚠️  Redis not configured (using in-memory)${NC}"
fi

# Summary
echo ""
echo "═══════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    echo -e "${GREEN}   System is ready for production${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS critical error(s) found${NC}"
    echo -e "${RED}   Fix errors before deploying${NC}"
    exit 1
fi
