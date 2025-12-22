import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  const adminPhone = process.env.ADMIN_PHONE?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || "Admin";

  // Sample products with different categories and price ranges
  const products = [
    {
      name: "Modern Queen Bed Frame",
      slug: "modern-queen-bed-frame",
      description: "Elegant queen size bed frame with upholstered headboard. Made from premium quality wood with soft fabric padding.",
      category: "bedroom",
      price: 35000,
      discountPrice: 28000,
      stock: 12,
      isActive: true,
    },
    {
      name: "Luxury King Size Mattress",
      slug: "luxury-king-mattress",
      description: "Premium orthopedic mattress with memory foam layers. Provides excellent support and comfort for a restful sleep.",
      category: "mattress",
      price: 45000,
      discountPrice: 38000,
      stock: 8,
      isActive: true,
    },
    {
      name: "L-Shape Sofa Set",
      slug: "l-shape-sofa-set",
      description: "Spacious L-shaped sofa perfect for your living room. Features plush cushions and durable fabric upholstery.",
      category: "living",
      price: 55000,
      discountPrice: null,
      stock: 5,
      isActive: true,
    },
    {
      name: "Wooden Dining Table Set",
      slug: "wooden-dining-table-set",
      description: "Beautiful 6-seater dining table with matching chairs. Crafted from solid teak wood with elegant finish.",
      category: "dining",
      price: 42000,
      discountPrice: 35000,
      stock: 3,
      isActive: true,
    },
    {
      name: "Executive Office Chair",
      slug: "executive-office-chair",
      description: "Ergonomic office chair with lumbar support and adjustable height. Perfect for long working hours.",
      category: "office",
      price: 8500,
      discountPrice: 7200,
      stock: 15,
      isActive: true,
    },
    {
      name: "Modern Kitchen Cabinet",
      slug: "modern-kitchen-cabinet",
      description: "Spacious wall-mounted kitchen cabinet with multiple shelves. Made from moisture-resistant plywood.",
      category: "kitchen",
      price: 22000,
      discountPrice: null,
      stock: 6,
      isActive: true,
    },
    {
      name: "Study Table with Drawer",
      slug: "study-table-drawer",
      description: "Compact study table with storage drawer. Ideal for students and home offices.",
      category: "office",
      price: 6500,
      discountPrice: null,
      stock: 20,
      isActive: true,
    },
    {
      name: "Recliner Sofa",
      slug: "recliner-sofa",
      description: "Premium recliner sofa with adjustable backrest and footrest. Perfect for relaxation and comfort.",
      category: "living",
      price: 48000,
      discountPrice: 42000,
      stock: 4,
      isActive: true,
    },
    {
      name: "Wardrobe 3 Door",
      slug: "wardrobe-3-door",
      description: "Spacious 3-door wardrobe with hanging rod and shelves. Made from engineered wood with laminate finish.",
      category: "bedroom",
      price: 32000,
      discountPrice: 27500,
      stock: 7,
      isActive: true,
    },
    {
      name: "Coffee Table Set",
      slug: "coffee-table-set",
      description: "Stylish glass-top coffee table with matching side tables. Modern design perfect for any living room.",
      category: "living",
      price: 15000,
      discountPrice: 12500,
      stock: 10,
      isActive: true,
    },
    {
      name: "Bedside Table Pair",
      slug: "bedside-table-pair",
      description: "Set of 2 matching bedside tables with drawers. Compact design perfect for small bedrooms.",
      category: "bedroom",
      price: 8000,
      discountPrice: null,
      stock: 14,
      isActive: true,
    },
    {
      name: "Orthopedic Single Mattress",
      slug: "orthopedic-single-mattress",
      description: "Single size orthopedic mattress with firm support. Ideal for growing children and adults.",
      category: "mattress",
      price: 12000,
      discountPrice: 9500,
      stock: 18,
      isActive: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
    console.log(`✅ Created/Updated: ${product.name}`);
  }

  if (adminPhone && adminPassword && adminPassword.length >= 8) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
      where: { phone: adminPhone },
      update: {
        name: adminName,
        passwordHash,
        role: Role.ADMIN,
      },
      create: {
        name: adminName,
        phone: adminPhone,
        passwordHash,
        role: Role.ADMIN,
      },
    });

    console.log(`✅ Admin user ensured (${adminPhone})`);
  } else {
    console.log("ℹ️ Skipping admin seed: set ADMIN_PHONE and ADMIN_PASSWORD (>=8 chars) to auto-create an admin user.");
  }

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
