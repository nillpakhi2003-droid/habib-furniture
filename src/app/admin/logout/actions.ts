"use server";

import { clearAdminSession } from "../../../lib/auth/session";

export async function adminLogoutAction(): Promise<{ ok: true }> {
  await clearAdminSession();
  return { ok: true };
}
