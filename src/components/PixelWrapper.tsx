import { getFacebookPixelId } from "@/lib/settings";
import { FacebookPixel } from "@/components/FacebookPixel";

export async function PixelWrapper() {
  const pixelId = await getFacebookPixelId();
  return <FacebookPixel pixelId={pixelId} />;
}
