#!/bin/bash

# ==============================================
# Production Setup Script for Habib Furniture
# ==============================================

echo "🚀 Starting production setup..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Creating from template..."
    
    if [ -f .env.production.example ]; then
        cp .env.production.example .env
        echo -e "${YELLOW}⚠️  Please edit .env and add your credentials${NC}"
        echo "Required:"
        echo "  - DATABASE_URL"
        echo "  - AUTH_SECRET (generate with: openssl rand -hex 32)"
        exit 1
    else
        echo -e "${RED}❌ .env.production.example not found!${NC}"
        exit 1
    fi
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check critical variables
echo -e "\n${YELLOW}Checking environment variables...${NC}"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
    echo -e "${RED}❌ AUTH_SECRET not set${NC}"
    exit 1
fi

if [ ${#AUTH_SECRET} -lt 32 ]; then
    echo -e "${RED}❌ AUTH_SECRET must be at least 32 characters${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables OK${NC}"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Run database migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database migrated${NC}"

# Generate Prisma Client
echo -e "\n${YELLOW}Generating Prisma Client...${NC}"
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prisma generate failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma Client generated${NC}"

# Seed database
echo -e "\n${YELLOW}Seeding database (admin user)...${NC}"
npx prisma db seed
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Seed failed (may already exist)${NC}"
else
    echo -e "${GREEN}✅ Database seeded${NC}"
fi

# Build application
echo -e "\n${YELLOW}Building application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Application built${NC}"

# Create backup directory
echo -e "\n${YELLOW}Creating backup directory...${NC}"
mkdir -p backups
echo -e "${GREEN}✅ Backup directory created${NC}"

# Test backup (if Telegram configured)
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    echo -e "\n${YELLOW}Testing Telegram backup...${NC}"
    npm run backup:test
    echo -e "${GREEN}✅ Backup system configured${NC}"
else
    echo -e "${YELLOW}⚠️  Telegram not configured (backups will be local only)${NC}"
fi

# Summary
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Production setup completed!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Start the application:"
echo "   npm start"
echo ""
echo "2. Or use PM2 for production:"
echo "   pm2 start npm --name habib-furniture -- start"
echo "   pm2 save"
echo ""
echo "3. Default admin credentials:"
echo "   Email: admin@habibfurniture.com"
echo "   Password: admin123"
echo "   ${RED}⚠️  Change this immediately!${NC}"
echo ""
echo "4. Set up daily backups with cron:"
echo "   crontab -e"
echo "   Add: 0 2 * * * cd $(pwd) && npm run backup"
echo ""
echo "5. Monitor logs:"
echo "   pm2 logs habib-furniture"
echo ""

echo -e "${YELLOW}Optional features:${NC}"
if [ -z "$RESEND_API_KEY" ] && [ -z "$SMTP_HOST" ]; then
    echo "❌ Email notifications not configured"
else
    echo "✅ Email notifications configured"
fi

if [ -z "$NEXT_PUBLIC_SENTRY_DSN" ]; then
    echo "❌ Error monitoring not configured"
else
    echo "✅ Error monitoring configured"
fi

if [ -z "$REDIS_URL" ]; then
    echo "❌ Redis not configured (using in-memory rate limiting)"
else
    echo "✅ Redis configured for distributed rate limiting"
fi

echo ""
