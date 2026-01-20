import { notFound, redirect } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import { EditProductForm } from "./EditProductForm";

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      price: true,
      discountPrice: true,
      stock: true,
      isActive: true,
      isFeatured: true,
      dimensions: true,
      images: {
        orderBy: { isPrimary: "desc" },
        select: { id: true, path: true, isPrimary: true },
      },
    },
  });

  return product;
}

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-gray-600">Update product details and save changes.</p>
      </div>

      <EditProductForm product={product} />
    </div>
  );
}
