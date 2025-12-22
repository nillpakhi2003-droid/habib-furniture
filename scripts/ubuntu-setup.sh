#!/bin/bash

# ================================================
# Ubuntu VPS Complete Setup Script
# Habib Furniture - All-in-One Installation
# ================================================

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Habib Furniture - Ubuntu VPS Setup      ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Please do not run as root. Run as normal user with sudo privileges.${NC}"
    exit 1
fi

echo -e "${YELLOW}This will install:${NC}"
echo "  • Node.js 20.x"
echo "  • PostgreSQL 16"
echo "  • Nginx"
echo "  • PM2 Process Manager"
echo "  • Redis (optional)"
echo "  • SSL Certificate (Let's Encrypt)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# ================================================
# 1. System Update
# ================================================
echo -e "\n${YELLOW}[1/10] Updating system...${NC}"
sudo apt update
sudo apt upgrade -y

# ================================================
# 2. Install Node.js 20
# ================================================
echo -e "\n${YELLOW}[2/10] Installing Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
fi

# ================================================
# 3. Install PostgreSQL 16
# ================================================
echo -e "\n${YELLOW}[3/10] Installing PostgreSQL 16...${NC}"
if ! command -v psql &> /dev/null; then
    # Add PostgreSQL repository
    sudo apt install -y postgresql-common
    sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
    
    # Install PostgreSQL 16
    sudo apt install -y postgresql-16 postgresql-client-16
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    echo -e "${GREEN}✅ PostgreSQL installed${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL already installed${NC}"
fi

# ================================================
# 4. Configure Database
# ================================================
echo -e "\n${YELLOW}[4/10] Configuring database...${NC}"

# Generate random password if not exists
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)

# Create database and user
sudo -u postgres psql << EOF
-- Drop if exists (for clean install)
DROP DATABASE IF EXISTS habib_furniture;
DROP USER IF EXISTS habib_user;

-- Create database and user
CREATE DATABASE habib_furniture;
CREATE USER habib_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE habib_furniture TO habib_user;

-- Grant schema permissions
\c habib_furniture
GRANT ALL ON SCHEMA public TO habib_user;
ALTER DATABASE habib_furniture OWNER TO habib_user;
EOF

echo -e "${GREEN}✅ Database created${NC}"
echo -e "${YELLOW}   Database: habib_furniture${NC}"
echo -e "${YELLOW}   User: habib_user${NC}"
echo -e "${YELLOW}   Password: ${DB_PASSWORD}${NC}"

# ================================================
# 5. Install Nginx
# ================================================
echo -e "\n${YELLOW}[5/10] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    echo -e "${GREEN}✅ Nginx installed${NC}"
else
    echo -e "${GREEN}✅ Nginx already installed${NC}"
fi

# ================================================
# 6. Install PM2
# ================================================
echo -e "\n${YELLOW}[6/10] Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# ================================================
# 7. Install Redis (Optional)
# ================================================
echo -e "\n${YELLOW}[7/10] Installing Redis...${NC}"
read -p "Install Redis for rate limiting? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo apt install -y redis-server
    sudo systemctl start redis
    sudo systemctl enable redis
    echo -e "${GREEN}✅ Redis installed${NC}"
    REDIS_INSTALLED=true
else
    echo -e "${YELLOW}⏭️  Skipping Redis${NC}"
    REDIS_INSTALLED=false
fi

# ================================================
# 8. Configure Firewall
# ================================================
echo -e "\n${YELLOW}[8/10] Configuring firewall...${NC}"
sudo apt install -y ufw
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
echo "y" | sudo ufw enable
echo -e "${GREEN}✅ Firewall configured${NC}"

# ================================================
# 9. Install SSL Certificate Tools
# ================================================
echo -e "\n${YELLOW}[9/10] Installing Certbot...${NC}"
sudo apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}✅ Certbot installed${NC}"

# ================================================
# 10. Setup Application
# ================================================
echo -e "\n${YELLOW}[10/10] Setting up application...${NC}"

# Install dependencies
npm install

# Generate secure AUTH_SECRET
AUTH_SECRET=$(openssl rand -hex 32)

# Create .env file
cat > .env << EOF
# Database (Local PostgreSQL)
DATABASE_URL="postgresql://habib_user:${DB_PASSWORD}@localhost:5432/habib_furniture"

