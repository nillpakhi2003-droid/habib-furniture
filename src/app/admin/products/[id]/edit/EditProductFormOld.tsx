"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProductAction } from "../../actions";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  price: number;
  discountPrice: number | null;
  stock: number;
  isActive: boolean;
  dimensions: unknown;
  images: Array<{
    id: string;
    path: string;
    isPrimary: boolean;
  }>;
};

export function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-6 bg-white border rounded-xl p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const price = Number(formData.get("price") || 0);
          const discountPriceRaw = formData.get("discountPrice") as string | null;
          const discountPrice = discountPriceRaw ? Number(discountPriceRaw) : null;

          const result = await updateProductAction(product.id, {
            name: formData.get("name") as string,
            slug: formData.get("slug") as string,
            description: (formData.get("description") as string) || null,
            category: (formData.get("category") as string) || null,
            price,
            discountPrice,
          });

          if (result.ok) {
            alert("Product updated successfully!");
            router.push("/admin/products");
            router.refresh();
          } else {
            alert(result.error || "Failed to update product");
          }
        });
      }}
    >
      {/* Product Images */}
      {product.images.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Current Images
          </label>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
              >
                <Image
                  src={image.path}
                  alt="Product"
                  fill
                  className="object-cover"
                />
                {image.isPrimary && (
                  <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Image management coming soon. For now, delete and re-create to change images.
          </p>
        </div>
      )}

      {/* Product Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
          Product Name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={product.name}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="e.g., Modern Sofa Set"
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label htmlFor="slug" className="block text-sm font-semibold text-gray-700">
          URL Slug <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          required
          defaultValue={product.slug}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="e.g., modern-sofa-set"
        />
        <p className="text-sm text-gray-500">
          Used in the product URL. Use lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product.description || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="Product description..."
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label htmlFor="category" className="block text-sm font-semibold text-gray-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={product.category || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Select a category</option>
          <option value="bedroom">Bedroom</option>
          <option value="living-room">Living Room</option>
          <option value="dining">Dining</option>
          <option value="office">Office</option>
          <option value="outdoor">Outdoor</option>
          <option value="storage">Storage</option>
        </select>
      </div>

      {/* Price & Discount */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm font-semibold text-gray-700">
            Regular Price (৳) <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            id="price"
            name="price"
            required
            min="0"
            step="0.01"
            defaultValue={product.price}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="e.g., 25000"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="discountPrice" className="block text-sm font-semibold text-gray-700">
            Discount Price (৳)
          </label>
          <input
            type="number"
            id="discountPrice"
            name="discountPrice"
            min="0"
            step="0.01"
            defaultValue={product.discountPrice || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="e.g., 20000"
          />
          <p className="text-sm text-gray-500">Leave empty if no discount</p>
        </div>
      </div>

      {/* Current Stock Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900">
          Current Stock: <span className="text-lg">{product.stock}</span> units
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Stock management is handled separately. Use the stock adjustment feature on the products list page.
        </p>
      </div>

      {/* Status Info */}
      <div className={`border rounded-lg p-4 ${product.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <p className="text-sm font-semibold">
          Status: <span className={product.isActive ? 'text-green-700' : 'text-gray-700'}>
            {product.isActive ? 'Active' : 'Inactive'}
          </span>
        </p>
        <p className="text-xs mt-1 text-gray-600">
          Use the Enable/Disable button on the products list page to change status.
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
