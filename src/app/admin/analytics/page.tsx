import { prisma } from "../../../lib/prisma";

type TimeRange = "today" | "week" | "month" | "all";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function getVisitorStats(range: TimeRange = "all") {
  const now = new Date();
  let startDate: Date | undefined;

  switch (range) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = undefined;
  }

  const where = startDate ? { createdAt: { gte: startDate } } : {};

  const [totalViews, uniqueIPs, topPages, recentVisitors, browserStats] = await Promise.all([
    // Total page views
    prisma.pageView.count({ where }),
    
    // Unique visitors (by IP)
    prisma.pageView.groupBy({
      by: ["ip"],
      where,
      _count: { ip: true },
    }),
    
    // Top pages
    prisma.pageView.groupBy({
      by: ["path"],
      where,
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    
    // Recent visitors
    prisma.pageView.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        path: true,
        ip: true,
        userAgent: true,
        referer: true,
        createdAt: true,
      },
    }),
    
    // Browser/Device stats
    prisma.pageView.findMany({
      where,
      select: { userAgent: true },
    }),
  ]);

  // Parse browser stats
  const browsers: Record<string, number> = {};
  const devices: Record<string, number> = {};
  
  browserStats.forEach((view) => {
    const ua = view.userAgent || "Unknown";
    
    // Simple browser detection
    if (ua.includes("Chrome")) browsers["Chrome"] = (browsers["Chrome"] || 0) + 1;
    else if (ua.includes("Firefox")) browsers["Firefox"] = (browsers["Firefox"] || 0) + 1;
    else if (ua.includes("Safari")) browsers["Safari"] = (browsers["Safari"] || 0) + 1;
    else if (ua.includes("Edge")) browsers["Edge"] = (browsers["Edge"] || 0) + 1;
    else browsers["Other"] = (browsers["Other"] || 0) + 1;
    
    // Device detection
    if (ua.includes("Mobile") || ua.includes("Android")) devices["Mobile"] = (devices["Mobile"] || 0) + 1;
    else if (ua.includes("Tablet") || ua.includes("iPad")) devices["Tablet"] = (devices["Tablet"] || 0) + 1;
    else devices["Desktop"] = (devices["Desktop"] || 0) + 1;
  });

  return {
    totalViews,
    uniqueVisitors: uniqueIPs.length,
    topPages: topPages.map((p) => ({ path: p.path, views: p._count.path })),
    recentVisitors,
    browsers: Object.entries(browsers).map(([name, count]) => ({ name, count })),
    devices: Object.entries(devices).map(([name, count]) => ({ name, count })),
  };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = (searchParams?.range || "all") as TimeRange;
  const stats = await getVisitorStats(range);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Website Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed visitor tracking and statistics</p>
        </div>

        <form method="get" className="flex items-center gap-3">
          <label className="text-sm text-gray-600" htmlFor="range">
            Time Range
          </label>
          <select
            id="range"
            name="range"
            defaultValue={range}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600">Total Page Views</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600">Unique Visitors</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.uniqueVisitors.toLocaleString()}</p>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600">Mobile Users</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats.devices.find((d) => d.name === "Mobile")?.count || 0}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600">Desktop Users</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {stats.devices.find((d) => d.name === "Desktop")?.count || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Top Pages</h2>
          <div className="space-y-3">
            {stats.topPages.length === 0 ? (
              <p className="text-gray-500 text-sm">No data available</p>
            ) : (
              stats.topPages.map((page, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{page.path}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(page.views / stats.topPages[0].views) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                      {page.views}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Browser Stats */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Browsers</h2>
          <div className="space-y-3">
            {stats.browsers.length === 0 ? (
              <p className="text-gray-500 text-sm">No data available</p>
            ) : (
              stats.browsers
                .sort((a, b) => b.count - a.count)
                .map((browser, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{browser.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(browser.count / stats.totalViews) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                        {browser.count}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Visitors */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Recent Visitors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Referrer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Device
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.recentVisitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No visitors yet
                  </td>
                </tr>
              ) : (
                stats.recentVisitors.map((visitor) => {
                  const ua = visitor.userAgent || "";
                  const device = ua.includes("Mobile") || ua.includes("Android")
                    ? "📱 Mobile"
                    : ua.includes("Tablet") || ua.includes("iPad")
                    ? "📱 Tablet"
                    : "💻 Desktop";

                  return (
                    <tr key={visitor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(visitor.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="font-medium">{visitor.path}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {visitor.ip || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {visitor.referer || "Direct"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {device}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
