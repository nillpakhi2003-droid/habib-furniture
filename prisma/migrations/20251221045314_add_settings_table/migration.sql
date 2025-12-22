-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "deliveryChargeDhaka" DECIMAL(10,2) NOT NULL DEFAULT 60,
    "deliveryChargeOutside" DECIMAL(10,2) NOT NULL DEFAULT 120,
    "bkashNumber" TEXT NOT NULL DEFAULT '01XXXXXXXXX',
    "nagadNumber" TEXT NOT NULL DEFAULT '01XXXXXXXXX',

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
