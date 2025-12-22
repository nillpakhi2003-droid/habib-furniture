# Production Deployment Guide

## 🚀 Deployment Platforms

### Option 1: Vercel (Recommended - Easiest)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add all variables from `.env.production.example`

3. **Configure Database**
   - Use Vercel Postgres OR external PostgreSQL (e.g., Supabase, Neon)
   - Add `DATABASE_URL` in environment variables

4. **Automatic Deployments**
   - Every push to `main` branch auto-deploys

### Option 2: Railway

1. **Create New Project**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

2. **Add PostgreSQL**
   - In Railway dashboard, click "New" > "Database" > "PostgreSQL"
   - DATABASE_URL will be auto-added to your app

3. **Configure Variables**
   - Settings > Variables > Add all from `.env.production.example`

### Option 3: DigitalOcean App Platform

1. **Create New App**
   - Connect your GitHub repository
   - Select branch: `main`

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Run Command: `npm start`

3. **Add PostgreSQL Database**
   - Components > Add Database > PostgreSQL

### Option 4: Self-Hosting (VPS)

Complete guide in [SELF_HOSTING.md](./SELF_HOSTING.md)

---

## 🗄️ Database Setup

### Production PostgreSQL Providers

#### Option 1: Supabase (Free tier available)
1. Go to https://supabase.com
2. Create new project
3. Get connection string from Settings > Database
4. Use in `DATABASE_URL`

#### Option 2: Neon (Serverless PostgreSQL)
1. Go to https://neon.tech
2. Create new project
3. Copy connection string
4. Use in `DATABASE_URL`

#### Option 3: Railway PostgreSQL
1. Automatically provisioned with Railway deployment
2. Connection string auto-injected

### Run Migrations

```bash
# Deploy migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed database (creates admin user)
npx prisma db seed
```

---

## 🔐 Security Checklist

### 1. Generate Secure AUTH_SECRET
```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows (PowerShell)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
```

### 2. Update next.config.mjs
```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '10mb',
    allowedOrigins: ['https://habibfurniture.com'], // Already configured!
  },
}
```

### 3. Enable HTTPS
- Most platforms (Vercel, Railway) handle automatically
- For VPS: Use Let's Encrypt (certbot)

---

## 📧 Email Setup (Optional)

### Resend (Recommended for Bangladesh)

1. Sign up at https://resend.com
2. Verify your domain OR use test mode
3. Get API key from dashboard
4. Add to environment variables:
   ```
   EMAIL_PROVIDER="resend"
   RESEND_API_KEY="re_your_key"
   EMAIL_FROM="noreply@habibfurniture.com"
   ADMIN_EMAIL="admin@habibfurniture.com"
   ```

### Gmail SMTP (Alternative)

1. Enable 2-Factor Authentication on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to environment variables:
   ```
   EMAIL_PROVIDER="smtp"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   EMAIL_FROM="your-email@gmail.com"
   ADMIN_EMAIL="admin@yourdomain.com"
   ```

---

## 📊 Error Monitoring (Optional)

### Sentry Setup

1. Sign up at https://sentry.io
2. Create new project (Next.js)
3. Get DSN from project settings
4. Add to environment variables:
   ```
   NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
   ```
5. Install Sentry SDK:
   ```bash
   npm install @sentry/nextjs
   ```

---

## 💾 Backup Setup

### Automatic Daily Backups to Telegram

1. **Create Telegram Bot**
   - Open Telegram, search for @BotFather
   - Send `/newbot` and follow instructions
   - Copy the bot token

2. **Get Chat ID**
   - Create a channel or group
   - Add your bot as admin
   - Send a message to the channel
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Copy the `chat.id` value

3. **Add to Environment Variables**
   ```
   TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
   TELEGRAM_CHAT_ID="-1001234567890"
   ```

