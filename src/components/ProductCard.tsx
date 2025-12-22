"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    price: number;
    discountPrice: number | null;
    images: { path: string }[];
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const inWishlist = isInWishlist(product.id);
  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const imageSrc = product.images[0]?.path || "/placeholder-product.svg";

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      productName: product.name,
      price: displayPrice,
      image: imageSrc,
      slug: product.slug,
    });
  };

  const handleToggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        productId: product.id,
        productName: product.name,
        price: displayPrice,
        image: imageSrc,
        slug: product.slug,
      });
    }
  };

  // Check if image is external or local
  const isExternalImage = imageSrc.startsWith('http://') || imageSrc.startsWith('https://');

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Link href={`/products/${product.slug}`}>
          {isExternalImage ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              unoptimized
            />
          ) : (
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          )}
        </Link>
        
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {Math.round(((product.price - displayPrice) / product.price) * 100)}% OFF
          </div>
        )}
        
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 bg-white p-2.5 rounded-full shadow-lg hover:bg-red-50 transition-all"
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg 
            className={`w-5 h-5 transition-colors ${inWishlist ? 'text-red-600 fill-current' : 'text-gray-600'}`} 
            fill={inWishlist ? "currentColor" : "none"} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
        </button>

        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleAddToCart}
            className="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add to Cart
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded uppercase">
            {product.category || "Uncategorized"}
          </span>
        </div>

        <Link href={`/products/${product.slug}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-red-600 transition">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold text-red-600">
            ৳{displayPrice.toLocaleString("en-BD")}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ৳{product.price.toLocaleString("en-BD")}
            </span>
          )}
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="block w-full text-center border-2 border-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:border-red-600 hover:text-red-600 transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
