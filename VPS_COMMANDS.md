# 🎯 COPY-PASTE VPS FIX COMMANDS

## For: habibfurniture.com.bd Product Add/Edit/Delete Issue

---

## ⚡ FASTEST FIX (Copy and paste this ONE command)

```bash
cd /var/www/habib-furniture && sudo bash scripts/fix-vps-deployment.sh
```

**When prompted, enter:** `habibfurniture.com.bd`

**Wait 2-3 minutes**, then test your site!

---

## 📊 Want to Check First? (Diagnostics)

```bash
cd /var/www/habib-furniture && sudo bash scripts/diagnose-deployment.sh
```

This shows you what's wrong before fixing.

---

## 🔍 Manual Check Commands

### 1. Is the app running?
```bash
pm2 status
```
**Should show:** `habib-furniture` as `online`

### 2. Check app logs
```bash
pm2 logs habib-furniture --lines 50
```

### 3. Test if app responds
```bash
curl -I http://localhost:10000
```
**Should show:** HTTP/1.1 200 or 302

### 4. Test through nginx
```bash
curl -I http://habibfurniture.com.bd
```
**Should show:** HTTP/1.1 200 or 302

---

## 🛠️ Manual Fix (If automated script fails)

### Step 1: Check environment file
```bash
cd /var/www/habib-furniture
cat .env
```

**Must have:**
- DATABASE_URL
- AUTH_SECRET (at least 32 chars)
- ADMIN_PHONE
- ADMIN_PASSWORD
- PORT=10000

**Generate new AUTH_SECRET if needed:**
```bash
openssl rand -hex 32
```

### Step 2: Rebuild app
```bash
cd /var/www/habib-furniture
npm run build
```

### Step 3: Restart with PM2
```bash
pm2 restart habib-furniture
```

If not in PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
```

### Step 4: Check nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Verify
```bash
curl -I http://habibfurniture.com.bd
```

---

## ✅ Test After Fix

1. **Visit admin:** http://habibfurniture.com.bd/admin/login
2. **Login** with credentials from .env
3. **Go to products:** http://habibfurniture.com.bd/admin/products
4. **Try:**
   - Add Product ✓
   - Edit Product ✓
   - Delete Product ✓

---

## 🐛 If Still Not Working

### Check PM2 logs
```bash
pm2 logs habib-furniture --lines 100
```

### Check nginx logs
```bash
sudo tail -f /var/log/nginx/habib-furniture-error.log
```

### Check what's using ports
```bash
sudo lsof -i :10000
sudo lsof -i :80
```

### Restart everything
```bash
pm2 restart habib-furniture
sudo systemctl restart nginx
```

---

## 📱 Quick Commands Reference

```bash
# View app status
pm2 status

# View app logs
pm2 logs

# Restart app
pm2 restart habib-furniture

# Monitor app
pm2 monit

# Check nginx
sudo nginx -t
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx
```

---

## 🎉 Success Indicators

✅ `pm2 status` shows `online`  
✅ `curl http://localhost:10000` works  
✅ `curl http://habibfurniture.com.bd` works  
✅ Website loads in browser  
✅ Can access admin panel  
✅ Can add/edit/delete products  

---

## 📞 Still Having Issues?

Run full diagnostics and save output:
```bash
cd /var/www/habib-furniture
sudo bash scripts/diagnose-deployment.sh > ~/diagnostic-report.txt
cat ~/diagnostic-report.txt
```

Then share the diagnostic report.

---

**Created for:** Habib Furniture VPS Deployment  
**Date:** January 2026  
**Issue:** Product add/edit/delete not working

---

## 🔐 Security Reminder

After fixing, make sure:
1. AUTH_SECRET is random and secure (32+ chars)
2. ADMIN_PASSWORD is strong
3. Database credentials are secure
4. Setup SSL/HTTPS with certbot:
   ```bash
   sudo certbot --nginx -d habibfurniture.com.bd -d www.habibfurniture.com.bd
   ```

---

## 📚 Full Documentation

- **Quick Fix:** [QUICK_FIX.md](./QUICK_FIX.md)
- **Full Troubleshooting:** [VPS_TROUBLESHOOTING.md](./VPS_TROUBLESHOOTING.md)
- **Ubuntu Setup:** [UBUNTU_SETUP.md](./UBUNTU_SETUP.md)
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)
