import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { ProductCard } from "../../components/ProductCard";

function formatTaka(value: number | string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "৳0";
  return `৳${num.toLocaleString("en-BD")}`;
}

const CATEGORIES = [
  { name: "সকল পণ্য", slug: "all", icon: "🏠" },
  { name: "বেডরুম", slug: "bedroom", icon: "🛏️" },
  { name: "লিভিং রুম", slug: "living", icon: "🛋️" },
  { name: "ডাইনিং", slug: "dining", icon: "🍽️" },
  { name: "অফিস", slug: "office", icon: "💼" },
  { name: "রান্নাঘরের ক্যাবিনেট", slug: "kitchen", icon: "🗄️" },
  { name: "ম্যাট্রেস", slug: "mattress", icon: "🛌" },
];

const PRICE_RANGES = [
  { label: "৳১০,০০০ এর নিচে", min: 0, max: 10000, value: "0-10000" },
  { label: "৳১০,০০০ - ৳২৫,০০০", min: 10000, max: 25000, value: "10000-25000" },
  { label: "৳২৫,০০০ - ৳৫০,০০০", min: 25000, max: 50000, value: "25000-50000" },
  { label: "৳৫০,০০০ এর উপরে", min: 50000, max: 999999999, value: "50000-999999999" },
];

async function getActiveProducts(category?: string, priceRange?: string) {
  let where: any = { isActive: true };
  
  // Category filter
  if (category && category !== "all") {
    where.category = category;
  }
  
  // Price filter
  if (priceRange) {
    const [min, max] = priceRange.split("-").map(Number);
    where.OR = [
      { discountPrice: { gte: min, lte: max } },
      { AND: [{ discountPrice: null }, { price: { gte: min, lte: max } }] },
    ];
  }

  return await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      description: true,
      price: true,
      discountPrice: true,
      stock: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { path: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; price?: string }>;
}) {
  const params = await searchParams;
  const category = params?.category || "all";
  const priceRange = params?.price;
  const products = await getActiveProducts(category, priceRange);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-red-600 transition">হোম</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">পণ্য</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">ক্যাটাগরি</h2>
              <nav className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const isActive = category === cat.slug;
                  let href = "/products";
                  
                  if (cat.slug !== "all") {
                    const params = new URLSearchParams();
                    params.set("category", cat.slug);
                    if (priceRange) params.set("price", priceRange);
                    href = `/products?${params.toString()}`;
                  } else if (priceRange) {
                    href = `/products?price=${priceRange}`;
                  }
                  
                  return (
                    <Link
                      key={cat.slug}
                      href={href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? "bg-red-50 text-red-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span>{cat.name}</span>
                      {isActive && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Filter by Price */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">দামের সীমা</h3>
                <div className="space-y-2 text-sm">
                  {PRICE_RANGES.map((range) => {
                    const isActive = priceRange === range.value;
                    const categoryParam = category !== "all" ? `category=${category}` : "";
                    const priceParam = `price=${range.value}`;
                    const urlParams = categoryParam ? `${categoryParam}&${priceParam}` : priceParam;
                    
                    return (
                      <Link
                        key={range.value}
                        href={`/products?${urlParams}`}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                          isActive
                            ? "bg-red-50 text-red-600 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isActive ? "border-red-600 bg-red-600" : "border-gray-300"
                        }`}>
                          {isActive && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span>{range.label}</span>
                      </Link>
                    );
                  })}
                  {priceRange && (
                    <Link
                      href={category !== "all" ? `/products?category=${category}` : "/products"}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      ফিল্টার মুছুন
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {CATEGORIES.find((c) => c.slug === category)?.name || "পণ্য"}
                </h1>
                <p className="text-gray-600 mt-1">{products.length} টি পণ্য পাওয়া গেছে</p>
              </div>
              <select className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
                <option>সাজান: সর্বশেষ</option>
                <option>দাম: কম থেকে বেশি</option>
                <option>দাম: বেশি থেকে কম</option>
                <option>নাম: অ থেকে ই</option>
              </select>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 text-lg font-medium">কোনো পণ্য নেই</p>
                <p className="text-gray-400 text-sm mt-1">নতুন পণ্যের জন্য পরে দেখুন</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={{
                      ...product,
                      price: Number(product.price),
                      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
                    }} 
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
