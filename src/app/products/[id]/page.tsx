import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getDeliverySettings } from "../../../lib/settings";
import { OrderForm } from "./OrderForm";
import { ProductViewTracker } from "../../../components/ProductViewTracker";
import { WishlistButton } from "../../../components/WishlistButton";

// Force dynamic rendering so product images update immediately after upload
export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatTaka(value: number | string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "৳0";
  return `৳${num.toLocaleString("en-BD")}`;
}

async function getProduct(id: string) {
  return await prisma.product.findUnique({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      price: true,
      discountPrice: true,
      stock: true,
      dimensions: true,
      images: {
        orderBy: { isPrimary: "desc" },
        select: { id: true, path: true, isPrimary: true },
      },
      variants: {
        select: { id: true, color: true, material: true },
      },
    },
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const settings = await getDeliverySettings();
  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductViewTracker
        productId={product.id}
        productName={product.name}
        price={Number(displayPrice)}
        category={product.category}
      />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
              {product.images[0]?.path ? (
                <img
                  src={product.images[0].path}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1, 5).map((image) => (
                  <div
                    key={image.id}
                    className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm cursor-pointer hover:opacity-80 transition"
                  >
                    <img
                      src={image.path}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              {product.category && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full capitalize mb-3">
                  {product.category}
                </span>
              )}
              <div className="mt-2">
                {isOutOfStock ? (
                  <span className="inline-block px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg">
                    Out of Stock
                  </span>
                ) : product.stock < 5 ? (
                  <span className="inline-block px-4 py-2 bg-orange-100 text-orange-700 font-semibold rounded-lg">
                    Only {product.stock} left
                  </span>
                ) : (
                  <span className="inline-block px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-lg">
                    In Stock
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <div className="py-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="border-t border-b py-6">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-gray-900">
                  {formatTaka(displayPrice.toString())}
                </span>
                {hasDiscount && (
                  <span className="text-2xl text-gray-400 line-through">
                    {formatTaka(product.price.toString())}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <p className="mt-2 text-red-600 font-semibold">
                  Save {formatTaka(Number(product.price) - Number(product.discountPrice!))}
                </p>
              )}
            </div>

            {product.variants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Available Options
                </h3>
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                    >
                      <span className="text-gray-700">
                        {variant.color} - {variant.material}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <WishlistButton
                productId={product.id}
                productName={product.name}
                price={Number(displayPrice)}
                image={product.images[0]?.path || ""}
                slug={product.slug}
              />
            </div>

            <OrderForm
              productId={product.id}
              stock={product.stock}
              unitPrice={Number(displayPrice)}
              priceDisplay={formatTaka(displayPrice.toString())}
              settings={settings}
            />

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Specifications
              </h3>
              <table className="w-full">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-3 text-sm font-semibold text-gray-700">
                      Product ID
                    </td>
                    <td className="py-3 text-sm text-gray-600">{product.id}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm font-semibold text-gray-700">
                      Availability
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {product.stock} units
                    </td>
                  </tr>
                  {product.dimensions && (
                    <tr>
                      <td className="py-3 text-sm font-semibold text-gray-700">
                        Dimensions
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {JSON.stringify(product.dimensions)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
