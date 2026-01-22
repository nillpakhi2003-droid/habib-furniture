import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getAdminSession } from "../../../lib/auth/session";
import { ToggleProductButton } from "./ToggleProductButton";
import { DeleteProductButton } from "./DeleteProductButton";

// Always render fresh data (no static cache) so new images show immediately
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ITEMS_PER_PAGE = 20;

function formatTaka(value: number | string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "৳0";
  return `৳${num.toLocaleString("en-BD")}`;
}

async function getProducts(page: number, search: string) {
  // Validate page number
  const validPage = Math.max(1, page);
  const skip = (validPage - 1) * ITEMS_PER_PAGE;
  
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          { category: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Run queries in parallel for better performance
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        price: true,
        discountPrice: true,
        stock: true,
        isActive: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { path: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  
  return { 
    products, 
    total, 
    totalPages,
    currentPage: validPage,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1,
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  // Authentication check
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const currentPage = Number(searchParams.page) || 1;
  const searchQuery = searchParams.search || "";
  const { products, total, totalPages, hasNextPage, hasPrevPage } = await getProducts(currentPage, searchQuery);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/orders"
            className="border border-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition text-sm"
          >
            Orders
          </Link>
          <Link
            href="/admin/products/bulk-add"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
          >
            📦 Bulk
          </Link>
          <Link
            href="/admin/products/new"
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm"
          >
            + Add
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <form method="get" className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search products by name, slug, or category..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Search
          </button>
          {searchQuery && (
            <Link
              href="/admin/products"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Results Info */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {products.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
        {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} products
        {searchQuery && ` for "${searchQuery}"`}
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            No products found. Add your first product to get started.
          </div>
        ) : (
          products.map((product) => {
            const displayPrice = product.discountPrice || product.price;
            const isLowStock = product.stock < 5;

            return (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                      {product.images[0]?.path ? (
                        <img
                          src={product.images[0].path}
                          alt={product.name}
                          loading="lazy"
                          width="80"
                          height="80"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{product.slug}</p>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {product.category || "Uncategorized"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-sm">
                          {formatTaka(displayPrice.toString())}
                        </span>
                        {product.discountPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatTaka(product.price.toString())}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600">Stock: {product.stock}</span>
                        {isLowStock && (
                          <span className="px-1.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">
                            Low
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit
                  </Link>
                  <div className="flex-1">
                    <ToggleProductButton
                      productId={product.id}
                      isActive={product.isActive}
                    />
                  </div>
                  <div className="flex-1">
                    <DeleteProductButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border overflow-hidden">
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
                            loading="lazy"
                            width="64"
                            height="64"
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
                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Page Info */}
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/products?page=${currentPage - 1}${searchQuery ? `&search=${searchQuery}` : ""}`}
              className={`px-4 py-2 border rounded-lg font-semibold transition ${
                !hasPrevPage
                  ? "border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </Link>
            
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <Link
                      key={page}
                      href={`/admin/products?page=${page}${searchQuery ? `&search=${searchQuery}` : ""}`}
                      className={`px-4 py-2 border rounded-lg font-semibold transition ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </Link>
                  );
                } else if (page === currentPage - 3 || page === currentPage + 3) {
                  return <span key={page} className="px-2 py-2 text-gray-500">...</span>;
                }
                return null;
              })}
            </div>

            <Link
              href={`/admin/products?page=${currentPage + 1}${searchQuery ? `&search=${searchQuery}` : ""}`}
              className={`px-4 py-2 border rounded-lg font-semibold transition ${
                !hasNextPage
                  ? "border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
