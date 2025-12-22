"use client";

import { useCart } from "@/context/CartContext";

type WishlistButtonProps = {
  productId: string;
  productName: string;
  price: number;
  image: string;
  slug: string;
};

export function WishlistButton({ productId, productName, price, image, slug }: WishlistButtonProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const inWishlist = isInWishlist(productId);

  const handleToggle = () => {
    if (inWishlist) {
      removeFromWishlist(productId);
    } else {
      addToWishlist({ productId, productName, price, image, slug });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
        inWishlist
          ? "bg-red-100 text-red-600 border-2 border-red-600"
          : "bg-white text-gray-700 border-2 border-gray-300 hover:border-red-600 hover:text-red-600"
      }`}
    >
      <svg
        className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`}
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
      {inWishlist ? "In Wishlist" : "Add to Wishlist"}
    </button>
  );
}
