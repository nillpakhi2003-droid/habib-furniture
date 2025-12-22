import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function getSettings() {
  let settings = await prisma.settings.findFirst();
  
  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        deliveryChargeDhaka: 60,
        deliveryChargeOutside: 120,
        bkashNumber: "01XXXXXXXXX",
        nagadNumber: "01XXXXXXXXX",
        facebookPixelId: null,
      },
    });
  }
  
  return settings;
}

async function updateSettingsAction(formData: FormData) {
  "use server";

  const deliveryChargeDhaka = Number(formData.get("deliveryChargeDhaka") || 60);
  const deliveryChargeOutside = Number(formData.get("deliveryChargeOutside") || 120);
  const bkashNumber = String(formData.get("bkashNumber") || "").trim();
  const nagadNumber = String(formData.get("nagadNumber") || "").trim();
  const facebookPixelId = String(formData.get("facebookPixelId") || "").trim() || null;

  const settings = await prisma.settings.findFirst();

  if (settings) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        deliveryChargeDhaka,
        deliveryChargeOutside,
        bkashNumber,
        nagadNumber,
        facebookPixelId,
      },
    });
  } else {
    await prisma.settings.create({
      data: {
        deliveryChargeDhaka,
        deliveryChargeOutside,
        bkashNumber,
        nagadNumber,
        facebookPixelId,
      },
    });
  }

  revalidatePath("/admin/settings");
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage delivery charges and payment numbers</p>
      </div>

      <form action={updateSettingsAction} className="bg-white border rounded-lg p-6 shadow-sm space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Delivery Charges</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Inside Dhaka (৳)</span>
              <input
                type="number"
                name="deliveryChargeDhaka"
                defaultValue={Number(settings.deliveryChargeDhaka)}
                min="0"
                step="1"
                required
                className="w-full border rounded-md px-3 py-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Outside Dhaka (৳)</span>
              <input
                type="number"
                name="deliveryChargeOutside"
                defaultValue={Number(settings.deliveryChargeOutside)}
                min="0"
                step="1"
                required
                className="w-full border rounded-md px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Payment Numbers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">bKash Number</span>
              <input
                type="text"
                name="bkashNumber"
                defaultValue={settings.bkashNumber}
                placeholder="01XXXXXXXXX"
                required
                className="w-full border rounded-md px-3 py-2"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Nagad Number</span>
              <input
                type="text"
                name="nagadNumber"
                defaultValue={settings.nagadNumber}
                placeholder="01XXXXXXXXX"
                required
                className="w-full border rounded-md px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Facebook Pixel</h2>
          <p className="text-sm text-gray-600">
            Add your Facebook Pixel ID to track conversions and optimize your ads.
            Find your Pixel ID in <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook Events Manager</a>.
          </p>
          
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Facebook Pixel ID</span>
            <input
              type="text"
              name="facebookPixelId"
              defaultValue={settings.facebookPixelId || ""}
              placeholder="1234567890123456"
              className="w-full border rounded-md px-3 py-2"
            />
            <p className="text-xs text-gray-500">
              Leave empty to disable pixel tracking. Events tracked: PageView, ViewContent, InitiateCheckout, Purchase, Lead
            </p>
          </label>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
