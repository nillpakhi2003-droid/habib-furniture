# Ubuntu VPS Deployment Quick Guide

## 🚀 One-Command Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/gsagg03-cmyk/habib-furniture.git
cd habib-furniture

# Run automated Ubuntu setup
bash scripts/ubuntu-setup.sh
```

এই script সব কিছু automatically install করবে:
- Node.js 20
- PostgreSQL 16 (local)
- Nginx
- PM2
- Redis (optional)
- Database setup
- Application build

---

## 📋 Manual Setup (যদি step by step করতে চান)

### 1. System Update
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Check installation
```

### 3. Install PostgreSQL
```bash
# Add PostgreSQL repository
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Create Database
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE habib_furniture;
CREATE USER habib_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE habib_furniture TO habib_user;
\c habib_furniture
GRANT ALL ON SCHEMA public TO habib_user;
ALTER DATABASE habib_furniture OWNER TO habib_user;
\q
```

### 5. Install Application
```bash
# Clone repository
git clone https://github.com/gsagg03-cmyk/habib-furniture.git
cd habib-furniture

# Install dependencies
npm install
```

### 6. Configure Environment
```bash
# Create .env file
nano .env
```

Add these (replace with your values):
```bash
DATABASE_URL="postgresql://habib_user:your_password@localhost:5432/habib_furniture"
AUTH_SECRET="$(openssl rand -hex 32)"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://habibfurniture.com"
NEXT_ALLOWED_ORIGINS="https://habibfurniture.com,https://www.habibfurniture.com"
PORT=10000

# Optional services
REDIS_URL="redis://localhost:6379"
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
```

### 7. Setup Database
```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

### 8. Build Application
```bash
npm run build
```

### 9. Install PM2
```bash
sudo npm install -g pm2

# Start application
pm2 start npm --name habib-furniture -- start

# Enable auto-start on boot
pm2 startup
pm2 save
```

### 10. Install Nginx
```bash
sudo apt install -y nginx

# Configure for your domain
sudo bash scripts/setup-nginx.sh yourdomain.com

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 11. Setup SSL
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 12. Configure Firewall
```bash
sudo apt install -y ufw
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 💾 Setup Daily Backup

### 1. Configure Telegram (Optional)
```bash
# Edit .env
nano .env

# Add:
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

# Test
npm run backup:test
```

### 2. Setup Cron Job
```bash
# Automated way
bash scripts/setup-cron.sh

# Or manually
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * cd /path/to/habib-furniture && npm run backup >> /var/log/habib-backup.log 2>&1
```

---

## 🔧 Redis Setup (Optional)

```bash
# Install Redis
sudo apt install -y redis-server

# Configure
sudo nano /etc/redis/redis.conf
# Set: supervised systemd

# Start Redis
sudo systemctl restart redis
sudo systemctl enable redis

# Test
redis-cli ping  # Should return PONG

# Add to .env
echo 'REDIS_URL="redis://localhost:6379"' >> .env

# Restart app
pm2 restart habib-furniture
```

---

## 📊 Useful Commands

### Application Management
```bash
# Start
pm2 start habib-furniture

# Stop
pm2 stop habib-furniture

# Restart
pm2 restart habib-furniture

# View logs
pm2 logs habib-furniture

# Monitor
pm2 monit

# Status
pm2 status
```

### Database Management
```bash
# Connect to database
psql -U habib_user -d habib_furniture -h localhost

# Backup manually
npm run backup

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Nginx
```bash
# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### System
```bash
# Check disk space
df -h

# Check memory
free -h

# Check running processes
htop  # or: top

# System logs
journalctl -xe
```

---

## 🔄 Updating Application

```bash
cd /path/to/habib-furniture

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Rebuild
npm run build

# Restart
pm2 restart habib-furniture

# Check logs
pm2 logs habib-furniture --lines 50
```

---

## 🆘 Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs habib-furniture --err

# Check if port is in use
sudo lsof -i :3000

# Kill process on port 3000
sudo kill -9 $(sudo lsof -t -i:3000)

# Restart
pm2 restart habib-furniture
```

### Database connection failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection
psql -U habib_user -d habib_furniture -h localhost

# Check .env DATABASE_URL
cat .env | grep DATABASE_URL
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check app logs
pm2 logs habib-furniture

# Restart app
pm2 restart habib-furniture

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### SSL certificate issues
```bash
# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates
```

### Out of disk space
```bash
# Check disk usage
df -h

# Clean old logs
pm2 flush

# Clean old backups (keeps last 7 days)
find /path/to/habib-furniture/backups -name "backup-*.sql" -mtime +7 -delete

# Clean apt cache
sudo apt clean
sudo apt autoremove
```

---

## 🎯 Production Checklist

- [x] Node.js 20 installed
- [x] PostgreSQL running locally
- [x] Database created and migrated
- [x] Application built
- [x] PM2 running application
- [x] PM2 auto-start configured
- [x] Nginx configured
- [x] SSL certificate installed
- [x] Firewall configured
- [x] Daily backup cron job
- [ ] Domain DNS pointed to server
- [ ] Telegram backup tested (optional)
- [ ] Email notifications configured (optional)
- [ ] Redis installed (optional)
- [ ] Monitoring setup (optional)

---

## 📱 Server Information

Check your server details:
```bash
# Server IP
curl ifconfig.me

# Server specs
lscpu
free -h
df -h

# Ubuntu version
lsb_release -a

# Services status
sudo systemctl status postgresql
sudo systemctl status nginx
sudo systemctl status redis  # if installed
pm2 status
```

---

## 💰 VPS Recommendations (Bangladesh)

### Local Providers
- **BDCOM Cloud**: ৳500-1000/month
- **ExonHost**: ৳800-1500/month
- **Skylark Soft**: ৳1000-2000/month

### International
- **DigitalOcean**: $6/month (~৳720)
- **Vultr**: $6/month (~৳720)
- **Linode**: $5/month (~৳600)
- **Hetzner**: €4.5/month (~৳580)

**Minimum Requirements:**
- 1GB RAM (2GB recommended)
- 1 CPU core (2 cores recommended)
- 25GB SSD
- Ubuntu 22.04 LTS

---

## 📞 Support

যদি কোন সমস্যা হয়:
1. Application logs check করুন: `pm2 logs`
2. Database status check করুন: `sudo systemctl status postgresql`
3. Nginx logs check করুন: `sudo tail -f /var/log/nginx/error.log`
4. System resources check করুন: `htop`

সব কিছু locally চলবে Ubuntu VPS-এ! 🚀
