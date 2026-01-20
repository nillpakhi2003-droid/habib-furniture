# 🚨 URGENT: Admin Buttons Not Working Fix

## Issue
Enable/Edit/Delete buttons on admin products page not responding.

## Root Cause
Missing or incorrect `NEXT_ALLOWED_ORIGINS` environment variable causes server actions to be blocked.

---

## ⚡ QUICK FIX (Run on VPS)

```bash
# Pull latest fixes
cd /var/www/habib-furniture
git pull origin main

# Run the button fix script
sudo bash scripts/fix-admin-buttons.sh
```

**OR use the full deployment fix:**

```bash
cd /var/www/habib-furniture
git pull origin main
sudo bash scripts/fix-vps-deployment.sh
```

(Enter `habibfurniture.com.bd` when prompted)

---

## What the Fix Does

1. ✅ Checks and generates `AUTH_SECRET` (if missing/too short)
2. ✅ Sets `NODE_ENV=production`
3. ✅ Configures `NEXT_PUBLIC_APP_URL`
4. ✅ **Configures `NEXT_ALLOWED_ORIGINS`** (Critical!)
5. ✅ Rebuilds the application with correct settings
6. ✅ Restarts PM2

---

## After Running Fix

### 1. Clear Browser Cache
Press `Ctrl + Shift + Delete` and clear:
- Cookies
- Cached images and files

### 2. Logout and Login Again
```
Visit: http://habibfurniture.com.bd/admin/logout
Then: http://habibfurniture.com.bd/admin/login
```

### 3. Test Buttons
Go to: http://habibfurniture.com.bd/admin/products

Try:
- ✓ Enable/Disable button
- ✓ Edit button
- ✓ Add Product button

---

## Manual Fix (If Scripts Don't Work)

### 1. Edit .env file
```bash
cd /var/www/habib-furniture
nano .env
```

### 2. Add/Update these lines
```env
NODE_ENV="production"
AUTH_SECRET="your-32-char-or-longer-secret-here"
NEXT_PUBLIC_APP_URL="http://habibfurniture.com.bd"
NEXT_ALLOWED_ORIGINS="http://habibfurniture.com.bd,http://www.habibfurniture.com.bd"
PORT=10000
```

**Generate AUTH_SECRET:**
```bash
openssl rand -hex 32
```

### 3. Rebuild and restart
```bash
npm run build
pm2 restart habib-furniture
```

---

## Check if Fix Worked

### 1. Check PM2 logs for errors
```bash
pm2 logs habib-furniture --lines 50
```

Look for:
- ❌ "allowedOrigins" errors → Fix didn't apply
- ❌ "AUTH_SECRET" errors → Secret not set correctly
- ✅ No errors → Should be working

### 2. Test in browser console
1. Open http://habibfurniture.com.bd/admin/products
2. Press F12 (open DevTools)
3. Click Enable/Disable button
4. Check Console tab for errors

**Common errors:**
- "Failed to fetch" → CORS issue, check NEXT_ALLOWED_ORIGINS
- "403 Forbidden" → Server actions blocked
- "401 Unauthorized" → Session expired, logout/login

---

## Why This Happens

Next.js 15 requires explicit `allowedOrigins` for server actions in production:

```javascript
// next.config.mjs
serverActions: {
  allowedOrigins: [...] // Must match your domain
}
```

This is populated from `NEXT_ALLOWED_ORIGINS` environment variable.

Without it, ALL server actions (like product enable/disable) are blocked.

---

## Verify .env Configuration

```bash
cd /var/www/habib-furniture
cat .env | grep -E "NODE_ENV|AUTH_SECRET|NEXT_"
```

**Should show:**
```
NODE_ENV="production"
AUTH_SECRET="<long-random-string>"
NEXT_PUBLIC_APP_URL="http://habibfurniture.com.bd"
NEXT_ALLOWED_ORIGINS="http://habibfurniture.com.bd,http://www.habibfurniture.com.bd"
```

---

## Still Not Working?

### Debug Steps:

1. **Check PM2 is running:**
   ```bash
   pm2 status
   ```
   Should show `habib-furniture` as `online`

2. **Check nginx is forwarding:**
   ```bash
   curl -I http://localhost:10000
   curl -I http://habibfurniture.com.bd
   ```
   Both should return 200 or 302

3. **Check browser network tab:**
   - Open F12 → Network tab
   - Click Enable button
   - Look for failed requests (red)
   - Check response for error messages

4. **Full logs:**
   ```bash
   pm2 logs habib-furniture --lines 200 > ~/debug-logs.txt
   cat ~/debug-logs.txt
   ```

---

## Prevention

After fixing, to prevent this in future:

1. **Always set these in .env:**
   - `NODE_ENV="production"`
   - `NEXT_ALLOWED_ORIGINS="http://yourdomain.com"`

2. **After domain change, update:**
   ```bash
   nano /var/www/habib-furniture/.env
   # Update NEXT_PUBLIC_APP_URL and NEXT_ALLOWED_ORIGINS
   npm run build
   pm2 restart habib-furniture
   ```

3. **When adding SSL (https):**
   Update .env from `http://` to `https://`
   
---

## Quick Test Command

```bash
# Test if server actions work
curl -X POST http://habibfurniture.com.bd/admin/products \
  -H "Content-Type: application/json" \
  -v 2>&1 | grep -i "origin\|cors\|403"
```

If you see "403" or "origin" errors → CORS not configured

---

**Created:** January 2026  
**For:** habibfurniture.com.bd button fix
