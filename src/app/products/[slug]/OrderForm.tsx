"use client";

import { useMemo, useState, useTransition } from "react";
import { createOrderFromProduct } from "../actions";

type Props = {
  productId: string;
  stock: number;
  unitPrice: number;
  priceDisplay: string;
  settings: {
    deliveryChargeDhaka: number;
    deliveryChargeOutside: number;
    bkashNumber: string;
    nagadNumber: string;
  };
};

type PaymentMethod = "CASH_ON_DELIVERY" | "BKASH" | "NAGAD";

function formatTaka(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

export function OrderForm({ productId, stock, unitPrice, priceDisplay, settings }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [deliveryArea, setDeliveryArea] = useState<"INSIDE_DHAKA" | "OUTSIDE_DHAKA">("INSIDE_DHAKA");

  const deliveryCharge = deliveryArea === "INSIDE_DHAKA" ? settings.deliveryChargeDhaka : settings.deliveryChargeOutside;
  const subtotal = unitPrice * quantity;
  const totalWithDelivery = subtotal + deliveryCharge;

  const subtotalDisplay = useMemo(() => formatTaka(subtotal), [subtotal]);
  const totalDisplay = useMemo(() => formatTaka(totalWithDelivery), [totalWithDelivery]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerName = String(formData.get("customerName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const quantityVal = Number(formData.get("quantity") || 1);
    const paymentPhone = String(formData.get("paymentPhone") || "").trim();
    const transactionId = String(formData.get("transactionId") || "").trim();

    setMessage(null);
    setError(null);

    // Validate payment phone for bKash/Nagad
    if ((paymentMethod === "BKASH" || paymentMethod === "NAGAD") && !paymentPhone) {
      setError(`আপনার ${paymentMethod === "BKASH" ? "বিকাশ" : "নগদ"} নম্বর দিন`);
      return;
    }

    // Track InitiateCheckout event
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout", {
        content_ids: [productId],
        content_type: "product",
        value: totalWithDelivery,
        currency: "BDT",
        num_items: quantityVal,
      });
    }

    startTransition(async () => {
      try {
        const res = await createOrderFromProduct({
          productId,
          quantity: quantityVal,
          customerName,
          phone,
          address,
          paymentMethod,
          deliveryCharge,
          paymentPhone: paymentPhone || undefined,
          transactionId: transactionId || undefined,
        });

        if (res.ok) {
          // Track Purchase/Lead event
          if (typeof window !== "undefined" && (window as any).fbq) {
            (window as any).fbq("track", "Purchase", {
              content_ids: [productId],
              content_type: "product",
              value: totalWithDelivery,
              currency: "BDT",
            });
            
            // Also track as Lead for better optimization
            (window as any).fbq("track", "Lead", {
              content_name: "Order Placed",
              value: totalWithDelivery,
              currency: "BDT",
            });
          }
          setMessage(
            `অর্ডার সফল! আপনার অর্ডার আইডি ${res.orderId}। আমরা কনফার্ম করতে কল করব।`,
          );
          (e.target as HTMLFormElement).reset();
          setQuantity(1);
          setPaymentMethod("CASH_ON_DELIVERY");
          setDeliveryArea("INSIDE_DHAKA");
        } else {
          setError(res.error || "অর্ডার দিতে পারিনি। আবার চেষ্টা করুন।");
        }
      } catch (err) {
        console.error("Order error:", err);
        setError("অর্ডার বিফল। আবার চেষ্টা করুন।");
      }
    });
  };

  return (
    <div className="space-y-3 bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 text-sm text-gray-700">
        <p>ঘরে বসে পান—COD, বিকাশ বা নগদ পেমেন্ট।</p>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">সম্পূর্ণ বাংলাদেশে</span>
      </div>
      <form
        className="space-y-3"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700">আপনার নাম</span>
            <input
              name="customerName"
              required
              className="w-full border rounded-md px-3 py-2"
              placeholder="যেমন: রহিম"
              disabled={pending || stock === 0}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700">ফোন নম্বর</span>
            <input
              name="phone"
              required
              className="w-full border rounded-md px-3 py-2"
              placeholder="01XXXXXXXXX"
              disabled={pending || stock === 0}
            />
          </label>
        </div>

        <label className="space-y-1 text-sm block">
          <span className="font-medium text-gray-700">ডেলিভারি ঠিকানা</span>
          <textarea
            name="address"
            required
            rows={2}
            className="w-full border rounded-md px-3 py-2"
            placeholder="বাসা, রোড, এলাকা, শহর"
            disabled={pending || stock === 0}
          />
        </label>

        <label className="space-y-1 text-sm block">
          <span className="font-medium text-gray-700">ডেলিভারি এলাকা</span>
          <select
            value={deliveryArea}
            onChange={(e) => setDeliveryArea(e.target.value as "INSIDE_DHAKA" | "OUTSIDE_DHAKA")}
            className="w-full border rounded-md px-3 py-2"
            disabled={pending || stock === 0}
          >
            <option value="INSIDE_DHAKA">ঢাকার ভিতরে (৳{settings.deliveryChargeDhaka})</option>
            <option value="OUTSIDE_DHAKA">ঢাকার বাইরে (৳{settings.deliveryChargeOutside})</option>
          </select>
        </label>

        <label className="space-y-1 text-sm block">
          <span className="font-medium text-gray-700">পেমেন্ট পদ্ধতি</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full border rounded-md px-3 py-2"
            disabled={pending || stock === 0}
          >
            <option value="CASH_ON_DELIVERY">ক্যাশ অন ডেলিভারি (COD)</option>
            <option value="BKASH">বিকাশ (আগাম পেমেন্ট)</option>
            <option value="NAGAD">নগদ (আগাম পেমেন্ট)</option>
          </select>
        </label>

        {(paymentMethod === "BKASH" || paymentMethod === "NAGAD") && (
          <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900 font-medium">
              {paymentMethod === "BKASH" ? "বিকাশ" : "নগদ"} পেমেন্ট নির্দেশাবলী:
            </p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>টাকা পাঠান: <strong>{paymentMethod === "BKASH" ? settings.bkashNumber : settings.nagadNumber}</strong></li>
              <li>অ্যামাউন্ট: <strong>{totalDisplay}</strong></li>
              <li>নিচে আপনার ট্রানজ্যাকশন আইডি এবং পেমেন্ট নম্বর দিন</li>
            </ol>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">
                  আপনার {paymentMethod === "BKASH" ? "বিকাশ" : "নগদ"} নম্বর *
                </span>
                <input
                  name="paymentPhone"
                  required
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="01XXXXXXXXX"
                  disabled={pending || stock === 0}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">ট্রানজ্যাকশন আইডি (আপশনাল)</span>
                <input
                  name="transactionId"
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="TXN12345..."
                  disabled={pending || stock === 0}
                />
              </label>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700">পরিমাণ</span>
            <input
              type="number"
              name="quantity"
              min={1}
              max={Math.max(1, stock)}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(stock, Number(e.target.value) || 1)))}
              className="w-full border rounded-md px-3 py-2"
              disabled={pending || stock === 0}
            />
          </label>
          <div className="space-y-1 text-sm border rounded-md px-3 py-2 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">একক দাম</span>
              <span className="font-semibold text-gray-900">{priceDisplay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">সাবটোটাল ({quantity}x)</span>
              <span className="font-semibold text-gray-900">{subtotalDisplay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">ডেলিভারি</span>
              <span className="font-semibold text-gray-900">{formatTaka(deliveryCharge)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-gray-900 font-bold">মোট</span>
              <span className="font-bold text-red-600 text-lg">{totalDisplay}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending || stock === 0}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
        >
          {stock === 0 ? "স্টক নেই" : pending ? "অর্ডার প্রক্রিয়াধীন..." : "অর্ডার করুন"}
        </button>

        {message && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">{message}</p>}
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
      </form>
    </div>
  );
}
