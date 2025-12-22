# Production Configuration Summary

## 🎯 Your Production Setup

### Domain & Port
- **Domain**: habibfurniture.com
- **Port**: 10000
- **Protocol**: HTTPS (with Let's Encrypt SSL)

### URLs
- **Public URL**: https://habibfurniture.com
- **Admin Panel**: https://habibfurniture.com/admin/login
- **API Endpoint**: https://habibfurniture.com/api

---

## 📝 Quick Deployment Commands

### 1. Start Application (Production)
```bash
# With PM2 (recommended)
PORT=10000 pm2 start npm --name habib-furniture -- start
pm2 save
pm2 startup

# Or direct Node
PORT=10000 npm start
```

### 2. Configure Nginx
```bash
sudo bash scripts/setup-nginx.sh habibfurniture.com 10000
```

### 3. Setup SSL Certificate
```bash
sudo certbot --nginx -d habibfurniture.com -d www.habibfurniture.com
```

### 4. Setup Daily Backups
```bash
bash scripts/setup-cron.sh
```

---

## ⚙️ Environment Variables (.env)

```bash
# Database (Local PostgreSQL)
DATABASE_URL="postgresql://habib_user:YOUR_PASSWORD@localhost:5432/habib_furniture"

# Authentication (Generate: openssl rand -hex 32)
AUTH_SECRET="your-64-character-secret-here-minimum-32-chars"

# Admin Credentials (for seeding)
ADMIN_PHONE="01700000000"
ADMIN_PASSWORD="strong-password-here"
ADMIN_NAME="Admin"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://habibfurniture.com"
NEXT_ALLOWED_ORIGINS="https://habibfurniture.com,https://www.habibfurniture.com"
PORT=10000

# Optional: Telegram Backup
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

# Optional: Email (Resend)
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_your_key"
EMAIL_FROM="noreply@habibfurniture.com"
ADMIN_EMAIL="admin@habibfurniture.com"

# Optional: Redis (for distributed rate limiting)
REDIS_URL="redis://localhost:6379"

# Optional: Sentry (error monitoring)
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
```

---

## 🚀 Complete Setup Flow

### On Ubuntu VPS:

```bash
# 1. Clone and setup
git clone https://github.com/gsagg03-cmyk/habib-furniture.git
cd habib-furniture
bash scripts/ubuntu-setup.sh

# 2. Configure .env (edit with your values)
nano .env

# 3. Start application
PORT=10000 pm2 start npm --name habib-furniture -- start
pm2 save
pm2 startup

# 4. Setup Nginx
sudo bash scripts/setup-nginx.sh habibfurniture.com 10000

# 5. Setup SSL
sudo certbot --nginx -d habibfurniture.com -d www.habibfurniture.com

# 6. Setup backups
bash scripts/setup-cron.sh

# 7. Check status
pm2 status
pm2 logs habib-furniture
```

---

## ✅ Pre-Launch Checklist

- [ ] Database created and migrated
- [ ] Admin user seeded with strong password
- [ ] `AUTH_SECRET` generated (32+ characters)
- [ ] `.env` configured with all required variables
- [ ] Port 10000 set in environment
- [ ] Nginx configured and running
- [ ] SSL certificate installed
- [ ] DNS pointing to server IP
- [ ] Firewall allowing ports 22, 80, 443
- [ ] PM2 running and auto-start enabled
- [ ] Daily backups scheduled
- [ ] Test order creation works
- [ ] Test admin login works
- [ ] Test payment methods display correctly
- [ ] Mobile responsive tested
- [ ] Analytics/Facebook Pixel configured

---

## 🔍 Monitoring Commands

```bash
# Check application status
pm2 status
pm2 logs habib-furniture

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check PostgreSQL
sudo systemctl status postgresql

# Check disk space
df -h

# Check memory
free -m

# Check server load
htop

# Test website
curl -I https://habibfurniture.com
```

---

## 📞 Support & Documentation

- [Production Ready Guide](./PRODUCTION_READY.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Self Hosting Guide](./SELF_HOSTING.md)
- [Ubuntu Setup Guide](./UBUNTU_SETUP.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)

---

## 🎉 Your Setup is Production-Ready!

All configuration defaults are set for:
- **Domain**: habibfurniture.com
- **Port**: 10000
- **Allowed Origins**: Configured
- **Security**: Headers, rate limiting, input validation
- **Backup**: Telegram integration ready
- **Email**: Template ready (configure provider)
- **Monitoring**: Sentry integration ready

Just fill in your credentials and deploy! 🚀