4. **Set Up Cron Job**
   
   For Linux/Mac:
   ```bash
   # Edit crontab
   crontab -e
   
   # Add this line (runs daily at 2 AM)
   0 2 * * * cd /path/to/habib-furniture && npm run backup >> /var/log/backup.log 2>&1
   ```
   
   For Windows (Task Scheduler):
   - Create new task
   - Trigger: Daily at 2:00 AM
   - Action: Run `npm run backup` in project directory

5. **Manual Backup**
   ```bash
   npm run backup
   ```

---

## 🚄 Redis Setup (Optional - for distributed rate limiting)

### Upstash (Recommended - Free tier)

1. Sign up at https://upstash.com
2. Create new Redis database
3. Copy connection string
4. Add to environment variables:
   ```
   REDIS_URL="redis://default:password@hostname:6379"
   ```

### Railway Redis

1. In Railway dashboard: New > Database > Redis
2. Connection string auto-added

---

## 📈 Performance Optimization

### 1. Enable Caching
```javascript
// In next.config.mjs
const nextConfig = {
  // ... existing config
  compress: true,
  poweredByHeader: false,
};
```

### 2. Database Connection Pooling
Already configured in Prisma schema with `connection_limit=10`

### 3. Image Optimization
- Use Next.js Image component (already implemented)
- Consider Cloudinary or AWS S3 for CDN

---

## 🔍 Monitoring

### Check Application Health

```bash
# Check if app is running
curl https://your-domain.com

# Check database connection
npx prisma db pull

# View logs (Vercel)
vercel logs

# View logs (Railway)
railway logs
```

### Set Up Uptime Monitoring

Free services:
- https://uptimerobot.com
- https://betteruptime.com
- https://freshping.io

Configure to check your site every 5 minutes.

---

## 🛠️ Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Check DATABASE_URL format
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Environment Variables Not Loading

- Vercel: Redeploy after adding variables
- Railway: Restart app after adding variables
- VPS: Restart PM2 process

---

## 📱 Post-Deployment Testing

- [ ] Homepage loads correctly
- [ ] Products page displays all products
- [ ] Product detail page works
- [ ] Cart functionality works
- [ ] Order placement works
- [ ] Admin login works
- [ ] Admin dashboard accessible
- [ ] Analytics tracking works
- [ ] Facebook Pixel fires (if configured)
- [ ] Email notifications sent (if configured)
- [ ] Backup runs successfully (if configured)

---

## 🔄 Updates & Maintenance

### Deploy Updates

```bash
# Commit changes
git add .
git commit -m "Update feature"
git push origin main

# Automatic deployment on Vercel/Railway
# For VPS, run:
git pull
npm install
npm run build
pm2 restart habib-furniture
```

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Deploy to production
npx prisma migrate deploy
```

---

## 🆘 Emergency Procedures

### Rollback Deployment

**Vercel:**
- Dashboard > Deployments > Previous deployment > Promote to Production

**Railway:**
```bash
railway rollback
```

**VPS:**
```bash
git log --oneline
git reset --hard <previous-commit-hash>
npm install
npm run build
pm2 restart habib-furniture
```

### Restore Database Backup

```bash
# Download from Telegram
# Then restore:
psql -h hostname -U username -d database_name -f backup-file.sql
```

---

## 💰 Estimated Costs

### Free Tier Option
- **Hosting:** Vercel (Free)
- **Database:** Supabase (Free - 500MB)
- **Redis:** Upstash (Free - 10K requests/day)
- **Email:** Resend (Free - 3K emails/month)
- **Monitoring:** Sentry (Free - 5K errors/month)
- **Total:** ৳0/month

### Paid Option (Recommended for production)
- **Hosting:** Vercel Pro (৳2,000/month)
- **Database:** Supabase Pro (৳2,500/month)
- **Redis:** Upstash Pay-as-go (~৳500/month)
- **Email:** Resend Growth (~৳2,000/month)
- **Total:** ~৳7,000/month

---

## 📞 Support

For deployment issues:
- Vercel: https://vercel.com/support
- Railway: https://railway.app/help
- Supabase: https://supabase.com/support
