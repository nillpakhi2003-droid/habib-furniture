import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const path = String(body.path || "/");
    const referer = body.referer ? String(body.referer) : null;

    const userAgent = request.headers.get("user-agent") || null;
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;

    await prisma.pageView.create({
      data: {
        path,
        userAgent,
        referer,
        ip,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
