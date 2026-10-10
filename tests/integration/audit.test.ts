import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listRecentAuditLogs, writeAuditLog, type AuditAction } from "@/lib/audit";
import { createAdmin, createTestDatabase, type TestDatabase } from "../support/db";

let t: TestDatabase;
beforeAll(() => {
  t = createTestDatabase();
});
afterAll(async () => {
  await t.cleanup();
});

describe("audit log", () => {
  it("records actor, target, result and correlation id", async () => {
    const admin = await createAdmin(t.db);
    const row = await writeAuditLog(t.db, {
      action: "reward.grant",
      result: "DENIED",
      actorAdminId: admin.id,
      actorUsername: admin.username,
      targetType: "player",
      targetId: "261",
      correlationId: "corr-abc",
      details: { rewardKey: "coins", quantity: 50 },
    });
    expect(row).toMatchObject({ action: "reward.grant", result: "DENIED", targetId: "261", correlationId: "corr-abc" });
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it("redacts secrets in details before storing", async () => {
    const row = await writeAuditLog(t.db, {
      action: "integration.error",
      result: "ERROR",
      details: { apiKey: "rbx-live-key", message: "timeout" },
    });
    expect(row.details).toEqual({ apiKey: "[redacted]", message: "timeout" });
  });

  it("rejects unknown actions", async () => {
    await expect(
      writeAuditLog(t.db, { action: "lua.execute" as AuditAction, result: "SUCCESS" }),
    ).rejects.toThrow();
  });

  it("is append-only: updates and deletes are rejected by the database", async () => {
    const row = await writeAuditLog(t.db, { action: "auth.logout", result: "SUCCESS" });
    await expect(t.db.auditLog.update({ where: { id: row.id }, data: { result: "FAILURE" } })).rejects.toThrow(/append-only/);
    await expect(t.db.auditLog.delete({ where: { id: row.id } })).rejects.toThrow(/append-only/);
    await expect(t.db.auditLog.deleteMany({})).rejects.toThrow(/append-only/);
    await expect(t.db.$executeRawUnsafe(`DELETE FROM "AuditLog"`)).rejects.toThrow(/append-only/);
    expect((await t.db.auditLog.findUniqueOrThrow({ where: { id: row.id } })).result).toBe("SUCCESS");
  });

  it("lists newest first with a bounded page size", async () => {
    const rows = await listRecentAuditLogs(t.db, 1000);
    expect(rows.length).toBeLessThanOrEqual(100);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.createdAt.getTime()).toBeGreaterThanOrEqual(rows[i]!.createdAt.getTime());
    }
  });
});
