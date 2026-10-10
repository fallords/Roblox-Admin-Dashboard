import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authenticate, type RequestMeta } from "@/lib/auth/login";
import { LOGIN_RATE_LIMIT } from "@/lib/auth/rate-limit";
import { hashSessionToken } from "@/lib/auth/session";
import { createAdmin, createTestDatabase, TEST_PASSWORD, type TestDatabase } from "../support/db";

const meta: RequestMeta = { ipAddress: "203.0.113.10", ipTrusted: false, userAgent: "vitest" };

let t: TestDatabase;
beforeAll(() => {
  t = createTestDatabase();
});
afterAll(async () => {
  await t.cleanup();
});

describe("authenticate", () => {
  it("creates a session and audits a successful login", async () => {
    const admin = await createAdmin(t.db, { username: "login-ok" });
    const result = await authenticate(t.db, { username: "Login-OK", password: TEST_PASSWORD }, meta);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.admin.id).toBe(admin.id);

    // Only the hash of the token is stored.
    const session = await t.db.session.findUnique({ where: { id: hashSessionToken(result.token) } });
    expect(session?.adminUserId).toBe(admin.id);
    expect(await t.db.session.findUnique({ where: { id: result.token } })).toBeNull();

    const updated = await t.db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
    expect(updated.lastLoginAt).not.toBeNull();

    const audit = await t.db.auditLog.findFirst({ where: { action: "auth.login", actorAdminId: admin.id } });
    expect(audit?.result).toBe("SUCCESS");
  });

  it("returns the same generic failure for wrong password, unknown user and inactive user", async () => {
    await createAdmin(t.db, { username: "login-wrong" });
    await createAdmin(t.db, { username: "login-inactive", isActive: false });

    const wrong = await authenticate(t.db, { username: "login-wrong", password: "not-the-password" }, meta);
    const unknown = await authenticate(t.db, { username: "nobody-here", password: TEST_PASSWORD }, meta);
    const inactive = await authenticate(t.db, { username: "login-inactive", password: TEST_PASSWORD }, meta);

    for (const result of [wrong, unknown, inactive]) expect(result).toEqual({ ok: false, reason: "invalid_credentials" });

    const reasons = await t.db.auditLog.findMany({
      where: { action: "auth.login", targetId: { in: ["login-wrong", "nobody-here", "login-inactive"] } },
      select: { targetId: true, result: true, details: true },
    });
    expect(reasons.map((r) => [r.targetId, r.result, (r.details as { reason: string }).reason]).sort()).toEqual(
      [
        ["login-inactive", "FAILURE", "inactive_user"],
        ["login-wrong", "FAILURE", "wrong_password"],
        ["nobody-here", "FAILURE", "unknown_user"],
      ].sort(),
    );
    expect(await t.db.session.count({ where: { adminUser: { username: { in: ["login-wrong", "login-inactive"] } } } })).toBe(0);
  });

  it("rejects malformed input without touching credentials", async () => {
    const result = await authenticate(t.db, { username: "x", password: "p".repeat(1000) }, meta);
    expect(result).toEqual({ ok: false, reason: "invalid_input" });
    const nonString = await authenticate(t.db, { username: null, password: { evil: true } }, meta);
    expect(nonString).toEqual({ ok: false, reason: "invalid_input" });
  });

  it("throttles repeated failures per username, even with the correct password", async () => {
    await createAdmin(t.db, { username: "login-throttle" });
    const start = new Date("2026-10-10T10:00:00Z");

    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailuresPerUsername; i++) {
      const at = new Date(start.getTime() + i * 1000);
      const result = await authenticate(t.db, { username: "login-throttle", password: `wrong-${i}` }, meta, at);
      expect(result).toEqual({ ok: false, reason: "invalid_credentials" });
    }

    const blockedAt = new Date(start.getTime() + 10_000);
    const blocked = await authenticate(t.db, { username: "login-throttle", password: TEST_PASSWORD }, meta, blockedAt);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe("rate_limited");

    const denied = await t.db.auditLog.findFirst({ where: { action: "auth.login", targetId: "login-throttle", result: "DENIED" } });
    expect(denied).not.toBeNull();

    // After the window has passed the correct password works again.
    const later = new Date(start.getTime() + LOGIN_RATE_LIMIT.windowMs + 5_000);
    const ok = await authenticate(t.db, { username: "login-throttle", password: TEST_PASSWORD }, meta, later);
    expect(ok.ok).toBe(true);
  });

  it("does not let a spoofable IP bypass or trigger the per-IP limit", async () => {
    await createAdmin(t.db, { username: "login-ip" });
    const untrusted: RequestMeta = { ipAddress: "198.51.100.1", ipTrusted: false, userAgent: null };
    await authenticate(t.db, { username: "login-ip", password: "wrong-password" }, untrusted);
    const attempt = await t.db.loginAttempt.findFirst({ where: { username: "login-ip" } });
    expect(attempt?.ipAddress).toBeNull();
  });

  it("never writes the submitted password to the audit log", async () => {
    const secret = "S3cret-Submitted-Password!";
    await authenticate(t.db, { username: "login-ok", password: secret }, meta);
    const rows = await t.db.auditLog.findMany();
    expect(JSON.stringify(rows)).not.toContain(secret);
    expect(JSON.stringify(rows)).not.toContain(TEST_PASSWORD);
  });
});
