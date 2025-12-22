import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const COOKIE_NAME = "hf_admin_session";

type SessionPayload = {
  uid: string;
  role: "ADMIN" | "STAFF";
  iat: number;
  exp: number;
};

function getAuthSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  return secret;
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLen);

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmacSha256Base64Url(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return bytesToBase64Url(sig);
}

function parsePayload(encoded: string): SessionPayload | null {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(encoded));
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

async function validateAdminSession(req: NextRequest): Promise<SessionPayload | null> {
  const secret = getAuthSecret();
  if (!secret) return null;

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return null;

  const parts = cookie.split(".");
  if (parts.length !== 2) return null;

  const [encoded, sig] = parts;
  const expected = await hmacSha256Base64Url(encoded, secret);
  if (!constantTimeEqual(sig, expected)) return null;

  const payload = parsePayload(encoded);
  if (!payload) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) return null;
  if (payload.role !== "ADMIN" && payload.role !== "STAFF") return null;
  if (typeof payload.uid !== "string" || payload.uid.length === 0) return null;

  return payload;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Create response with security headers
  const response = pathname === "/admin/login" || !pathname.startsWith("/admin")
    ? NextResponse.next()
    : await (async () => {
        const session = await validateAdminSession(req);
        if (!session) {
          const url = req.nextUrl.clone();
          url.pathname = "/admin/login";
          return NextResponse.redirect(url);
        }
        return NextResponse.next();
      })();

  // Add security headers for production
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
