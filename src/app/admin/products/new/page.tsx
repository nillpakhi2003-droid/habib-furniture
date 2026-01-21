"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProductAction } from "../actions";
import { uploadMultipleImages } from "../upload";
import Image from "next/image";

export default function NewProductPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 20) {
      alert("Maximum 20 images allowed");
      return;
    }

    // Validate file sizes only (allow all image formats)
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

    setImages((prev) => [...prev, ...validFiles]);

    // Create preview URLs
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const newPreviews = [...previewUrls];
    
    [newImages[0], newImages[index]] = [newImages[index], newImages[0]];
    [newPreviews[0], newPreviews[index]] = [newPreviews[index], newPreviews[0]];
    
    setImages(newImages);
    setPreviewUrls(newPreviews);
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Add Product</h1>
        <p className="text-gray-600">Create a new product and save it to the catalog.</p>
      </div>

      <form
        className="space-y-6 bg-white border rounded-xl p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            setUploading(true);

            // Upload images first
            let imagePaths: string[] = [];
            if (images.length > 0) {
              const uploadFormData = new FormData();
              images.forEach((image) => {
                uploadFormData.append("files", image);
              });

              const uploadResult = await uploadMultipleImages(uploadFormData);
              if (!uploadResult.ok) {
                alert(uploadResult.error);
                setUploading(false);
                return;
              }
              imagePaths = uploadResult.paths;
            }

            const price = Number(formData.get("price") || 0);
            const discountPriceRaw = formData.get("discountPrice") as string | null;
            const discountPrice = discountPriceRaw ? Number(discountPriceRaw) : null;
            const stock = Number(formData.get("stock") || 0);
            const isActive = formData.get("isActive") === "on";
            const isFeatured = formData.get("isFeatured") === "on";
            const dimensionsRaw = formData.get("dimensions") as string | null;
            let dimensions: unknown = undefined;
            if (dimensionsRaw) {
              try {
                dimensions = JSON.parse(dimensionsRaw);
              } catch {
                // ignore parse error; backend will reject if invalid
              }
            }

            const res = await createProductAction({
              name: String(formData.get("name") || ""),
              slug: String(formData.get("slug") || ""),
              description: String(formData.get("description") || ""),
              category: String(formData.get("category") || ""),
              price,
              discountPrice,
              stock,
              dimensions,
              isActive,
              isFeatured,
              imagePaths,
            });

            setUploading(false);

            if (res.ok) {
              router.push("/admin/products");
              router.refresh();
            } else {
              alert(res.error || "Failed to create product");
            }
          });
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              name="name"
              required
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. Modern Bed"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Slug</span>
            <input
              name="slug"
              required
              className="w-full border rounded-lg px-3 py-2"
              placeholder="modern-bed"
            />
          </label>
        </div>

        <label className="space-y-2 block">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            name="description"
            rows={4}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter product description..."
          />
        </label>

        {/* Image Upload Section */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Product Images (Max 10)</span>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg px-6 py-4 text-center transition"
              >
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 16m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-600">Click to upload images</span>
                <span className="block text-xs text-gray-400 mt-1">JPG, PNG, WEBP, GIF (max 5MB each)</span>
              </label>
            </div>
          </label>

          {/* Image Previews */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                        title="Set as primary"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Category</span>
            <select
              name="category"
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select Category</option>
              <option value="bedroom">Bedroom</option>
              <option value="living">Living Room</option>
              <option value="dining">Dining</option>
              <option value="office">Office</option>
              <option value="kitchen">Kitchen Cabinet</option>
              <option value="mattress">Mattress</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Price</span>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full border rounded-lg px-3 py-2"
              placeholder="20000"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Discount Price (optional)</span>
            <input
              name="discountPrice"
              type="number"
              step="0.01"
              min="0"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="18000"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Stock</span>
            <input
              name="stock"
              type="number"
              min="0"
              required
              className="w-full border rounded-lg px-3 py-2"
              placeholder="10"
            />
          </label>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
            <span className="text-sm text-gray-700 font-medium">Active (visible to customers)</span>
          </label>

          <label className="flex items-center gap-2">
            <input name="isFeatured" type="checkbox" className="h-4 w-4" />
            <span className="text-sm text-gray-700 font-medium">Featured (show on homepage)</span>
          </label>
        </div>

        <label className="space-y-2 block">
          <span className="text-sm font-medium text-gray-700">Dimensions (JSON)</span>
          <textarea
            name="dimensions"
            rows={3}
            className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
            placeholder='{"width": 200, "height": 100, "depth": 50}'
          />
        </label>

        <button
          type="submit"
          disabled={pending || uploading}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
        >
          {uploading ? "Uploading images..." : pending ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
