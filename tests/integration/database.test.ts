import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ROOT } from "../support/paths";
import { createTestDatabase, type TestDatabase } from "../support/db";

let t: TestDatabase;
beforeAll(() => {
  t = createTestDatabase();
});
afterAll(async () => {
  await t.cleanup();
});

describe("database constraints", () => {
  it("enforces foreign keys", async () => {
    await expect(
      t.db.session.create({
        data: { id: "x".repeat(64), adminUserId: "missing-admin", expiresAt: new Date(), absoluteExpiresAt: new Date() },
      }),
    ).rejects.toThrow();
  });

  it("enforces unique Roblox UserIds", async () => {
    await t.db.player.create({ data: { robloxUserId: "-5000", source: "DEMO" } });
    await expect(t.db.player.create({ data: { robloxUserId: "-5000", source: "DEMO" } })).rejects.toThrow();
  });

  it("enforces unique command idempotency keys", async () => {
    const admin = await t.db.adminUser.create({
      data: { username: "cmd-owner", displayName: "Cmd", passwordHash: "x", role: "OWNER" },
    });
    const base = {
      type: "GRANT_REWARD" as const,
      targetUserId: "261",
      payload: { rewardKey: "coins", quantity: 1 },
      createdById: admin.id,
      expiresAt: new Date(Date.now() + 60_000),
    };
    await t.db.adminCommand.create({ data: { ...base, idempotencyKey: "same-key", correlationId: "c1" } });
    await expect(
      t.db.adminCommand.create({ data: { ...base, idempotencyKey: "same-key", correlationId: "c2" } }),
    ).rejects.toThrow();
  });
});

describe("DEMO seed", () => {
  it("is idempotent, marks everything DEMO and only uses negative player ids", async () => {
    const run = () =>
      execFileSync("npx", ["tsx", "prisma/seed.ts"], {
        cwd: ROOT,
        env: { ...process.env, DATABASE_URL: t.url, NODE_ENV: "development" },
        stdio: "pipe",
      });
    run();
    const firstCounts = await Promise.all([t.db.fish.count(), t.db.pet.count(), t.db.gameEvent.count()]);
    run();
    const secondCounts = await Promise.all([t.db.fish.count(), t.db.pet.count(), t.db.gameEvent.count()]);
    expect(secondCounts).toEqual(firstCounts);

    const players = await t.db.player.findMany({ where: { username: { startsWith: "demo_" } } });
    expect(players.length).toBe(12);
    for (const p of players) {
      expect(p.source).toBe("DEMO");
      expect(p.robloxUserId.startsWith("-")).toBe(true);
    }
    for (const model of [t.db.fish, t.db.fishingRod, t.db.pet, t.db.rarity, t.db.fishSkin, t.db.gameEvent] as const) {
      // @ts-expect-error -- delegates share the count signature
      expect(await model.count({ where: { source: { not: "DEMO" } } })).toBe(0);
    }
    expect(await t.db.adminUser.count()).toBe(1); // only the one created above; the seed creates none
  });

  it("refuses to run in production without an explicit override", () => {
    expect(() =>
      execFileSync("npx", ["tsx", "prisma/seed.ts"], {
        cwd: ROOT,
        env: { ...process.env, DATABASE_URL: t.url, NODE_ENV: "production", ALLOW_DEMO_SEED: "" },
        stdio: "pipe",
      }),
    ).toThrow();
  });
});
