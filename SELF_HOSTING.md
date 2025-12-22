# Self-Hosting on VPS (Ubuntu/Debian)

## 📋 Prerequisites

- VPS with Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- Domain name pointed to your VPS IP
- Minimum: 2GB RAM, 2 CPU cores, 20GB storage

---

## 🔧 Initial Server Setup

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 20+

```bash
# Install Node.js from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE habib_furniture;
CREATE USER habib_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE habib_furniture TO habib_user;
\q
```

### 4. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 6. Install Certbot (for SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 🚀 Deploy Application

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone your repository
sudo git clone https://github.com/yourusername/habib-furniture.git
cd habib-furniture

# Set permissions
sudo chown -R $USER:$USER /var/www/habib-furniture
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Create .env file
nano .env

# Add these variables (replace with your values):
DATABASE_URL="postgresql://habib_user:YOUR_PASSWORD@localhost:5432/habib_furniture"
AUTH_SECRET="$(openssl rand -hex 32)"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://habibfurniture.com"
NEXT_ALLOWED_ORIGINS="https://habibfurniture.com,https://www.habibfurniture.com"
PORT=10000

# Add optional services (Telegram, Email, etc.)
# See .env.production.example for all options

# Save and exit (Ctrl+X, then Y, then Enter)
```

### 4. Run Database Migrations

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

### 5. Build Application

```bash
npm run build
```

### 6. Start with PM2

```bash
# Start application
pm2 start npm --name "habib-furniture" -- start

# Set up PM2 to start on boot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs habib-furniture
```

---

## 🌐 Configure Nginx

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/habib-furniture
```

### 2. Add This Configuration

```nginx
server {
    listen 80;
    server_name habibfurniture.com www.habibfurniture.com;

    # Increase upload size for images
    client_max_body_size 10M;

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
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 3. Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/habib-furniture /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Set Up SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d habibfurniture.com -d www.habibfurniture.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 💾 Set Up Automatic Backups

### 1. Install PostgreSQL Client Tools

```bash
sudo apt install -y postgresql-client
```

### 2. Create Backup Script

```bash
# Create script
nano /var/www/habib-furniture/backup.sh
```

```bash
#!/bin/bash

# Load environment variables
export $(cat /var/www/habib-furniture/.env | xargs)

# Run backup
cd /var/www/habib-furniture
npm run backup

# Optional: Remove local backups older than 7 days
find /var/www/habib-furniture/backups -name "backup-*.sql" -mtime +7 -delete
```

### 3. Make Script Executable

```bash
chmod +x /var/www/habib-furniture/backup.sh
```

### 4. Schedule with Cron

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM Bangladesh time)
0 2 * * * /var/www/habib-furniture/backup.sh >> /var/log/habib-backup.log 2>&1
```

---

## 🔧 Optional: Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Find and set:
supervised systemd
maxmemory 256mb
maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis

# Test
redis-cli ping  # Should return PONG

# Add to .env
echo 'REDIS_URL="redis://localhost:6379"' >> .env

# Restart application
pm2 restart habib-furniture
```

---

## 🔍 Monitoring & Logs

### PM2 Monitoring

```bash
# View logs
pm2 logs habib-furniture

# View real-time monitoring
pm2 monit

# View process info
pm2 info habib-furniture
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL Logs

```bash
sudo tail -f /var/log/postgresql/postgresql-*.log
```

---

## 🔄 Updating Application

```bash
cd /var/www/habib-furniture

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run new migrations
npx prisma migrate deploy
npx prisma generate

# Rebuild
npm run build

# Restart application
pm2 restart habib-furniture

# Check status
pm2 logs habib-furniture --lines 50
```

---

## 🛡️ Security Hardening

### 1. Configure Firewall

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH (IMPORTANT: Don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config

# Find and change:
PermitRootLogin no
PasswordAuthentication no  # If using SSH keys

# Restart SSH
sudo systemctl restart sshd
```

### 3. Install Fail2Ban

```bash
# Install
sudo apt install -y fail2ban

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 4. Regular Updates

```bash
# Create update script
sudo nano /usr/local/bin/update-system.sh
```

```bash
#!/bin/bash
apt update
apt upgrade -y
apt autoremove -y
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/update-system.sh

# Schedule weekly updates
sudo crontab -e

# Add (runs every Sunday at 3 AM)
0 3 * * 0 /usr/local/bin/update-system.sh >> /var/log/system-updates.log 2>&1
```

---

## 📊 Performance Optimization

### 1. Enable Gzip in Nginx

Already configured in default Nginx settings. Verify:

```bash
sudo nano /etc/nginx/nginx.conf

# Ensure these lines are uncommented:
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### 2. PostgreSQL Optimization

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf

# Adjust based on your RAM (example for 2GB RAM):
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 🆘 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs habib-furniture --err

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart application
pm2 restart habib-furniture
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U habib_user -d habib_furniture -h localhost

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart application
pm2 restart habib-furniture

# Check PM2 memory
pm2 monit
```

---

## 📱 Monitoring Dashboard

### Install Netdata (Optional)

```bash
# Install Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access at: http://your-ip:19999
# Secure it with Nginx reverse proxy if needed
```

---

## 💰 VPS Provider Recommendations

### Budget Options (Bangladesh-friendly)
1. **DigitalOcean** - $6/month (₹500/month)
2. **Vultr** - $6/month
3. **Linode/Akamai** - $5/month
4. **Hetzner** - €4.5/month

### Local Options
1. **BDCOM Cloud** - ৳500-1000/month
2. **ExonHost** - ৳800-1500/month

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible via domain
- [ ] HTTPS working (green padlock)
- [ ] Admin login works
- [ ] Orders can be placed
- [ ] PM2 starts on server reboot
- [ ] Daily backups running
- [ ] Firewall configured
- [ ] Monitoring set up
- [ ] SSL auto-renewal configured
- [ ] Logs are being collected

---

## 📞 Emergency Contacts

Keep these handy:
- VPS provider support
- Domain registrar support
- Your backup Telegram channel
