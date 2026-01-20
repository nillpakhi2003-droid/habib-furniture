# VPS Deployment Troubleshooting Guide

## Problem: Product Add/Edit/Delete Not Working

### Common Causes
1. Application not running (PM2 stopped)
2. Nginx not properly configured
3. Database connection issues
4. Missing or incorrect environment variables
5. Build errors

---

## Quick Fix (Recommended)

### Step 1: Run Diagnostics
```bash
sudo bash /var/www/habib-furniture/scripts/diagnose-deployment.sh
```

This will check:
- ✅ All services status
- ✅ Configuration files
- ✅ Environment variables
- ✅ Database connection
- ✅ Port availability
- ✅ Application logs

### Step 2: Apply Fix
```bash
sudo bash /var/www/habib-furniture/scripts/fix-vps-deployment.sh
```

Enter your domain when prompted (e.g., `habibfurniture.com.bd`)

This will:
1. Clean up conflicting nginx configs
2. Create proper nginx configuration
3. Rebuild the application
4. Start PM2 with correct settings
5. Test all endpoints

---

## Manual Troubleshooting

### 1. Check if Application is Running

```bash
pm2 status
```

**Expected:** `habib-furniture` should be `online`

**If not running:**
```bash
cd /var/www/habib-furniture
pm2 start ecosystem.config.js
pm2 save
```

### 2. Check Application Logs

```bash
pm2 logs habib-furniture --lines 50
```

Look for errors like:
- Database connection errors
- Port already in use
- AUTH_SECRET errors
- Build errors

### 3. Check Nginx Configuration

```bash
sudo nginx -t
```

**Expected:** `syntax is ok` and `test is successful`

**If errors:**
```bash
# View nginx config
cat /etc/nginx/sites-available/habib-furniture

# Check if enabled
ls -la /etc/nginx/sites-enabled/
```

### 4. Check Nginx Status

```bash
sudo systemctl status nginx
```

**If not running:**
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Test Endpoints

```bash
# Test Next.js app directly
curl -I http://localhost:10000

# Test through Nginx
curl -I http://habibfurniture.com.bd

# Test admin page
curl -I http://habibfurniture.com.bd/admin
```

**Expected:** HTTP 200 or 302 (redirect)
**Not:** Empty reply or connection refused

### 6. Check Environment Variables

```bash
cd /var/www/habib-furniture
cat .env
```

**Required variables:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
AUTH_SECRET="at-least-32-chars-random-string"
ADMIN_PHONE="01700000000"
ADMIN_PASSWORD="your-password"
PORT=10000
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://habibfurniture.com.bd"
```

**Generate AUTH_SECRET:**
```bash
openssl rand -hex 32
```

### 7. Check Database Connection

```bash
cd /var/www/habib-furniture
npx prisma db execute --stdin <<< "SELECT 1;"
```

**If fails:**
- Check DATABASE_URL in .env
- Ensure database exists
- Check PostgreSQL is running
- Verify network access to database

### 8. Rebuild Application

```bash
cd /var/www/habib-furniture
npm run build
pm2 restart habib-furniture
```

### 9. Check Port Conflicts

```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :10000
sudo lsof -i :3000
```

**Expected:**
- Port 80: nginx
- Port 443: nginx (if SSL enabled)
- Port 10000: node (your app)

---

## Error-Specific Solutions

### Error: "Empty reply from server"

**Cause:** Application not running

**Fix:**
```bash
cd /var/www/habib-furniture
pm2 restart habib-furniture
# If not in PM2:
pm2 start ecosystem.config.js
```

### Error: "Connection refused"

**Cause:** Nginx not running or wrong port

**Fix:**
```bash
# Check nginx
sudo systemctl restart nginx

# Check app port
grep "PORT" /var/www/habib-furniture/.env
grep "proxy_pass" /etc/nginx/sites-available/habib-furniture
# Both should match (default: 10000)
```

### Error: "502 Bad Gateway"

**Cause:** Nginx running but app not responding

**Fix:**
```bash
# Check if app is running
pm2 status

# Check app logs
pm2 logs habib-furniture

