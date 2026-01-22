"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProductAction } from "./actions";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteProductAction(productId);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete product");
        setIsDeleting(false);
        setShowConfirm(false);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete product");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
        >
          {isDeleting ? "Deleting..." : "Confirm?"}
        </button>
        <button
          onClick={handleCancel}
          disabled={isDeleting}
          className="flex-1 px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
      title={`Delete ${productName}`}
    >
      Delete
    </button>
  );
}
