const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('habib@12@', 10);
    
    const admin = await prisma.admin.create({
      data: {
        phone: '01740649667',
        password: hashedPassword,
        isActive: true,
      },
    });
    
    console.log('✅ Admin created successfully!');
    console.log('Phone:', admin.phone);
    console.log('Password: habib@12@');
    console.log('\nYou can now login at: http://your-domain.com/admin/login');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin with this phone number already exists!');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
