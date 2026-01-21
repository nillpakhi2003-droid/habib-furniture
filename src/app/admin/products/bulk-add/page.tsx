'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadMultipleImages } from '../upload';
import { createProductAction } from '../actions';

interface ProductData {
  image: File | null;
  imagePath: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  discountPrice: string;
  stock: string;
  isFeatured: boolean;
}

export default function BulkAddPage() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'edit'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      
      // Initialize product data for each file
      const initialProducts: ProductData[] = files.map(file => ({
        image: file,
        imagePath: '',
        name: '',
        slug: '',
        description: '',
        category: 'Bedroom',
        price: '',
        discountPrice: '',
        stock: '1',
        isFeatured: false,
      }));
      setProducts(initialProducts);
    }
  };

  // Upload all images first
  const uploadImages = async () => {
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const result = await uploadMultipleImages(formData);
      
      if (!result.ok) {
        alert('Failed to upload images: ' + result.error);
        setUploading(false);
        return;
      }

      // Update products with image paths
      setProducts(prev => prev.map((product, index) => ({
        ...product,
        imagePath: result.paths[index] || '',
      })));

      setStep('edit');
    } catch (error) {
      alert('Upload error: ' + error);
    } finally {
      setUploading(false);
    }
  };

  // Update current product
  const updateProduct = (field: keyof ProductData, value: string | boolean) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        [field]: value,
      };
      
      // Auto-generate slug from name
      if (field === 'name' && typeof value === 'string') {
        updated[currentIndex].slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      
      return updated;
    });
  };

  const currentProduct = products[currentIndex];

  // Navigation
  const goNext = () => {
    if (currentIndex < products.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Submit all products
  const submitAllProducts = async () => {
    // Validate all products
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.name || !p.slug || !p.price || !p.imagePath) {
        alert(`Product ${i + 1} is missing required fields (name, price)`);
        setCurrentIndex(i);
        return;
      }
    }

    setSubmitting(true);
    let successCount = 0;
    let failedCount = 0;

    for (const product of products) {
      try {
        const result = await createProductAction({
          name: product.name,
          slug: product.slug,
          description: product.description || undefined,
          category: product.category,
          price: parseFloat(product.price),
          discountPrice: product.discountPrice ? parseFloat(product.discountPrice) : null,
          stock: parseInt(product.stock) || 0,
          isFeatured: product.isFeatured,
          imagePaths: [product.imagePath],
        });

        if (result.ok) {
          successCount++;
        } else {
          failedCount++;
          console.error('Failed to create product:', product.name, result.error);
        }
      } catch (error) {
        failedCount++;
        console.error('Error creating product:', error);
      }
    }

    setSubmitting(false);
    alert(`✅ Created ${successCount} products\n${failedCount > 0 ? `❌ Failed: ${failedCount}` : ''}`);
    
    if (successCount > 0) {
      router.push('/admin/products');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Bulk Add Products</h1>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ✕ Cancel
          </button>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-4">Step 1: Upload Images</h2>
            <p className="text-gray-600 mb-6">
              Select multiple product images (max 500MB total). You'll add details for each one next.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="bulk-files"
              />
              <label htmlFor="bulk-files" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    Click to select images
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, WEBP up to 10MB each, 500MB total
                  </p>
                </div>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-medium text-gray-900">
                    {selectedFiles.length} images selected
                  </p>
                  <p className="text-sm text-gray-500">
                    Total: {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>

                <div className="grid grid-cols-6 gap-2 mb-6">
                  {selectedFiles.slice(0, 18).map((file, idx) => (
                    <div key={idx} className="aspect-square rounded overflow-hidden bg-gray-100">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {selectedFiles.length > 18 && (
                    <div className="aspect-square rounded bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                      +{selectedFiles.length - 18}
                    </div>
                  )}
                </div>

                <button
                  onClick={uploadImages}
                  disabled={uploading}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Images →`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Edit Step */}
        {step === 'edit' && currentProduct && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Product {currentIndex + 1} of {products.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentIndex + 1) / products.length) * 100)}% complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / products.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Product Form */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {currentProduct.imagePath ? (
                      <img
                        src={currentProduct.imagePath}
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={currentProduct.name}
                      onChange={(e) => updateProduct('name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., Wooden Bed Frame"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (auto-generated)
                    </label>
                    <input
                      type="text"
                      value={currentProduct.slug}
                      onChange={(e) => updateProduct('slug', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                      placeholder="wooden-bed-frame"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={currentProduct.category}
                      onChange={(e) => updateProduct('category', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    >
                      <option value="Bedroom">Bedroom</option>
                      <option value="Living">Living Room</option>
                      <option value="Dining">Dining</option>
                      <option value="Office">Office</option>
                      <option value="Outdoor">Outdoor</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (৳) *
                      </label>
                      <input
                        type="number"
                        value={currentProduct.price}
                        onChange={(e) => updateProduct('price', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        placeholder="20000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Price (৳)
                      </label>
                      <input
                        type="number"
                        value={currentProduct.discountPrice}
                        onChange={(e) => updateProduct('discountPrice', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        placeholder="18000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={currentProduct.stock}
                      onChange={(e) => updateProduct('stock', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={currentProduct.description}
                      onChange={(e) => updateProduct('description', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Product details..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentProduct.isFeatured}
                      onChange={(e) => updateProduct('isFeatured', e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Featured Product
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={goPrevious}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <div className="flex gap-2">
                {products.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'bg-red-600 w-8'
                        : products[idx].name && products[idx].price
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {currentIndex === products.length - 1 ? (
                <button
                  onClick={submitAllProducts}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                >
                  {submitting ? 'Creating Products...' : `✓ Submit All ${products.length} Products`}
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
