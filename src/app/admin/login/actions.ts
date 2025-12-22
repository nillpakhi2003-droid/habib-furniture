"use server";

import bcrypt from "bcryptjs";

import { prisma } from "../../../lib/prisma";
import { setAdminSession } from "../../../lib/auth/session";

type LoginResult =
  | { ok: true }
  | { ok: false; error: "INVALID_CREDENTIALS" | "NOT_ALLOWED" | "INVALID_INPUT" };

export async function adminLoginAction(formData: FormData): Promise<LoginResult> {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!phone || password.length < 8) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, role: true, passwordHash: true },
  });

  if (!user) {
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    return { ok: false, error: "NOT_ALLOWED" };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  await setAdminSession({ uid: user.id, role: user.role });
  return { ok: true };
}
