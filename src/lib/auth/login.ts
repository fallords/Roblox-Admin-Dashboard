import type { AdminRole } from "@/generated/prisma/enums";
import { writeAuditLog } from "@/lib/audit";
import type { Database } from "@/lib/database/client";
import { loginInputSchema } from "@/lib/validation/auth";
import { burnPasswordVerification, verifyPassword } from "./password";
import { checkLoginThrottle, recordLoginAttempt } from "./rate-limit";
import { createSession } from "./session";

export type RequestMeta = {
  /** Client IP as reported by headers; only trustworthy when ipTrusted. */
  ipAddress: string | null;
  ipTrusted: boolean;
  userAgent: string | null;
};

export type LoginResult =
  | {
      ok: true;
      token: string;
      expiresAt: Date;
      absoluteExpiresAt: Date;
      admin: { id: string; username: string; role: AdminRole };
    }
  | { ok: false; reason: "invalid_input" | "invalid_credentials" }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number };

/**
 * Authenticate an administrator and create a session.
 *
 * Every outcome is audited. Failure responses are deliberately identical for
 * unknown users, inactive users and wrong passwords.
 */
export async function authenticate(
  db: Database,
  rawInput: { username: unknown; password: unknown },
  meta: RequestMeta,
  now: Date = new Date(),
): Promise<LoginResult> {
  const parsed = loginInputSchema.safeParse(rawInput);
  // Only use the IP for throttling when it cannot be spoofed by the client.
  const throttleIp = meta.ipTrusted ? meta.ipAddress : null;
  const auditBase = { action: "auth.login" as const, ipAddress: meta.ipAddress };

  if (!parsed.success) {
    await writeAuditLog(db, { ...auditBase, result: "FAILURE", details: { reason: "invalid_input" } });
    return { ok: false, reason: "invalid_input" };
  }
  const { username, password } = parsed.data;

  const throttle = await checkLoginThrottle(db, { username, ipAddress: throttleIp }, now);
  if (!throttle.allowed) {
    await writeAuditLog(db, {
      ...auditBase,
      result: "DENIED",
      targetType: "admin",
      targetId: username,
      details: { reason: "rate_limited", retryAfterSeconds: throttle.retryAfterSeconds },
    });
    return { ok: false, reason: "rate_limited", retryAfterSeconds: throttle.retryAfterSeconds };
  }

  const admin = await db.adminUser.findUnique({
    where: { username },
    select: { id: true, username: true, role: true, isActive: true, passwordHash: true },
  });

  const passwordOk =
    admin && admin.isActive
      ? await verifyPassword(admin.passwordHash, password)
      : await burnPasswordVerification(password);

  if (!admin || !admin.isActive || !passwordOk) {
    await recordLoginAttempt(db, { username, ipAddress: throttleIp, success: false }, now);
    await writeAuditLog(db, {
      ...auditBase,
      result: "FAILURE",
      targetType: "admin",
      targetId: username,
      details: { reason: !admin ? "unknown_user" : !admin.isActive ? "inactive_user" : "wrong_password" },
    });
    return { ok: false, reason: "invalid_credentials" };
  }

  await recordLoginAttempt(db, { username, ipAddress: throttleIp, success: true }, now);
  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: now } });
  const session = await createSession(db, admin.id, meta, now);
  await writeAuditLog(db, {
    ...auditBase,
    result: "SUCCESS",
    actorAdminId: admin.id,
    actorUsername: admin.username,
    targetType: "admin",
    targetId: admin.username,
    details: { ipTrusted: meta.ipTrusted },
  });

  return {
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    absoluteExpiresAt: session.absoluteExpiresAt,
    admin: { id: admin.id, username: admin.username, role: admin.role },
  };
}
