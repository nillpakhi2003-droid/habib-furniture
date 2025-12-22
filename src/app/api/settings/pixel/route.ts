import { NextResponse } from "next/server";
import { getFacebookPixelId } from "@/lib/settings";

export async function GET() {
  const pixelId = await getFacebookPixelId();
  return NextResponse.json({ pixelId });
}
