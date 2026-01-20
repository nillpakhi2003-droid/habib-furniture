# Habib Furniture - E-commerce Platform

## 🛋️ হাবিব ফার্নিচার

প্রিমিয়াম মানের ফার্নিচার বিক্রয়ের জন্য সম্পূর্ণ ই-কমার্স সলিউশন।

### ✨ Features

- 🛍️ Product catalog with categories
- 🛒 Shopping cart & wishlist
- 📦 Order management system
- 💳 Multiple payment methods (Cash on Delivery, bKash, Nagad)
- 🚚 Delivery charge calculation (Inside/Outside Dhaka)
- 📊 Admin dashboard with analytics
- 📱 Fully responsive design
- 🔐 Secure authentication
- 💾 Automated database backup with Telegram
- 📧 Email notifications
- 📈 Facebook Pixel integration

### 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/gsagg03-cmyk/habib-furniture.git
cd habib-furniture

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
npx prisma migrate deploy
npx prisma generate
npx prisma db seed

# Run development
npm run dev
```

### 📚 Documentation

#### 🆘 VPS Troubleshooting (Start Here!)
- **[Quick Fix Guide](./QUICK_FIX.md)** ⚡ **Product add/edit/delete না হলে এটা দেখুন!**
- [VPS Troubleshooting](./VPS_TROUBLESHOOTING.md) - Complete troubleshooting guide
- [Build Error Fix](./BUILD_FIX.md) - Build error হলে দেখুন

#### 📖 Setup Guides
- [Production Setup](./PRODUCTION_CONFIG.md)
- [Ubuntu VPS Deployment](./UBUNTU_SETUP.md)
- [Self Hosting Guide](./SELF_HOSTING.md)
- [Deployment Guide](./DEPLOYMENT.md)

### 🔐 Admin Account Creation

#### Method 1: Automatic (During Seed)

Set environment variables in `.env`:
```bash
ADMIN_PHONE="01700000000"
ADMIN_PASSWORD="your-strong-password"
ADMIN_NAME="Admin"
```

Then run:
```bash
npx prisma db seed
```

#### Method 2: Manual (Via Database)

```bash
# Connect to PostgreSQL
sudo -u postgres psql -d habib_furniture

# Create admin user
INSERT INTO "User" (id, name, phone, "passwordHash", role, "createdAt")
VALUES (
  gen_random_uuid(),
  'Admin',
  '01700000000',
  -- Password hash for 'admin123' (change this!)
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'ADMIN',
  NOW()
);
```

#### Method 3: Using Node Script

Create `create-admin.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const phone = '01700000000'; // Change this
  const password = 'admin123'; // Change this
  const name = 'Admin';
  
  const passwordHash = await bcrypt.hash(password, 10);
  
  const admin = await prisma.user.upsert({
    where: { phone },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      name,
      phone,
      passwordHash,
      role: 'ADMIN'
    }
  });
  
  console.log('✅ Admin created:', admin.phone);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run:
```bash
node create-admin.js
```

## � VPS Deployment Issues?

### Product Add/Edit/Delete Not Working?

**Quick Fix (2 commands):**
```bash
cd /var/www/habib-furniture
sudo bash scripts/fix-vps-deployment.sh
```

Enter your domain when prompted. See [QUICK_FIX.md](./QUICK_FIX.md) for details.

### Diagnostic Tools

**Check what's wrong:**
```bash
sudo bash scripts/diagnose-deployment.sh
```

**Available fix scripts:**
- `scripts/fix-vps-deployment.sh` - Complete automated fix
- `scripts/diagnose-deployment.sh` - Full system diagnostics
- `scripts/fix-build.sh` - Build error fix
- `scripts/setup-nginx.sh` - Nginx configuration
- `scripts/setup-production.sh` - Full production setup

### Build Error Fix

যদি VPS এ build করার সময় error আসে:

```bash
# Quick fix command
npm run fix:build
```

Or manually:
```bash
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install
npm run build
```

বিস্তারিত: [BUILD_FIX.md](./BUILD_FIX.md)

### 🔧 Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom session-based auth
- **Deployment**: Ubuntu VPS, PM2, Nginx

### 📞 Support

For issues or questions, check the documentation or create an issue on GitHub.

---

**Domain**: habibfurniture.com  
**Port**: 10000  
**Made with ❤️ for Habib Furniture**
```