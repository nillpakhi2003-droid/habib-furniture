"use server";

import { prisma } from "../../../lib/prisma";
import { revalidatePath } from "next/cache";

const STATUSES = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"] as const;
type OrderStatus = (typeof STATUSES)[number];

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim().toUpperCase() as OrderStatus;

  if (!orderId || !STATUSES.includes(status)) {
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath("/admin/orders");
}

export async function createDemoOrderAction() {
  const product = await prisma.product.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, price: true, discountPrice: true },
  });

  if (!product) {
    return;
  }

  const amount = product.discountPrice ?? product.price;

  await prisma.order.create({
    data: {
      customerName: "Demo Customer",
      phone: "0123456789",
      address: "123 Demo Street, Dhaka",
      totalAmount: amount,
      items: {
        create: {
          productId: product.id,
          quantity: 1,
          priceSnapshot: amount,
        },
      },
    },
  });

  revalidatePath("/admin/orders");
}

export async function confirmOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          items: {
            select: {
              productId: true,
              quantity: true,
              product: { select: { stock: true } },
            },
          },
        },
      });

      if (!order) throw new Error("NOT_FOUND");
      if (order.status === "CONFIRMED") return;

      for (const item of order.items) {
        if (item.product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");
      }

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });
    });

    return { ok: true };
  } catch (err: any) {
    if (err?.message === "NOT_FOUND") return { ok: false, error: "Order not found" };
    if (err?.message === "INSUFFICIENT_STOCK") return { ok: false, error: "Insufficient stock" };
    return { ok: false, error: "Confirm failed" };
  }
}
