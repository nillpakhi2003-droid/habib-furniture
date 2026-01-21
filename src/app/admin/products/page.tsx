import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getAdminSession } from "../../../lib/auth/session";
import { ToggleProductButton } from "./ToggleProductButton";

// Always render fresh data (no static cache) so new images show immediately
export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatTaka(value: number | string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "৳0";
  return `৳${num.toLocaleString("en-BD")}`;
}

async function getProducts() {
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      description: true,
      price: true,
      discountPrice: true,
      stock: true,
      isActive: true,
      isFeatured: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { path: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export default async function ProductsPage() {
  // Authentication check
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const products = await getProducts();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/orders"
            className="border border-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            View Orders
          </Link>
          <Link
            href="/admin/products/new"
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Image
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Category
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Price
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Stock
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No products found. Add your first product to get started.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const displayPrice = product.discountPrice || product.price;
                const isLowStock = product.stock < 5;

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {product.images[0]?.path ? (
                          <img
                            src={product.images[0].path}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">No image</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {product.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {formatTaka(displayPrice.toString())}
                        </span>
                        {product.discountPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatTaka(product.price.toString())}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {product.stock}
                        </span>
                        {isLowStock && (
                          <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                        >
                          Edit
                        </Link>
                        <ToggleProductButton
                          productId={product.id}
                          isActive={product.isActive}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
