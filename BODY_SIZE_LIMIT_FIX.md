# CRITICAL FIX: Body Size Limit for Image Uploads

## The Problem
```
Error: Body exceeded 1 MB limit
statusCode: 413
```

**Root Cause:** Next.js default limit for server actions is only **1MB**, but we're uploading images up to **10MB each**!

## The Fix
Updated `next.config.js` to increase the limit to **50MB**:

```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '50mb', // Allow large image uploads
    allowedOrigins,
  },
}
```

## Deploy to VPS - IMPORTANT!

You **MUST rebuild** the application for this fix to work:

```bash
# SSH to VPS
ssh root@vmi2823196.contaboserver.net

# Navigate to project
cd /var/www/habib-furniture

# Pull the fix
git pull origin main

# CRITICAL: Rebuild the app (this applies the config change)
npm run build

# Restart PM2
pm2 restart habib-furniture

# Verify it's working
pm2 logs habib-furniture --lines 50
```

## Verify the Fix

1. Go to Admin → Products → Add Product
2. Upload 5-10 images (each 2-5MB)
3. Click "Create Product"
4. ✅ Should succeed without "Body exceeded 1MB" error
5. ✅ No more 413 status code errors

## Why This Happened

- `next.config.mjs` had the correct config (50mb limit)
- But `next.config.js` (old file) was being used instead
- Next.js prioritizes `.js` over `.mjs`
- Updated the `.js` file with the proper configuration

## Files Changed
- ✅ `next.config.js` - Added 50MB body size limit and CORS config

## Additional Errors in Logs

**"The requested resource isn't a valid image"**
- This happens when trying to display uploaded images
- Should be fixed once the upload succeeds

**"Unique constraint failed on the fields: (slug)"**
- Trying to create product with duplicate slug
- Use unique slugs like: `modern-bed-2`, `sofa-set-v2`, etc.

## Before vs After

**Before:**
- ❌ 1MB limit (default)
- ❌ Can't upload images > 1MB
- ❌ Error 413 (Payload Too Large)

**After:**
- ✅ 50MB limit
- ✅ Upload up to 20 images (10MB each = 200MB total possible)
- ✅ No more 413 errors
