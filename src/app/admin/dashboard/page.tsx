import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatTaka(value: number | string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "৳0";
  return `৳${num.toLocaleString("en-BD")}`;
}

async function getDashboardStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrdersToday,
    totalOrdersWeek,
    totalOrdersMonth,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    todayRevenue,
    monthRevenue,
    lowStockProducts,
    recentOrders,
    totalProducts,
    todayVisitors,
    weekVisitors,
    topPages,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.product.findMany({
      where: { stock: { lt: 5 }, isActive: true },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        customerName: true,
        phone: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        items: { select: { quantity: true, product: { select: { name: true } } } },
      },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.pageView.groupBy({
      by: ["path"],
      _count: { path: true },
      where: { createdAt: { gte: startOfWeek } },
      orderBy: { _count: { path: "desc" } },
      take: 5,
    }),
  ]);

  return {
    totalOrdersToday,
    totalOrdersWeek,
    totalOrdersMonth,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
    monthRevenue: Number(monthRevenue._sum.totalAmount || 0),
    lowStockProducts,
    recentOrders,
    totalProducts,
    todayVisitors,
    weekVisitors,
    topPages: topPages.map((p) => ({ path: p.path, views: p._count.path })),
  };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-orange-100 text-orange-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-200 text-gray-700",
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Link
          href="/admin/orders"
          className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">
            📦
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Orders</p>
            <p className="text-xs text-gray-500">Manage orders</p>
          </div>
        </Link>
        
        <Link
          href="/admin/products"
          className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
            🛋️
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Products</p>
            <p className="text-xs text-gray-500">Add & edit</p>
          </div>
        </Link>
        
        <Link
          href="/admin/analytics"
          className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
            📊
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Analytics</p>
            <p className="text-xs text-gray-500">Visitor stats</p>
          </div>
        </Link>
        
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
            ⚙️
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Settings</p>
            <p className="text-xs text-gray-500">Delivery & payments</p>
          </div>
        </Link>
        
        <Link
          href="/"
          className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
            🏠
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Website</p>
            <p className="text-xs text-gray-500">View site</p>
          </div>
        </Link>
      </div>

      {/* Sales & Order Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-5 bg-white shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Today Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatTaka(stats.todayRevenue)}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Month Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatTaka(stats.monthRevenue)}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Orders Today</p>
          <p className="text-2xl font-bold">{stats.totalOrdersToday}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Orders (7d)</p>
          <p className="text-2xl font-bold">{stats.totalOrdersWeek}</p>
        </div>
      </div>

      {/* Visitor Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-5 bg-purple-50">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Visitors Today</p>
          <p className="text-3xl font-bold text-purple-600">{stats.todayVisitors}</p>
        </div>
        <div className="border rounded-lg p-5 bg-purple-50">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Visitors (7d)</p>
          <p className="text-3xl font-bold text-purple-600">{stats.weekVisitors}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Products</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Conversion</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.weekVisitors > 0 ? ((stats.totalOrdersWeek / stats.weekVisitors) * 100).toFixed(1) : "0"}%
          </p>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-5 bg-orange-50">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Pending</p>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
        </div>
        <div className="border rounded-lg p-5 bg-blue-50">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Confirmed</p>
          <p className="text-3xl font-bold text-blue-600">{stats.confirmedOrders}</p>
        </div>
        <div className="border rounded-lg p-5 bg-green-50">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Delivered</p>
          <p className="text-3xl font-bold text-green-600">{stats.deliveredOrders}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Total Month</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalOrdersMonth}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 border rounded-lg bg-white shadow-sm">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-red-600 hover:text-red-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Items</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.items.length > 0 ? (
                          <span className="text-gray-700">
                            {order.items[0].product.name}
                            {order.items.length > 1 && (
                              <span className="text-gray-500"> +{order.items.length - 1}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">No items</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">{formatTaka(order.totalAmount.toString())}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="border rounded-lg bg-white shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Low Stock Alert</h2>
          </div>
          <div className="p-4">
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">All products stocked well</p>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span className="text-sm font-medium text-gray-900 truncate pr-2">{product.name}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                        product.stock === 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {product.stock} left
                    </span>
                  </div>
                ))}
                <Link
                  href="/admin/products"
                  className="block text-center text-sm text-red-600 hover:text-red-700 font-medium pt-2"
                >
                  Manage Products →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Pages */}
      <div className="border rounded-lg bg-white shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Top Pages (Last 7 Days)</h2>
        </div>
        <div className="p-6">
          {stats.topPages.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No page views recorded yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topPages.map((page, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="text-sm font-medium text-gray-900">{page.path}</span>
                  <span className="text-sm text-gray-600 font-semibold">{page.views} views</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
