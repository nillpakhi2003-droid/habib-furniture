# 🚀 Ubuntu VPS এ সম্পূর্ণ Setup

## ✅ সব কিছু Ubuntu-তে locally চলবে!

আপনার Ubuntu VPS-এ:
- ✅ PostgreSQL database locally run করবে
- ✅ Redis locally run করবে (optional)
- ✅ Nginx web server locally
- ✅ PM2 দিয়ে application manage হবে
- ✅ Daily automatic backup Telegram-এ যাবে
- ✅ SSL certificate (Let's Encrypt)

---

## 🎯 Quick Start (একটা Command-এ সব কিছু!)

```bash
# 1. VPS-এ login করুন (SSH)
ssh root@your-server-ip

# 2. Repository clone করুন
git clone https://github.com/gsagg03-cmyk/habib-furniture.git
cd habib-furniture

# 3. Automated setup run করুন (সব install হবে!)
bash scripts/ubuntu-setup.sh
```

এই একটা script সব কিছু করে দেবে:
- ✅ Node.js 20 install
- ✅ PostgreSQL 16 install এবং database create
- ✅ Nginx install
- ✅ PM2 install
- ✅ Redis install (optional)
- ✅ Firewall configure
- ✅ Application build
- ✅ Database migrations run

**Installation শেষ হলে আপনি পাবেন:**
- Database credentials
- Admin login info
- Next steps guide

---

## 📋 Installation পরে কি করবেন

### 1. Application Start করুন
```bash
# PM2 দিয়ে start (port 10000)
PORT=10000 pm2 start npm --name habib-furniture -- start

# Auto-start enable করুন (server restart হলেও চলবে)
pm2 startup
pm2 save

# Status check
pm2 status
```

### 2. Domain Configure করুন
```bash
# আপনার domain name দিয়ে Nginx setup
sudo bash scripts/setup-nginx.sh habibfurniture.com 10000

# Port 10000-এ application চলবে
```

### 3. SSL Certificate Setup করুন (HTTPS)
```bash
sudo certbot --nginx -d habibfurniture.com -d www.habibfurniture.com

# Email দিন, terms agree করুন
# Automatic HTTPS redirect select করুন
```

### 4. Daily Backup Setup করুন
```bash
# Telegram bot configure করুন .env file-এ
nano .env
# Add:
# TELEGRAM_BOT_TOKEN="your-bot-token"
# TELEGRAM_CHAT_ID="your-chat-id"

# Test backup
npm run backup:test

# Cron job setup (daily 2 AM-এ backup হবে)
bash scripts/setup-cron.sh
```

---

## 🔧 Installed Services

### PostgreSQL (Database)
```bash
# Status check
sudo systemctl status postgresql

# Connect to database
psql -U habib_user -d habib_furniture -h localhost

# Restart
sudo systemctl restart postgresql
```

### Nginx (Web Server)
```bash
# Status check
sudo systemctl status nginx

# Reload configuration
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/error.log
```

### PM2 (Process Manager)
```bash
# Application status
pm2 status

# View logs
pm2 logs habib-furniture

# Restart application
pm2 restart habib-furniture

# Monitor
pm2 monit
```

### Redis (Optional - Rate Limiting)
```bash
# Status check
sudo systemctl status redis

# Test connection
redis-cli ping  # Should return: PONG

# Restart
sudo systemctl restart redis
```

---

## 🎛️ Management Commands

### Application
```bash
# Start
pm2 start habib-furniture

# Stop
pm2 stop habib-furniture

# Restart
pm2 restart habib-furniture

# Logs (real-time)
pm2 logs habib-furniture

# Logs (last 100 lines)
pm2 logs habib-furniture --lines 100
```

### Database
```bash
# Backup manually
npm run backup

# Migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# View data
psql -U habib_user -d habib_furniture -h localhost
```

### Updates
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart
pm2 restart habib-furniture
```

---

## 🔍 Monitoring

### System Health
```bash
# Quick health check
npm run health-check

# Disk space
df -h

# Memory usage
free -h

# CPU/Memory (real-time)
htop  # or: top

# Application logs
pm2 logs

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup Logs
```bash
# View backup logs
tail -f /var/log/habib-furniture/backup.log

# Manual test backup
npm run backup

# Test Telegram
npm run backup:test
```

---

## 🆘 Common Problems & Solutions

### Problem: Application not starting
```bash
# Check logs
pm2 logs habib-furniture --err

# Check if port 3000 is in use
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 $(sudo lsof -t -i:3000)

# Restart
pm2 restart habib-furniture
```

### Problem: Database connection failed
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check .env file
cat .env | grep DATABASE_URL

# Test connection
psql -U habib_user -d habib_furniture -h localhost
```

### Problem: Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Start app if not running
pm2 start habib-furniture

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Problem: SSL certificate expired
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test renewal (dry run)
sudo certbot renew --dry-run
```

### Problem: Out of disk space
```bash
# Check disk usage
df -h

# Clean old logs
pm2 flush

# Clean old backups (keeps last 7 days)
find backups/ -name "backup-*.sql" -mtime +7 -delete

# Clean system cache
sudo apt clean
sudo apt autoremove
```

---

## 📊 Server Requirements

### Minimum (শুরু করার জন্য):
- **RAM**: 1GB
- **CPU**: 1 core
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+ or 22.04 LTS

### Recommended (production-এর জন্য):
- **RAM**: 2GB+
- **CPU**: 2 cores
- **Storage**: 40GB+ SSD
- **OS**: Ubuntu 22.04 LTS

---

## 💰 VPS Provider Options

### Bangladesh-এ Available:
1. **BDCOM Cloud** - ৳500-1000/month
2. **ExonHost** - ৳800-1500/month  
3. **Skylark Soft** - ৳1000-2000/month

### International (Card লাগবে):
1. **DigitalOcean** - $6/month (~৳720)
2. **Vultr** - $6/month
3. **Linode** - $5/month
4. **Hetzner** - €4.5/month (~৳580)

---

## 🎓 Post-Installation Checklist

- [ ] Application PM2-তে running
- [ ] Domain configured এবং working
- [ ] SSL certificate installed (HTTPS)
- [ ] Database backup cron job setup
- [ ] Telegram backup tested
- [ ] Email notifications configured (optional)
- [ ] Redis running (optional)
- [ ] PM2 auto-start enabled
- [ ] Firewall configured
- [ ] Admin password changed
- [ ] Monitoring setup

---

## 📱 Access Your Site

After setup complete:
- **HTTP**: http://habibfurniture.com
- **HTTPS**: https://habibfurniture.com (after SSL setup)
- **Admin Panel**: https://habibfurniture.com/admin/login
- **Server IP**: `curl ifconfig.me`
- **Port**: 10000

---

## 🔐 Default Credentials

Setup script automatically creates:

**Admin Panel:**
- Email: `admin@habibfurniture.com`
- Password: `admin123`
- ⚠️ **CHANGE THIS IMMEDIATELY!**

**Database:**
- Credentials saved in: `~/habib-furniture-credentials.txt`
- ⚠️ Keep secure and delete after noting down!

---

## 📞 Useful Links

- Full Documentation: [UBUNTU_SETUP.md](./UBUNTU_SETUP.md)
- Self-Hosting Guide: [SELF_HOSTING.md](./SELF_HOSTING.md)
- Deployment Guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Production Checklist: [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

---

## 🎉 এখন আপনার সব কিছু Ubuntu VPS-এ চলবে!

- ✅ PostgreSQL locally
- ✅ Redis locally (optional)
- ✅ Nginx locally
- ✅ Application PM2-তে
- ✅ Daily backup Telegram-এ
- ✅ SSL certificate
- ✅ Automatic restart on server reboot

**One command setup:** `bash scripts/ubuntu-setup.sh`

সব কিছু ready! 🚀
