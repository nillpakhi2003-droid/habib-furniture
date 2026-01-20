# Deploy ID-Based Routing Fix

## What Changed
- Product URLs now use unique product ID instead of slug
- Before: `/products/modern-sofa` or `/products/modern%20alman`
- After: `/products/abc123xyz` (unique ID)
- This fixes the 404 error and ensures safe, reliable routing

## Deploy to VPS

```bash
# SSH to your VPS
ssh root@vmi2823196.contaboserver.net

# Navigate to project
cd /var/www/habib-furniture

# Pull latest changes
git pull origin main

# Rebuild the application
npm run build

# Restart PM2
pm2 restart habib-furniture

# Check status
pm2 logs habib-furniture --lines 20
```

## Verify Fix

1. Visit your homepage: http://habibfurniture.com.bd
2. Click any product - URL will now be like `/products/cm5abc123xyz`
3. No more 404 errors!
4. All product links (homepage, cart, wishlist) now use ID

## Benefits

✅ **No URL encoding issues** - No more spaces or special characters
✅ **Unique routing** - Product ID is guaranteed unique
✅ **Safer** - Cannot guess product URLs
✅ **Faster** - Database query by ID is faster than slug
✅ **Future-proof** - Can change product names without breaking URLs

## Files Changed

- `src/components/ProductCard.tsx` - Updated all links to use product.id
- `src/app/products/[slug]/` → `src/app/products/[id]/` - Renamed folder
- `src/app/products/[id]/page.tsx` - Changed query from slug to id
- `src/app/page.tsx` - Homepage featured products use id
- `src/app/cart/page.tsx` - Cart links use productId
- `src/app/wishlist/page.tsx` - Wishlist links use productId
