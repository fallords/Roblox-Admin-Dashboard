import { createHash, randomBytes } from "node:crypto";
import type { AdminRole } from "@/generated/prisma/enums";
import type { Database } from "@/lib/database/client";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_REFRESH_INTERVAL_MS,
} from "./constants";

/** 32 random bytes → 43 base64url characters. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type SessionAdmin = {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
};

export type ValidatedSession = {
  sessionId: string;
  expiresAt: Date;
  admin: SessionAdmin;
};

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is stored. The raw token lives exclusively in the cookie. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  db: Database,
  adminUserId: string,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
  now: Date = new Date(),
): Promise<{ token: string; sessionId: string; expiresAt: Date; absoluteExpiresAt: Date }> {
  const token = generateSessionToken();
  const sessionId = hashSessionToken(token);
  const absoluteExpiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS);
  const expiresAt = new Date(Math.min(now.getTime() + SESSION_IDLE_TIMEOUT_MS, absoluteExpiresAt.getTime()));
  await db.session.create({
    data: {
      id: sessionId,
      adminUserId,
      expiresAt,
      absoluteExpiresAt,
      lastSeenAt: now,
      createdAt: now,
      ipAddress: meta.ipAddress?.slice(0, 64) ?? null,
      userAgent: meta.userAgent?.slice(0, 256) ?? null,
    },
  });
  return { token, sessionId, expiresAt, absoluteExpiresAt };
}

/**
 * Validate a raw session token. Returns null (and deletes the session where
 * appropriate) when the token is unknown, expired, belongs to a deactivated
 * administrator, or predates the administrator's last password change.
 */
export async function validateSessionToken(
  db: Database,
  token: string,
  now: Date = new Date(),
): Promise<ValidatedSession | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const sessionId = hashSessionToken(token);
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      adminUser: {
        select: {
          id: true,
          username: true,
          displayName: true,
          role: true,
          isActive: true,
          passwordChangedAt: true,
        },
      },
    },
  });
  if (!session) return null;

  const { adminUser } = session;
  const expired =
    now.getTime() >= session.expiresAt.getTime() || now.getTime() >= session.absoluteExpiresAt.getTime();
  const revoked = !adminUser.isActive || session.createdAt.getTime() < adminUser.passwordChangedAt.getTime();
  if (expired || revoked) {
    await db.session.deleteMany({ where: { id: sessionId } });
    return null;
  }

  let expiresAt = session.expiresAt;
  if (now.getTime() - session.lastSeenAt.getTime() >= SESSION_REFRESH_INTERVAL_MS) {
    expiresAt = new Date(
      Math.min(now.getTime() + SESSION_IDLE_TIMEOUT_MS, session.absoluteExpiresAt.getTime()),
    );
    await db.session.update({ where: { id: sessionId }, data: { lastSeenAt: now, expiresAt } });
  }

  return {
    sessionId,
    expiresAt,
    admin: {
      id: adminUser.id,
      username: adminUser.username,
      displayName: adminUser.displayName,
      role: adminUser.role,
    },
  };
}

export async function invalidateSession(db: Database, sessionId: string): Promise<void> {
  await db.session.deleteMany({ where: { id: sessionId } });
}

/** Revoke every session of one administrator (e.g. after a suspected compromise). */
export async function invalidateAllSessions(db: Database, adminUserId: string): Promise<number> {
  const { count } = await db.session.deleteMany({ where: { adminUserId } });
  return count;
}

export async function deleteExpiredSessions(db: Database, now: Date = new Date()): Promise<number> {
  const { count } = await db.session.deleteMany({
    where: { OR: [{ expiresAt: { lte: now } }, { absoluteExpiresAt: { lte: now } }] },
  });
  return count;
}
