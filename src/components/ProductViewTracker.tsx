"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq: any;
  }
}

export function ProductViewTracker({
  productId,
  productName,
  price,
  category,
}: {
  productId: string;
  productName: string;
  price: number;
  category: string | null;
}) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: productName,
        content_ids: [productId],
        content_type: "product",
        value: price,
        currency: "BDT",
        content_category: category || "furniture",
      });
    }
  }, [productId, productName, price, category]);

  return null;
}
