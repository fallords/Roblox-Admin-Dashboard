import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_REFRESH_INTERVAL_MS,
} from "@/lib/auth/constants";
import {
  createSession,
  deleteExpiredSessions,
  generateSessionToken,
  invalidateAllSessions,
  invalidateSession,
  validateSessionToken,
} from "@/lib/auth/session";
import { createAdmin, createTestDatabase, type TestDatabase } from "../support/db";

let t: TestDatabase;
beforeAll(() => {
  t = createTestDatabase();
});
afterAll(async () => {
  await t.cleanup();
});

const t0 = new Date("2026-10-10T08:00:00Z");
const at = (ms: number) => new Date(t0.getTime() + ms);

describe("sessions", () => {
  it("validates a fresh session and returns only safe admin fields", async () => {
    const admin = await createAdmin(t.db, { role: "MODERATOR" });
    const { token } = await createSession(t.db, admin.id, {}, t0);
    const session = await validateSessionToken(t.db, token, at(1000));
    expect(session?.admin).toEqual({ id: admin.id, username: admin.username, displayName: "Test Admin", role: "MODERATOR" });
    expect(JSON.stringify(session)).not.toContain("argon2");
  });

  it("rejects unknown and malformed tokens", async () => {
    expect(await validateSessionToken(t.db, generateSessionToken(), t0)).toBeNull();
    expect(await validateSessionToken(t.db, "short", t0)).toBeNull();
    expect(await validateSessionToken(t.db, "' OR 1=1 --".padEnd(43, "x"), t0)).toBeNull();
  });

  it("expires after the idle timeout and deletes the session", async () => {
    const admin = await createAdmin(t.db);
    const { token, sessionId } = await createSession(t.db, admin.id, {}, t0);
    expect(await validateSessionToken(t.db, token, at(SESSION_IDLE_TIMEOUT_MS + 1))).toBeNull();
    expect(await t.db.session.findUnique({ where: { id: sessionId } })).toBeNull();
  });

  it("slides the idle expiry on activity but never past the absolute limit", async () => {
    const admin = await createAdmin(t.db);
    const { token } = await createSession(t.db, admin.id, {}, t0);

    let now = t0.getTime();
    // Keep the session active every hour.
    while (now + 60 * 60 * 1000 < t0.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS) {
      now += 60 * 60 * 1000;
      const session = await validateSessionToken(t.db, token, new Date(now));
      expect(session).not.toBeNull();
      expect(session!.expiresAt.getTime()).toBeLessThanOrEqual(t0.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS);
    }
    expect(await validateSessionToken(t.db, token, at(SESSION_ABSOLUTE_TIMEOUT_MS))).toBeNull();
  });

  it("only writes activity updates after the refresh interval", async () => {
    const admin = await createAdmin(t.db);
    const { token, sessionId } = await createSession(t.db, admin.id, {}, t0);
    await validateSessionToken(t.db, token, at(SESSION_REFRESH_INTERVAL_MS - 1));
    expect((await t.db.session.findUniqueOrThrow({ where: { id: sessionId } })).lastSeenAt).toEqual(t0);
    await validateSessionToken(t.db, token, at(SESSION_REFRESH_INTERVAL_MS));
    expect((await t.db.session.findUniqueOrThrow({ where: { id: sessionId } })).lastSeenAt).toEqual(at(SESSION_REFRESH_INTERVAL_MS));
  });

  it("is revoked when the admin is deactivated", async () => {
    const admin = await createAdmin(t.db);
    const { token } = await createSession(t.db, admin.id, {}, t0);
    await t.db.adminUser.update({ where: { id: admin.id }, data: { isActive: false } });
    expect(await validateSessionToken(t.db, token, at(1000))).toBeNull();
  });

  it("is revoked when the password changes after the session was created", async () => {
    const admin = await createAdmin(t.db);
    const { token } = await createSession(t.db, admin.id, {}, t0);
    await t.db.adminUser.update({ where: { id: admin.id }, data: { passwordChangedAt: at(500) } });
    expect(await validateSessionToken(t.db, token, at(1000))).toBeNull();
  });

  it("supports single and bulk revocation", async () => {
    const admin = await createAdmin(t.db);
    const a = await createSession(t.db, admin.id, {}, t0);
    const b = await createSession(t.db, admin.id, {}, t0);
    const c = await createSession(t.db, admin.id, {}, t0);
    await invalidateSession(t.db, a.sessionId);
    expect(await validateSessionToken(t.db, a.token, at(1))).toBeNull();
    expect(await invalidateAllSessions(t.db, admin.id)).toBe(2);
    expect(await validateSessionToken(t.db, b.token, at(1))).toBeNull();
    expect(await validateSessionToken(t.db, c.token, at(1))).toBeNull();
  });

  it("cleans up expired sessions", async () => {
    const admin = await createAdmin(t.db);
    await createSession(t.db, admin.id, {}, t0);
    expect(await deleteExpiredSessions(t.db, at(SESSION_ABSOLUTE_TIMEOUT_MS + 1))).toBeGreaterThanOrEqual(1);
  });
});
