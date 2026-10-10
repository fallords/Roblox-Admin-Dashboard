import { z } from "zod";
import type { AuditResult } from "@/generated/prisma/enums";
import type { Database } from "@/lib/database/client";

export const AUDIT_ACTIONS = [
  "auth.login",
  "auth.logout",
  "access.denied",
  "admin.create",
  "admin.update",
  "config.change",
  "config.publish",
  "reward.grant",
  "moderation.command",
  "event.change",
  "integration.error",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

const SENSITIVE_KEY = /pass(word)?|secret|token|api[-_]?key|authorization|cookie|session|credential|hash/i;
const MAX_DETAILS_BYTES = 8 * 1024;
const MAX_DEPTH = 5;

/**
 * Remove values whose keys look sensitive and cap nesting/size. This is a
 * safety net — callers should never pass secrets in the first place.
 */
export function redactDetails(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redactDetails(item, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : redactDetails(inner, depth + 1);
    }
    return out;
  }
  if (typeof value === "string") return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  return String(value);
}

const auditEntrySchema = z.object({
  action: z.enum(AUDIT_ACTIONS),
  result: z.enum(["SUCCESS", "FAILURE", "DENIED", "ERROR"]),
  actorAdminId: z.string().max(64).nullish(),
  actorUsername: z.string().max(64).nullish(),
  targetType: z.string().max(64).nullish(),
  targetId: z.string().max(128).nullish(),
  correlationId: z.string().max(128).nullish(),
  ipAddress: z.string().max(64).nullish(),
  details: z.record(z.string(), z.unknown()).nullish(),
});

export type AuditEntryInput = {
  action: AuditAction;
  result: AuditResult;
  actorAdminId?: string | null;
  actorUsername?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  details?: Record<string, unknown> | null;
};

/**
 * Append an audit record. There is intentionally no update or delete
 * function; the database also rejects UPDATE/DELETE on AuditLog via triggers.
 */
export async function writeAuditLog(db: Database, input: AuditEntryInput) {
  const entry = auditEntrySchema.parse(input);
  let details = entry.details ? (redactDetails(entry.details) as Record<string, unknown>) : undefined;
  if (details && Buffer.byteLength(JSON.stringify(details), "utf8") > MAX_DETAILS_BYTES) {
    details = { note: "details omitted: exceeded size limit" };
  }
  return db.auditLog.create({
    data: {
      action: entry.action,
      result: entry.result,
      actorAdminId: entry.actorAdminId ?? null,
      actorUsername: entry.actorUsername ?? null,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      correlationId: entry.correlationId ?? null,
      ipAddress: entry.ipAddress ?? null,
      // Prisma Json input does not accept plain `null`; omit instead.
      ...(details ? { details: details as object } : {}),
    },
  });
}

export async function listRecentAuditLogs(db: Database, limit = 20) {
  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
    select: {
      id: true,
      createdAt: true,
      actorUsername: true,
      action: true,
      targetType: true,
      targetId: true,
      result: true,
      correlationId: true,
    },
  });
}
