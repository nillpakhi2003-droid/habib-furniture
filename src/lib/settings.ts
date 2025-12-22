"use server";

import { prisma } from "@/lib/prisma";

export async function getDeliverySettings() {
  const settings = await prisma.settings.findFirst();
  
  if (!settings) {
    return {
      deliveryChargeDhaka: 60,
      deliveryChargeOutside: 120,
      bkashNumber: "01XXXXXXXXX",
      nagadNumber: "01XXXXXXXXX",
      facebookPixelId: null,
    };
  }
  
  return {
    deliveryChargeDhaka: Number(settings.deliveryChargeDhaka),
    deliveryChargeOutside: Number(settings.deliveryChargeOutside),
    bkashNumber: settings.bkashNumber,
    nagadNumber: settings.nagadNumber,
    facebookPixelId: settings.facebookPixelId,
  };
}

export async function getFacebookPixelId() {
  const settings = await prisma.settings.findFirst();
  return settings?.facebookPixelId || null;
}
