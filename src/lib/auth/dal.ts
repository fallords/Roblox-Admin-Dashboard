import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/database";
import { hasPermission, type Permission } from "@/lib/permissions";
import { getRequestMeta } from "@/lib/request";
import { LOGIN_PATH } from "./constants";
import { readSessionCookie } from "./cookies";
import { validateSessionToken, type SessionAdmin, type ValidatedSession } from "./session";

/**
 * Data Access Layer entry point. Every protected page, Server Action and Route
 * Handler must call one of these functions itself — the proxy redirect and the
 * layout check are conveniences, not the security boundary.
 *
 * Memoized per request with React `cache`.
 */
export const getCurrentSession = cache(async (): Promise<ValidatedSession | null> => {
  const token = await readSessionCookie();
  if (!token) return null;
  return validateSessionToken(getDb(), token);
});

/** For pages/layouts: redirect to the login page when not authenticated. */
export async function requireAdmin(): Promise<SessionAdmin> {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);
  return session.admin;
}

/** For pages: authenticate, authorize, and audit denials. */
export async function requirePagePermission(permission: Permission): Promise<SessionAdmin> {
  const admin = await requireAdmin();
  if (!hasPermission(admin.role, permission)) {
    await auditDenied(admin, permission);
    redirect("/forbidden");
  }
  return admin;
}

/**
 * For Server Actions / Route Handlers: returns the admin or null, so callers
 * can respond with a structured error instead of a redirect.
 */
export async function authorizeAction(
  permission: Permission,
): Promise<{ ok: true; admin: SessionAdmin } | { ok: false; error: "unauthenticated" | "forbidden" }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "unauthenticated" };
  if (!hasPermission(session.admin.role, permission)) {
    await auditDenied(session.admin, permission);
    return { ok: false, error: "forbidden" };
  }
  return { ok: true, admin: session.admin };
}

async function auditDenied(admin: SessionAdmin, permission: Permission): Promise<void> {
  const meta = getRequestMeta(await headers());
  await writeAuditLog(getDb(), {
    action: "access.denied",
    result: "DENIED",
    actorAdminId: admin.id,
    actorUsername: admin.username,
    ipAddress: meta.ipAddress,
    details: { permission, role: admin.role },
  });
}
