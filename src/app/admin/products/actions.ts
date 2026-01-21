"use server";

import { prisma } from "../../../lib/prisma";

type Result<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function createProductAction(input: {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  price: number;
  discountPrice?: number | null;
  stock?: number;
  dimensions?: unknown;
  isActive?: boolean;
  isFeatured?: boolean;
  imagePaths?: string[];
}): Promise<Result<{ id: string }>> {
  try {
    const price = Number(input.price);
    const discountPrice =
      input.discountPrice !== undefined && input.discountPrice !== null
        ? Number(input.discountPrice)
        : null;
    const stock = input.stock !== undefined ? Math.max(0, Number(input.stock)) : 0;

    if (!input.name?.trim() || !input.slug?.trim()) {
      return { ok: false, error: "Invalid name or slug" };
    }
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, error: "Invalid price" };
    }
    if (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice <= 0)) {
      return { ok: false, error: "Invalid discountPrice" };
    }

    const product = await prisma.product.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        description: input.description?.trim() || null,
        category: input.category?.trim() || null,
        price,
        discountPrice,
        stock,
        dimensions: input.dimensions ?? undefined,
        isActive: input.isActive ?? true,
        isFeatured: input.isFeatured ?? false,
        images: input.imagePaths && input.imagePaths.length > 0 ? {
          create: input.imagePaths.map((path, index) => ({
            path,
            isPrimary: index === 0,
          })),
        } : undefined,
      },
      select: { id: true },
    });

    return { ok: true, data: product };
  } catch (err) {
    console.error("Create product error:", err);
    if ((err as any).code === 'P2002') {
      return { ok: false, error: "A product with this slug (name) already exists." };
    }
    return { ok: false, error: "Create failed" };
  }
}

export async function updateProductAction(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string | null;
    category?: string | null;
    price?: number;
    discountPrice?: number | null;
    dimensions?: unknown;
    isFeatured?: boolean;
  },
): Promise<Result> {
  try {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.slug !== undefined) data.slug = input.slug.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.category !== undefined) data.category = input.category?.trim() || null;
    if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
    if (input.price !== undefined) {
      const price = Number(input.price);
      if (!Number.isFinite(price) || price <= 0) return { ok: false, error: "Invalid price" };
      data.price = price;
    }
    if (input.discountPrice !== undefined) {
      if (input.discountPrice === null) {
        data.discountPrice = null;
      } else {
        const dp = Number(input.discountPrice);
        if (!Number.isFinite(dp) || dp <= 0) return { ok: false, error: "Invalid discountPrice" };
        data.discountPrice = dp;
      }
    }
    if (input.dimensions !== undefined) data.dimensions = input.dimensions;

    await prisma.product.update({
      where: { id },
      data,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Update failed" };
  }
}

export async function toggleProductActiveAction(
  id: string,
): Promise<Result<{ isActive: boolean }>> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!product) return { ok: false, error: "Not found" };

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      select: { isActive: true },
    });

    return { ok: true, data: { isActive: updated.isActive } };
  } catch {
    return { ok: false, error: "Toggle failed" };
  }
}

export async function updateStockAction(
  id: string,
  delta: number,
): Promise<Result<{ stock: number }>> {
  try {
    if (!Number.isFinite(delta)) return { ok: false, error: "Invalid delta" };

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({
        where: { id },
        select: { stock: true },
      });
      if (!current) throw new Error("Not found");

      const nextStock = Math.max(0, current.stock + Math.trunc(delta));
      const saved = await tx.product.update({
        where: { id },
        data: { stock: nextStock },
        select: { stock: true },
      });
      return saved;
    });

    return { ok: true, data: { stock: updated.stock } };
  } catch (err: any) {
    if (err?.message === "Not found") return { ok: false, error: "Not found" };
    return { ok: false, error: "Stock update failed" };
  }
}

export async function toggleProductFeaturedAction(
  id: string,
): Promise<Result<{ isFeatured: boolean }>> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { isFeatured: true },
    });
    if (!product) return { ok: false, error: "Not found" };

    const updated = await prisma.product.update({
      where: { id },
      data: { isFeatured: !product.isFeatured },
      select: { isFeatured: true },
    });

    return { ok: true, data: { isFeatured: updated.isFeatured } };
  } catch {
    return { ok: false, error: "Toggle featured failed" };
  }
}

export async function addProductImagesAction(
  productId: string,
  imagePaths: string[],
): Promise<Result> {
  try {
    if (!imagePaths || imagePaths.length === 0) {
      return { ok: false, error: "No images provided" };
    }

    // Check if product has any existing images
    const existingImages = await prisma.image.count({
      where: { productId },
    });

    // Create new images
    await prisma.image.createMany({
      data: imagePaths.map((path, index) => ({
        productId,
        path,
        isPrimary: existingImages === 0 && index === 0, // First image is primary if no existing images
      })),
    });

    return { ok: true };
  } catch (err) {
    console.error("Add images error:", err);
    return { ok: false, error: "Failed to add images" };
  }
}

export async function deleteProductImageAction(
  imageId: string,
): Promise<Result> {
  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { isPrimary: true, productId: true },
    });

    if (!image) return { ok: false, error: "Image not found" };

    await prisma.image.delete({
      where: { id: imageId },
    });

    // If deleted image was primary, set another image as primary
    if (image.isPrimary) {
      const nextImage = await prisma.image.findFirst({
        where: { productId: image.productId },
        orderBy: { id: "asc" },
      });

      if (nextImage) {
        await prisma.image.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return { ok: true };
  } catch (err) {
    console.error("Delete image error:", err);
    return { ok: false, error: "Failed to delete image" };
  }
}

export async function setPrimaryImageAction(
  imageId: string,
): Promise<Result> {
  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { productId: true },
    });

    if (!image) return { ok: false, error: "Image not found" };

    // Remove primary from all images of this product
    await prisma.image.updateMany({
      where: { productId: image.productId },
      data: { isPrimary: false },
    });

    // Set this image as primary
    await prisma.image.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    return { ok: true };
  } catch (err) {
    console.error("Set primary image error:", err);
    return { ok: false, error: "Failed to set primary image" };
  }
}