# Authentication
AUTH_SECRET="${AUTH_SECRET}"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://habibfurniture.com"
NEXT_ALLOWED_ORIGINS="https://habibfurniture.com,https://www.habibfurniture.com"
PORT=10000

# Redis (if installed)
$(if [ "$REDIS_INSTALLED" = true ]; then echo "REDIS_URL=\"redis://localhost:6379\""; else echo "# REDIS_URL=\"redis://localhost:6379\""; fi)

# Optional: Telegram Backup
# TELEGRAM_BOT_TOKEN="your-bot-token"
# TELEGRAM_CHAT_ID="your-chat-id"

# Optional: Email
# EMAIL_PROVIDER="resend"
# RESEND_API_KEY="your-api-key"
# EMAIL_FROM="noreply@habibfurniture.com"
# ADMIN_EMAIL="admin@habibfurniture.com"

# Optional: Sentry
# NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
EOF

echo -e "${GREEN}✅ .env file created${NC}"

# Run database migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
npx prisma migrate deploy
npx prisma generate
npx prisma db seed

# Build application
echo -e "\n${YELLOW}Building application...${NC}"
npm run build

# Create backup directory
mkdir -p backups

# ================================================
# Summary and Next Steps
# ================================================
echo -e "\n${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Installation Complete! ✅          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📝 Database Credentials:${NC}"
echo "   Database: habib_furniture"
echo "   User: habib_user"
echo "   Password: ${DB_PASSWORD}"
echo "   Host: localhost"
echo "   Port: 5432"

echo -e "\n${BLUE}🔐 Admin Login:${NC}"
echo "   Email: admin@habibfurniture.com"
echo "   Password: admin123"
echo -e "   ${RED}⚠️  CHANGE THIS IMMEDIATELY!${NC}"

echo -e "\n${BLUE}🚀 Start Application:${NC}"
echo "   # Development mode:"
echo "   PORT=10000 npm run dev"
echo ""
echo "   # Production with PM2:"
echo "   PORT=10000 pm2 start npm --name habib-furniture -- start"
echo "   pm2 save"
echo "   pm2 startup  # Enable auto-start on boot"

echo -e "\n${BLUE}🌐 Configure Nginx:${NC}"
echo "   1. Get your domain name"
echo "   2. Point DNS to this server's IP: $(curl -s ifconfig.me)"
echo "   3. Run: sudo bash scripts/setup-nginx.sh habibfurniture.com 10000"

echo -e "\n${BLUE}🔒 Setup SSL:${NC}"
echo "   sudo certbot --nginx -d habibfurniture.com -d www.habibfurniture.com"

echo -e "\n${BLUE}💾 Setup Daily Backup:${NC}"
echo "   1. Configure Telegram in .env (optional)"
echo "   2. Test: npm run backup:test"
echo "   3. Setup cron:"
echo "      crontab -e"
echo "      # Add: 0 2 * * * cd $(pwd) && npm run backup >> /var/log/habib-backup.log 2>&1"

echo -e "\n${BLUE}📊 Useful Commands:${NC}"
echo "   pm2 status              - Check application status"
echo "   pm2 logs                - View application logs"
echo "   pm2 restart all         - Restart application"
echo "   sudo systemctl status postgresql  - Check database"
echo "   npm run health-check    - Check system health"

echo -e "\n${GREEN}✨ Your server is ready!${NC}\n"

# Save credentials to file
cat > ~/habib-furniture-credentials.txt << EOF
Habib Furniture - Server Credentials
Generated: $(date)

Database:
  Host: localhost
  Port: 5432
  Database: habib_furniture
  User: habib_user
  Password: ${DB_PASSWORD}

Admin Panel:
  Email: admin@habibfurniture.com
  Password: admin123
  ⚠️  CHANGE THIS IMMEDIATELY!

AUTH_SECRET: ${AUTH_SECRET}

Server IP: $(curl -s ifconfig.me)

Next Steps:
1. Start application: pm2 start npm --name habib-furniture -- start
2. Configure domain and Nginx
3. Setup SSL certificate
4. Configure Telegram backup (optional)
5. Setup email notifications (optional)
EOF

echo -e "${YELLOW}💾 Credentials saved to: ~/habib-furniture-credentials.txt${NC}"
echo -e "${RED}⚠️  Keep this file secure and delete after noting down credentials!${NC}\n"
