"use client";

import { useCart } from "../../context/CartContext";
import Link from "next/link";
import Image from "next/image";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-6">Save your favorite products here</p>
          <Link
            href="/products"
            className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700 transition"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Wishlist</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div key={item.productId} className="bg-white rounded-lg shadow overflow-hidden group">
              <div className="relative aspect-square">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.productName}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => removeFromWishlist(item.productId)}
                  className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-red-50 transition"
                  title="Remove from wishlist"
                >
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <Link
                  href={`/products/${item.productId}`}
                  className="text-lg font-semibold text-gray-800 hover:text-red-600 block mb-2 line-clamp-2"
                >
                  {item.productName}
                </Link>
                <p className="text-xl font-bold text-red-600 mb-4">
                  ৳{item.price.toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      addToCart({
                        productId: item.productId,
                        productName: item.productName,
                        price: item.price,
                        image: item.image,
                        slug: item.slug,
                      });
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
                  >
                    Add to Cart
                  </button>
                  <Link
                    href={`/products/${item.productId}`}
                    className="flex-1 border-2 border-red-600 text-red-600 text-center px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
