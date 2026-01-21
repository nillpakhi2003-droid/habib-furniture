'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadMultipleImages } from '../upload';
import { createProductAction } from '../actions';

export default function BulkAddPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [completed, setCompleted] = useState(false);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload images and auto-create products
  const uploadAndCreateProducts = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select images first');
      return;
    }

    setUploading(true);
    setProgress({ current: 0, total: selectedFiles.length });

    try {
      let successCount = 0;
      let failedCount = 0;

      // Process one file at a time to avoid any timeout issues
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        try {
          // Upload single image
          const formData = new FormData();
          formData.append('files', file);

          const uploadResult = await uploadMultipleImages(formData);
          
          if (!uploadResult.ok || uploadResult.paths.length === 0) {
            console.error('Upload failed for:', file.name, uploadResult.error);
            failedCount++;
            setProgress({ current: i + 1, total: selectedFiles.length });
            continue; // Skip to next file
          }

          const imagePath = uploadResult.paths[0];
          
          // Generate product name from filename
          const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
          const productName = fileName
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
          
          const slug = fileName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          // Create product
          const result = await createProductAction({
            name: productName,
            slug: `${slug}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            description: '',
            category: 'Bedroom',
            price: 1000,
            discountPrice: null,
            stock: 1,
            isFeatured: false,
            imagePaths: [imagePath],
          });

          if (result.ok) {
            successCount++;
          } else {
            failedCount++;
            console.error('Failed to create product:', productName, result.error);
          }
        } catch (error) {
          failedCount++;
          console.error('Error processing file:', file.name, error);
        }

        setProgress({ current: i + 1, total: selectedFiles.length });
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setCompleted(true);
      alert(`✅ Created ${successCount} products!\n${failedCount > 0 ? `❌ Failed: ${failedCount}` : ''}\n\nYou can now edit each product from the Products page.`);
      
      setTimeout(() => {
        router.push('/admin/products');
      }, 2000);

    } catch (error) {
      alert('Error: ' + error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Bulk Add Products</h1>
            <p className="text-gray-600 mt-1">Upload images to create products, then edit them individually</p>
          </div>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ✕ Cancel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {!completed ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Select Product Images</h2>
              <p className="text-gray-600 mb-6">
                Each image will create a separate product with default settings. You can edit each product after creation.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="bulk-files"
                  disabled={uploading}
                />
                <label htmlFor="bulk-files" className={uploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
                  <div className="flex flex-col items-center">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      Click to select images
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, WEBP up to 10MB each • Max 100 images (500MB total)
                    </p>
                  </div>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-medium text-gray-900">
                      {selectedFiles.length} images selected
                    </p>
                    <p className="text-sm text-gray-500">
                      Total: {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>

                  <div className="grid grid-cols-8 gap-3 mb-6 max-h-96 overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <div className="aspect-square rounded overflow-hidden bg-gray-100">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {!uploading && (
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                          >
                            ×
                          </button>
                        )}
                        <p className="text-xs mt-1 truncate" title={file.name}>{file.name}</p>
                      </div>
                    ))}
                  </div>

                  {uploading && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Creating products... {progress.current} of {progress.total}
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round((progress.current / progress.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-red-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={uploadAndCreateProducts}
                    disabled={uploading}
                    className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
                  >
                    {uploading 
                      ? `Creating ${progress.current}/${progress.total} products...` 
                      : `Create ${selectedFiles.length} Products`
                    }
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Products Created!</h2>
              <p className="text-gray-600 mb-6">
                Redirecting to products page where you can edit each one...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