# Restart app
pm2 restart habib-furniture
```

### Error: "Cannot connect to database"

**Cause:** DATABASE_URL incorrect or database down

**Fix:**
```bash
# Test database directly
cd /var/www/habib-furniture
source .env
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Run migrations
npx prisma migrate deploy
```

### Error: "AUTH_SECRET must be set"

**Cause:** Missing or too short AUTH_SECRET

**Fix:**
```bash
cd /var/www/habib-furniture
echo "AUTH_SECRET=\"$(openssl rand -hex 32)\"" >> .env
pm2 restart habib-furniture
```

### Error: Product operations fail silently

**Cause:** Server actions failing due to CORS or auth

**Fix:**
```bash
# Check .env for correct domains
nano /var/www/habib-furniture/.env

# Ensure these match your domain:
NEXT_PUBLIC_APP_URL="https://habibfurniture.com.bd"
NEXT_ALLOWED_ORIGINS="https://habibfurniture.com.bd,https://www.habibfurniture.com.bd"

# Restart
pm2 restart habib-furniture
```

---

## Verification Steps

After fixing, verify everything works:

### 1. Check Services
```bash
# All should be green/online
pm2 status
sudo systemctl status nginx
```

### 2. Test Endpoints
```bash
# Should return 200 or 302
curl -I http://habibfurniture.com.bd
curl -I http://habibfurniture.com.bd/admin
curl -I http://habibfurniture.com.bd/api/settings
```

### 3. Test Admin Login
1. Visit: `http://habibfurniture.com.bd/admin/login`
2. Login with credentials from `.env`
3. Should redirect to `/admin/dashboard`

### 4. Test Product Operations
1. Visit: `http://habibfurniture.com.bd/admin/products`
2. Click "Add Product"
3. Fill form and submit
4. Should create product successfully
5. Try Edit and Delete

---

## Nginx Configuration Reference

**Correct nginx config for habib-furniture:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name habibfurniture.com.bd www.habibfurniture.com.bd;

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
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

**File locations:**
- Config: `/etc/nginx/sites-available/habib-furniture`
- Symlink: `/etc/nginx/sites-enabled/habib-furniture`

---

## PM2 Configuration Reference

**Correct PM2 config (ecosystem.config.js):**

```javascript
module.exports = {
  apps: [{
    name: 'habib-furniture',
    script: 'npm',
    args: 'start',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 10000
    }
  }]
};
```

---

## Useful Commands Reference

### PM2
```bash
pm2 list                    # List all processes
pm2 logs                    # View all logs
pm2 logs habib-furniture    # View app logs
pm2 restart habib-furniture # Restart app
pm2 stop habib-furniture    # Stop app
pm2 delete habib-furniture  # Remove from PM2
pm2 monit                   # Monitor resources
pm2 save                    # Save process list
pm2 startup                 # Enable startup script
```

### Nginx
```bash
sudo nginx -t               # Test configuration
sudo systemctl status nginx # Check status
sudo systemctl restart nginx # Restart nginx
sudo systemctl reload nginx # Reload config
sudo tail -f /var/log/nginx/habib-furniture-error.log
sudo tail -f /var/log/nginx/habib-furniture-access.log
```

### Application
```bash
cd /var/www/habib-furniture
npm run build               # Build application
npx prisma migrate deploy   # Run migrations
npx prisma studio           # Open database GUI
node create-admin.js        # Create admin user
```

---

## Prevention Tips

1. **Always check logs first:**
   ```bash
   pm2 logs habib-furniture
   ```

2. **Keep environment variables backed up:**
   ```bash
   cp .env .env.backup
   ```

3. **Monitor application:**
   ```bash
   pm2 monit
   ```

4. **Setup monitoring:**
   ```bash
   pm2 install pm2-logrotate
   ```

5. **Regular backups:**
   ```bash
   bash scripts/backup.ts
   ```

---

## Getting Help

If issues persist:

1. Run full diagnostics:
   ```bash
   sudo bash scripts/diagnose-deployment.sh > diagnostic-report.txt
   ```

2. Check all logs:
   ```bash
   pm2 logs habib-furniture --lines 100 > pm2-logs.txt
   sudo tail -n 100 /var/log/nginx/error.log > nginx-errors.txt
   ```

3. Share the diagnostic report and logs for support

---

## SSL/HTTPS Setup (After HTTP Works)

Once HTTP is working, add SSL:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d habibfurniture.com.bd -d www.habibfurniture.com.bd

# Update .env
NEXT_PUBLIC_APP_URL="https://habibfurniture.com.bd"
NEXT_ALLOWED_ORIGINS="https://habibfurniture.com.bd,https://www.habibfurniture.com.bd"

# Restart
pm2 restart habib-furniture
```

---

**Last Updated:** January 2026
