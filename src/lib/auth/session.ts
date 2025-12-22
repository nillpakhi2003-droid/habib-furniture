import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "hf_admin_session";
const SESSION_TTL_SECONDS = 60 * 60; // 1 hour

export type AdminSession = {
  uid: string;
  role: "ADMIN" | "STAFF";
  issuedAt: number;
  expiresAt: number;
};

type SessionPayload = {
  uid: string;
  role: "ADMIN" | "STAFF";
  iat: number;
  exp: number;
};

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set (>= 32 chars) to sign session cookies.",
    );
  }
  return secret;
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Buffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLen), "base64");
}

function sign(data: string, secret: string): string {
  const signature = crypto.createHmac("sha256", secret).update(data).digest();
  return base64UrlEncode(signature);
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function encodePayload(payload: SessionPayload): string {
  return base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
}

function decodePayload(encoded: string): SessionPayload | null {
  try {
    const raw = base64UrlDecode(encoded).toString("utf8");
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setAdminSession(input: {
  uid: string;
  role: "ADMIN" | "STAFF";
}): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    uid: input.uid,
    role: input.role,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const secret = getAuthSecret();
  const encoded = encodePayload(payload);
  const signature = sign(encoded, secret);
  const value = `${encoded}.${signature}`;

  (await cookies()).set({
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;

  const parts = cookie.value.split(".");
  if (parts.length !== 2) return null;

  const [encoded, sig] = parts;

  const secret = getAuthSecret();
  const expected = sign(encoded, secret);
  if (!safeEqual(sig, expected)) return null;

  const payload = decodePayload(encoded);
  if (!payload) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) return null;
  if (payload.role !== "ADMIN" && payload.role !== "STAFF") return null;
  if (typeof payload.uid !== "string" || payload.uid.length === 0) return null;

  return {
    uid: payload.uid,
    role: payload.role,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };
}
