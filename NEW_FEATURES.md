# 🎨 New Features Deployment Guide

## ✨ What's New

### 1. Featured Products System
- ✅ Mark products as "Featured" to show on homepage
- ✅ Checkbox in Add/Edit product forms
- ✅ Homepage automatically shows only featured products

### 2. Complete Image Management
- ✅ Upload additional images to existing products
- ✅ Delete images from products
- ✅ Set any image as primary (main display)
- ✅ Visual controls on hover
- ✅ Support for ALL image formats
- ✅ Increased limit to 10MB per image

---

## 🚀 Deploy to VPS

### Step 1: Pull Latest Code
```bash
cd /var/www/habib-furniture
git pull origin main
```

### Step 2: Run Database Migration
```bash
npx prisma migrate deploy
```

**OR manually run:**
```bash
npx prisma db execute --stdin <<< "ALTER TABLE \"Product\" ADD COLUMN \"isFeatured\" BOOLEAN NOT NULL DEFAULT false;"
npx prisma db execute --stdin <<< "CREATE INDEX \"Product_isFeatured_idx\" ON \"Product\"(\"isFeatured\");"
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Rebuild Application
```bash
npm run build
```

### Step 5: Restart PM2
```bash
pm2 restart habib-furniture
```

### Step 6: Verify
```bash
pm2 logs habib-furniture --lines 50
```

---

## 🧪 Test New Features

### 1. Test Featured Products

1. Go to: http://habibfurniture.com.bd/admin/products
2. Click "Add Product"
3. Fill form and **check "Featured Product"** checkbox
4. Save product
5. Visit homepage: http://habibfurniture.com.bd
6. Product should appear in featured section

### 2. Test Image Management

1. Go to: http://habibfurniture.com.bd/admin/products
2. Click "Edit" on any product
3. **Upload New Images:**
   - Click "Choose File"
   - Select images (any format: JPG, PNG, WEBP, GIF, etc.)
   - Click "Upload X image(s)"
   - Images appear in gallery

4. **Delete Image:**
   - Hover over image
   - Click "Delete"
   - Confirm deletion

5. **Set Primary Image:**
   - Hover over non-primary image
   - Click "Set Primary"
   - Image becomes main display image

### 3. Test All Image Formats
Upload these formats to verify:
- ✅ JPG / JPEG
- ✅ PNG
- ✅ WEBP
- ✅ GIF (animated supported)
- ✅ SVG
- ✅ AVIF
- ✅ Any other image format

---

## 📊 Database Changes

### New Column
```sql
isFeatured BOOLEAN NOT NULL DEFAULT false
```

### New Index
```sql
INDEX ON Product(isFeatured)
```

### Existing Products
All existing products will have `isFeatured = false` by default.

**To make existing products featured:**
1. Go to admin panel
2. Edit product
3. Check "Featured Product"
4. Save

---

## 🎯 Usage Guide

### For Adding Products

1. Fill all product details
2. Upload images (primary image is first)
3. **Check boxes:**
   - ✅ **Active** - Product visible to customers
   - ✅ **Featured** - Product shown on homepage

### For Editing Products

**Images:**
- View current images
- Upload new images (no limit on count)
- Delete unwanted images
- Set primary image (for thumbnails)

**Details:**
- Update name, price, description
- Change category
- Toggle featured status

**Stock/Status:**
- Stock managed from products list
- Active/Inactive toggle from products list

---

## 🔧 Troubleshooting

### Migration Fails
```bash
# Check if column already exists
npx prisma db pull
# Then generate client
npx prisma generate
npm run build
pm2 restart habib-furniture
```

### Images Not Uploading
Check PM2 logs:
```bash
pm2 logs habib-furniture
```

Check upload directory permissions:
```bash
ls -la /var/www/habib-furniture/public/uploads
chmod 755 /var/www/habib-furniture/public/uploads
```

### Featured Products Not Showing
1. Ensure migration ran successfully
2. Check that products are marked as featured AND active
3. Clear browser cache
4. Check homepage query in logs

---

## 📸 Image Best Practices

### Recommended Formats
- **Product photos:** WEBP (best compression)
- **Logos:** PNG or SVG
- **Thumbnails:** JPG

### Recommended Sizes
- **Primary Image:** 1200x1200px
- **Gallery Images:** 800x800px minimum
- **File Size:** Under 500KB each (will be optimized)

### Tips
1. First uploaded image = Primary image
2. Use descriptive filenames
3. Compress images before upload for faster loading
4. Minimum 500x500px for good quality

---

## ✅ Verification Checklist

After deployment:

- [ ] Migration successful (no errors)
- [ ] Build completed successfully
- [ ] PM2 restarted without errors
- [ ] Can add new product with featured checkbox
- [ ] Can edit existing product
- [ ] Can upload new images to product
- [ ] Can delete images from product
- [ ] Can set primary image
- [ ] Featured products show on homepage
- [ ] Non-featured products don't show on homepage
- [ ] All image formats accepted (JPG, PNG, WEBP, GIF, SVG)
- [ ] File size limit works (max 10MB)

---

## 🎉 New Capabilities

### Before
❌ Could only set images when creating product  
❌ Couldn't change/add images later  
❌ Couldn't choose which image is primary  
❌ Limited image formats  
❌ All active products showed on homepage  

### After
✅ Add/remove images anytime  
✅ Change primary image anytime  
✅ Upload all image formats  
✅ Better file size limits (10MB)  
✅ Control which products are featured  

---

## 🚨 Important Notes

1. **Backup First:**
   ```bash
   bash scripts/backup.ts
   ```

2. **Test on staging first** if you have one

3. **Featured vs Active:**
   - Active = Visible in catalog
   - Featured = Shows on homepage
   - Product must be BOTH to appear on homepage

4. **Image Storage:**
   - Images stored in `/public/uploads`
   - Not deleted from disk when removed from database
   - Consider cleanup script for orphaned files

---

**Created:** January 2026  
**Version:** 2.0  
**Breaking Changes:** None - fully backward compatible
