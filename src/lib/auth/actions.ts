"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/database";
import { getRequestMeta } from "@/lib/request";
import { LOGIN_PATH } from "./constants";
import { clearSessionCookie } from "./cookies";
import { getCurrentSession } from "./dal";
import { invalidateSession } from "./session";

export async function logoutAction(): Promise<void> {
  const session = await getCurrentSession();
  if (session) {
    const db = getDb();
    await invalidateSession(db, session.sessionId);
    await writeAuditLog(db, {
      action: "auth.logout",
      result: "SUCCESS",
      actorAdminId: session.admin.id,
      actorUsername: session.admin.username,
      ipAddress: getRequestMeta(await headers()).ipAddress,
    });
  }
  await clearSessionCookie();
  redirect(LOGIN_PATH);
}
