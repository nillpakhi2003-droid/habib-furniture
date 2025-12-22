-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "description" TEXT;

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");
