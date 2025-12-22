# Facebook Pixel Setup Guide

## Overview
Your Habib Furniture website is now ready for Facebook Pixel tracking! This enables you to:
- Track website visitors
- Measure ad performance
- Create retargeting audiences
- Optimize for conversions

## Events Tracked

### 1. **PageView** (Automatic)
Fires on every page load across the entire website.

### 2. **ViewContent** (Product Pages)
Fires when someone views a product detail page.
- Tracks: Product ID, Name, Price, Category

### 3. **InitiateCheckout** (Order Form)
Fires when someone starts filling out the order form.
- Tracks: Product ID, Quantity, Total Value

### 4. **Purchase** (Order Completion)
Fires when an order is successfully placed.
- Tracks: Product ID, Total Value (including delivery)

### 5. **Lead** (Order Completion)
Also fires on order completion for lead optimization.

## Setup Steps

### Step 1: Get Your Facebook Pixel ID
1. Go to [Facebook Events Manager](https://business.facebook.com/events_manager)
2. Select your Business Account
3. Click on your Pixel (or create a new one)
4. Copy the Pixel ID (16-digit number)

### Step 2: Add Pixel ID to Your Website
1. Login to your admin dashboard: `/admin/login`
2. Go to Settings: `/admin/settings`
3. Scroll to "Facebook Pixel" section
4. Paste your Pixel ID
5. Click "Save Settings"
6. Refresh your website

### Step 3: Verify Pixel is Working
1. Install [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/) Chrome extension
2. Visit your website
3. Click the Pixel Helper icon
4. You should see your Pixel ID and "PageView" event

### Step 4: Test Product Tracking
1. Visit any product page (e.g., `/products/orthopedic-single-mattress`)
2. Pixel Helper should show "ViewContent" event
3. Fill out order form and submit
4. Should see "InitiateCheckout", "Purchase", and "Lead" events

## Running Facebook Ads

### For General Traffic
- Create campaigns with "Website Traffic" objective
- Use automatic placements
- Pixel will track all page views

### For Specific Products
1. Get the product URL (e.g., `yoursite.com/products/sofa-set`)
2. Create ad with "Conversions" objective
3. Use the product page as destination URL
4. Pixel will automatically track:
   - Who viewed the product
   - Who initiated checkout
   - Who completed purchase

### Campaign Types You Can Run

**1. Awareness Campaigns**
- Objective: Reach or Brand Awareness
- Pixel tracks: PageView

**2. Consideration Campaigns**
- Objective: Traffic or Engagement
- Pixel tracks: PageView, ViewContent

**3. Conversion Campaigns**
- Objective: Conversions
- Optimize for: Purchase or Lead
- Pixel tracks: All events

## Creating Custom Audiences

Once pixel is active, you can create audiences in Facebook Ads Manager:

1. **All Website Visitors** (PageView)
2. **Product Viewers** (ViewContent)
3. **Checkout Abandoners** (InitiateCheckout but no Purchase)
4. **Past Purchasers** (Purchase)

## Best Practices

1. **Wait 24-48 hours** after adding pixel for data to accumulate
2. **Use Conversions API** (future upgrade) for better tracking
3. **Create Lookalike Audiences** from purchasers for better targeting
4. **Monitor Events** in Facebook Events Manager regularly
5. **Test pixel** before launching expensive campaigns

## Troubleshooting

**Pixel not showing?**
- Check if Pixel ID is saved in settings
- Clear browser cache
- Check browser console for errors

**Events not firing?**
- Use Pixel Helper to debug
- Check Facebook Events Manager
- Wait 20 minutes for events to appear

**Events firing multiple times?**
- Normal on development (hot reload)
- Won't happen in production

## Support

For Facebook Pixel issues:
- [Facebook Business Help Center](https://www.facebook.com/business/help)
- [Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
