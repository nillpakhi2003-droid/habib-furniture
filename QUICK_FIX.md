# 🚀 Quick VPS Fix Guide

## Your Issue
- ✅ Nginx is running but shows warnings
- ❌ `curl` returns "Empty reply from server"
- ❌ Product add/edit/delete not working on `habibfurniture.com.bd`

## Root Cause
Your Next.js application is **NOT running**. Nginx is working, but there's nothing for it to proxy to.

---

## 🔧 FASTEST FIX (3 Commands)

**SSH into your VPS and run:**

```bash
# 1. Go to your app directory
cd /var/www/habib-furniture

# 2. Run the automated fix script
sudo bash scripts/fix-vps-deployment.sh

# 3. When prompted, enter: habibfurniture.com.bd
```

That's it! The script will:
- ✅ Stop all conflicting processes
- ✅ Fix nginx configuration
- ✅ Build your application
- ✅ Start it with PM2
- ✅ Test all endpoints

**Expected result:** Your site should be live in ~2-3 minutes.

---

## 📊 Check Status First (Optional)

Before running the fix, you can diagnose the issue:

```bash
cd /var/www/habib-furniture
sudo bash scripts/diagnose-deployment.sh
```

This will show you exactly what's wrong.

---

## 🆘 If Fix Script Doesn't Work

### Manual Fix Steps:

#### 1. Check .env file exists and is correct
```bash
cd /var/www/habib-furniture
nano .env
```

**Must have these (update with your values):**
```env
DATABASE_URL="postgresql://username:password@host:5432/database"
AUTH_SECRET="your-at-least-32-character-secret-here"
ADMIN_PHONE="01700000000"
ADMIN_PASSWORD="your-password"
PORT=10000
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://habibfurniture.com.bd"
NEXT_ALLOWED_ORIGINS="https://habibfurniture.com.bd,https://www.habibfurniture.com.bd"
```

**Generate AUTH_SECRET if missing:**
```bash
openssl rand -hex 32
```

#### 2. Build the application
```bash
cd /var/www/habib-furniture
npm install
npm run build
```

#### 3. Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Configure Nginx (replace YOUR_DOMAIN)
```bash
sudo tee /etc/nginx/sites-available/habib-furniture > /dev/null <<'EOF'
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
EOF

# Enable and restart nginx
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/habib-furniture /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Verify it's working
```bash
# Check PM2 status
pm2 status

# Test locally
curl -I http://localhost:10000

# Test through nginx
curl -I http://habibfurniture.com.bd
```

---

## ✅ Verification Checklist

After running the fix, check these:

- [ ] `pm2 status` shows `habib-furniture` as `online`
- [ ] `curl -I http://localhost:10000` returns HTTP 200 or 302
- [ ] `curl -I http://habibfurniture.com.bd` returns HTTP 200 or 302
- [ ] Website loads in browser
- [ ] Can access `/admin/login`
- [ ] Can login to admin panel
- [ ] Can add/edit/delete products

---

## 🐛 Common Errors & Quick Fixes

### "Cannot connect to database"
```bash
# Check DATABASE_URL in .env
cat /var/www/habib-furniture/.env | grep DATABASE_URL

# Test connection
cd /var/www/habib-furniture
npx prisma db execute --stdin <<< "SELECT 1;"
```

### "AUTH_SECRET must be set"
```bash
cd /var/www/habib-furniture
echo "AUTH_SECRET=\"$(openssl rand -hex 32)\"" >> .env
pm2 restart habib-furniture
```

### "Port 10000 already in use"
```bash
# Kill process on port 10000
sudo kill -9 $(sudo lsof -t -i:10000)

# Restart your app
pm2 restart habib-furniture
```

### "502 Bad Gateway"
```bash
# App crashed - check logs
pm2 logs habib-furniture --lines 50

# Restart
pm2 restart habib-furniture
```

### "nginx: conflicting server name"
```bash
# Remove conflicting configs
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/drishtierp*
sudo rm -f /etc/nginx/sites-enabled/nazipuruhs*

# Keep only habib-furniture
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📱 Quick Command Reference

```bash
# View app logs
pm2 logs habib-furniture

# Restart app
pm2 restart habib-furniture

# Rebuild app
cd /var/www/habib-furniture && npm run build && pm2 restart habib-furniture

# Check nginx
sudo nginx -t
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/habib-furniture-error.log

# Monitor everything
pm2 monit
```

---

## 🎯 Next Steps After HTTP Works

1. **Test all features:**
   - Create a product
   - Edit a product
   - Delete a product
   - Place an order
   - View analytics

2. **Setup SSL (HTTPS):**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d habibfurniture.com.bd -d www.habibfurniture.com.bd
   
   # Update .env to use https://
   nano /var/www/habib-furniture/.env
   # Change NEXT_PUBLIC_APP_URL to https://habibfurniture.com.bd
   
   pm2 restart habib-furniture
   ```

3. **Setup automatic backups:**
   ```bash
   cd /var/www/habib-furniture
   bash scripts/setup-cron.sh
   ```

4. **Monitor your site:**
   ```bash
   pm2 monit
   ```

---

## 📞 Need More Help?

1. **Run diagnostics and save output:**
   ```bash
   sudo bash /var/www/habib-furniture/scripts/diagnose-deployment.sh > ~/diagnostic-report.txt
   cat ~/diagnostic-report.txt
   ```

2. **Get recent logs:**
   ```bash
   pm2 logs habib-furniture --lines 100 --nostream > ~/pm2-logs.txt
   cat ~/pm2-logs.txt
   ```

3. **Check nginx logs:**
   ```bash
   sudo tail -n 100 /var/log/nginx/error.log > ~/nginx-errors.txt
   cat ~/nginx-errors.txt
   ```

Share these files for debugging.

---

## 🎉 Success?

Once everything is working, you should see:
- ✅ Website loads at http://habibfurniture.com.bd
- ✅ Admin panel works at http://habibfurniture.com.bd/admin
- ✅ Can manage products, orders, settings
- ✅ PM2 shows app as `online`
- ✅ No errors in logs

**Remember:** Keep your `.env` file backed up and secure! 🔒

---

**Created:** January 2026  
**For:** Habib Furniture VPS Deployment
