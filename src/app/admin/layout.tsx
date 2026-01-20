import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/auth/session";
import { adminLogoutAction } from "./logout/actions";

export const metadata = {
  title: "Habib Furniture Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side authentication check
  const session = await getAdminSession();
  
  // Allow login page to pass through
  if (!session) {
    // This will be handled by middleware, but adding as backup
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-red-600 hover:text-red-700 transition">
            Habib Furniture Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold text-gray-700">
            <Link href="/admin/dashboard" className="hover:text-red-600 transition">Dashboard</Link>
            <Link href="/admin/products" className="hover:text-red-600 transition">Products</Link>
            <Link href="/admin/orders" className="hover:text-red-600 transition">Orders</Link>
            <Link href="/admin/settings" className="hover:text-red-600 transition">Settings</Link>
            <form action={adminLogoutAction}>
              <button type="submit" className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition">
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="py-6">{children}</main>
    </div>
  );
}
