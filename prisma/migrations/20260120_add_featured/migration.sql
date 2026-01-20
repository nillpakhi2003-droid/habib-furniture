-- Add isFeatured field to Product model
ALTER TABLE "Product" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Create index for featured products
CREATE INDEX "Product_isFeatured_idx" ON "Product"("isFeatured");
