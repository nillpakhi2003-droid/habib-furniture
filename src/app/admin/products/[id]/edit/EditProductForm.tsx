"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateProductAction, deleteProductImageAction, setPrimaryImageAction, addProductImagesAction } from "../../actions";
import { uploadMultipleImages } from "../../upload";

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
  isFeatured?: boolean;
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
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(Date.now()); // Key to force input reset
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file sizes (allow all image formats)
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setNewImages((prev) => [...prev, ...validFiles]);

    // Create preview URLs
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;
    
    setDeletingImage(imageId);
    const result = await deleteProductImageAction(imageId);
    setDeletingImage(null);

    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error || "Failed to delete image");
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    const result = await setPrimaryImageAction(imageId);
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error || "Failed to set primary image");
    }
  };

  const handleUploadNewImages = async () => {
    if (newImages.length === 0) return;

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      newImages.forEach((image) => {
        uploadFormData.append("files", image);
      });

      const uploadResult = await uploadMultipleImages(uploadFormData);
      if (!uploadResult.ok) {
        alert(`Upload failed: ${uploadResult.error}`);
        setUploading(false);
        return;
      }

      const addResult = await addProductImagesAction(product.id, uploadResult.paths);
      
      if (addResult.ok) {
        alert(`✅ Successfully uploaded ${uploadResult.paths.length} image(s)!`);
        setNewImages([]);
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        
        // Reset file input so user can select files again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setInputKey(Date.now()); // Force input re-render
        
        router.refresh();
      } else {
        alert(`Failed to save images: ${addResult.error || "Unknown error"}`);
      }
    } catch (error) {
      alert(`Upload error: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Image Management Section */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-bold">Product Images</h2>

        {/* Current Images */}
        {product.images.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Current Images
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group"
                >
                  <img
                    src={image.path}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
                      Primary
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                        title="Set as primary"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={deletingImage === image.id}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition disabled:opacity-50"
                      title="Delete image"
                    >
                      {deletingImage === image.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Images */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Add New Images
          </label>
          <input
            key={inputKey}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500">
            Supports: JPG, PNG, WEBP, GIF, SVG, AVIF and all image formats. Max 10MB per file, up to 20 images at once.
          </p>

          {/* Preview New Images */}
          {newImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {previewUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-green-300 group"
                >
                  <img
                    src={url}
                    alt="New image"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    New
                  </div>                    New
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {newImages.length > 0 && (
            <button
              type="button"
              onClick={handleUploadNewImages}
              disabled={uploading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : `Upload ${newImages.length} image(s)`}
            </button>
          )}
        </div>
      </div>

      {/* Product Details Form */}
      <form
        className="space-y-6 bg-white border rounded-xl p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            try {
              const price = Number(formData.get("price") || 0);
              const discountPriceRaw = formData.get("discountPrice") as string | null;
              const discountPrice = discountPriceRaw ? Number(discountPriceRaw) : null;
              const isFeatured = formData.get("isFeatured") === "on";

              const result = await updateProductAction(product.id, {
                name: formData.get("name") as string,
                slug: formData.get("slug") as string,
                description: (formData.get("description") as string) || null,
                category: (formData.get("category") as string) || null,
                price,
                discountPrice,
                isFeatured,
              });

              if (result.ok) {
                alert("✅ Product updated successfully!");
                router.push("/admin/products");
                router.refresh();
              } else {
                alert(`Failed to update product: ${result.error || "Unknown error"}`);
              }
            } catch (error) {
              console.error("Product update error:", error);
              alert(`Network error: ${error instanceof Error ? error.message : "Unable to connect to server"}`);
            }
          });
        }}
      >
        <h2 className="text-xl font-bold">Product Details</h2>

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

        {/* Featured Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            defaultChecked={product.isFeatured || false}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
            Featured Product (show on homepage)
          </label>
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
    </div>
  );
}
