"use server";

import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { 
  sanitizeString, 
  validatePhone, 
  sanitizeQuantity, 
  validateAddress 
} from "@/lib/validation";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

type PaymentMethod = "CASH_ON_DELIVERY" | "BKASH" | "NAGAD";

export async function createOrderFromProduct(input: {
  productId: string;
  quantity: number;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod;
  deliveryCharge: number;
  paymentPhone?: string;
  transactionId?: string;
}): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  try {
    // Rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`order:${ip}`);
    
    if (!rateLimit.allowed) {
      return { 
        ok: false, 
        error: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.` 
      };
    }

    // Sanitize and validate inputs
    const customerName = sanitizeString(input.customerName, 100);
    const phone = sanitizeString(input.phone, 20);
    const address = sanitizeString(input.address, 500);
    
    if (!customerName || customerName.length < 2) {
      return { ok: false, error: "Name must be at least 2 characters" };
    }
    
    if (!validatePhone(phone)) {
      return { ok: false, error: "Enter a valid phone number (e.g., 01XXXXXXXXX)" };
    }
    
    if (!validateAddress(address)) {
      return { ok: false, error: "Address must be between 10-500 characters" };
    }

    const quantity = sanitizeQuantity(input.quantity);
    const paymentMethod = input.paymentMethod || "CASH_ON_DELIVERY";
    const deliveryCharge = Math.max(0, Number(input.deliveryCharge) || 0);

    if (!input.productId) {
      return { ok: false, error: "Product ID is required" };
    }

    // Validate payment phone for bKash/Nagad
    if ((paymentMethod === "BKASH" || paymentMethod === "NAGAD") && !input.paymentPhone?.trim()) {
      return { ok: false, error: `Please enter your ${paymentMethod === "BKASH" ? "bKash" : "Nagad"} number` };
    }

    const product = await prisma.product.findUnique({
      where: { id: input.productId, isActive: true },
      select: {
        id: true,
        stock: true,
        price: true,
        discountPrice: true,
      },
    });

    if (!product) return { ok: false, error: "Product not found" };
    if (product.stock <= 0) return { ok: false, error: "Out of stock" };
    if (product.stock < quantity) return { ok: false, error: "Not enough stock" };

    const unitPrice = Number(product.discountPrice ?? product.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return { ok: false, error: "Invalid price" };
    }

    const subtotal = unitPrice * quantity;
    const totalAmount = subtotal + deliveryCharge;

    // Set payment status based on payment method
    const paymentStatus = paymentMethod === "CASH_ON_DELIVERY" ? "PENDING" : "PENDING";

    // Use transaction to ensure stock is decremented atomically
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: quantity } },
      });

      // Create order
      return await tx.order.create({
        data: {
          customerName,
          phone,
          address,
          deliveryCharge,
          totalAmount,
          status: "PENDING",
          paymentMethod,
          paymentStatus,
          paymentPhone: input.paymentPhone?.trim() || null,
          transactionId: input.transactionId?.trim() || null,
          items: {
            create: {
              productId: product.id,
              quantity,
              priceSnapshot: unitPrice,
            },
          },
        },
        select: { id: true },
      });
    });

    logger.info('Order created successfully', {
      orderId: order.id,
      productId: product.id,
      quantity,
      totalAmount,
      paymentMethod,
    }, 'createOrder');

    return { ok: true, orderId: order.id };
  } catch (err) {
    logger.error("Order creation error", err, 'createOrder');
    
    if (err instanceof Error) {
      if (err.message.includes("Unique constraint")) {
        return { ok: false, error: "Duplicate order detected" };
      }
      if (err.message.includes("Foreign key constraint")) {
        return { ok: false, error: "Product not found" };
      }
    }
    return { ok: false, error: "Order failed. Please try again." };
  }
}
