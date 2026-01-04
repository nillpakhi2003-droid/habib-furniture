#!/bin/bash

# ================================================
# Emergency Deep Fix for Persistent Build Errors
# যখন কিছুতেই কাজ হচ্ছে না তখন এটা চালান
# ================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
echo -e "${RED}║   EMERGENCY DEEP CLEAN & REBUILD          ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
echo ""

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in project directory!${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  This will completely remove and reinstall everything.${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Stop application
echo -e "${YELLOW}[1/9] Stopping application...${NC}"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Nuclear clean
echo -e "${YELLOW}[2/9] Nuclear clean...${NC}"
rm -rf node_modules
rm -rf .next
rm -f package-lock.json
rm -rf ~/.npm/_cacache
echo -e "${GREEN}✅ Cleaned${NC}"

# Update npm
echo -e "${YELLOW}[3/9] Updating npm...${NC}"
npm install -g npm@latest

# Clear global cache
echo -e "${YELLOW}[4/9] Clearing all caches...${NC}"
npm cache clean --force
npm cache verify

# Fresh install with specific versions
echo -e "${YELLOW}[5/9] Installing core dependencies...${NC}"
npm install next@^15.1.0 react@^19.0.0 react-dom@^19.0.0 --save
npm install @prisma/client@^5.22.0 bcryptjs@^2.4.3 server-only@^0.0.1 --save

# Install dev dependencies explicitly
echo -e "${YELLOW}[6/9] Installing build dependencies...${NC}"
npm install --save-dev \
  tailwindcss@^3.4.0 \
  postcss@^8.4.0 \
  autoprefixer@^10.4.0 \
  typescript@^5.3.0 \
  prisma@^5.22.0 \
  tsx@^4.7.0 \
  @types/node@^22.0.0 \
  @types/react@^19.0.0 \
  @types/react-dom@^19.0.0 \
  @types/bcryptjs@^2.4.6

# Rebuild everything
echo -e "${YELLOW}[7/9] Rebuilding all packages...${NC}"
npm rebuild

# Verify critical packages
echo -e "${YELLOW}[8/9] Verifying installation...${NC}"
FAILED=""
for pkg in tailwindcss postcss autoprefixer next @prisma/client; do
    if node -e "require('$pkg')" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $pkg"
    else
        echo -e "  ${YELLOW}⚠${NC} $pkg - trying force reinstall..."
        FAILED="$FAILED $pkg"
    fi
done

# Force reinstall failed packages
if [ -n "$FAILED" ]; then
    echo -e "${YELLOW}Force reinstalling failed packages...${NC}"
    npm install --force $FAILED
    npm rebuild $FAILED
    
    # Verify again
    echo -e "${YELLOW}Verifying again...${NC}"
    for pkg in $FAILED; do
        if node -e "require('$pkg')" 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} $pkg - Fixed!"
        else
            echo -e "  ${RED}✗${NC} $pkg - Still failing"
            echo -e "${RED}Critical package $pkg cannot be loaded!${NC}"
            echo ""
            echo "Trying alternative fix..."
            # Try installing from node_modules parent
            (cd node_modules && npm install $pkg --force)
            if node -e "require('$pkg')" 2>/dev/null; then
                echo -e "${GREEN}✓ Fixed with alternative method${NC}"
            else
                echo -e "${RED}Package verification failed. Continuing anyway...${NC}"
            fi
        fi
    done
fi

echo -e "${GREEN}✅ Verification complete${NC}"

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate

# Build
echo -e "${YELLOW}[9/9] Building application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       Emergency Fix Successful! ✅         ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Start application
    echo -e "${YELLOW}Starting application...${NC}"
    PORT=10000 pm2 start npm --name habib-furniture -- start
    pm2 save
    
    echo ""
    echo -e "${GREEN}Application is running!${NC}"
    echo "  pm2 status"
    echo "  pm2 logs habib-furniture"
else
    echo -e "${RED}❌ Build still failed. Manual intervention needed.${NC}"
    echo ""
    echo "Possible issues:"
    echo "1. Check .env file exists and is valid"
    echo "2. Check DATABASE_URL is correct"
    echo "3. Run: npx prisma generate"
    echo "4. Check Node.js version: node --version (should be v20+)"
    exit 1
fi
