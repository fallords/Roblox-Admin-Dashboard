import { randomUUID } from "node:crypto";
import { copyFileSync, rmSync } from "node:fs";
import path from "node:path";
import { createPrismaClient, type Database } from "@/lib/database/client";
import { hashPassword } from "@/lib/auth/password";
import type { AdminRole } from "@/generated/prisma/enums";
import { TEMPLATE_DB, TMP_DIR } from "./paths";

export type TestDatabase = { db: Database; url: string; file: string; cleanup: () => Promise<void> };

/** Fresh, fully migrated, isolated SQLite database for one test file. */
export function createTestDatabase(): TestDatabase {
  const file = path.join(TMP_DIR, `test-${randomUUID()}.db`);
  copyFileSync(TEMPLATE_DB, file);
  const url = `file:${file}`;
  const db = createPrismaClient(url);
  return {
    db,
    url,
    file,
    cleanup: async () => {
      await db.$disconnect();
      for (const suffix of ["", "-journal", "-wal", "-shm"]) rmSync(`${file}${suffix}`, { force: true });
    },
  };
}

export const TEST_PASSWORD = "a-very-long-test-password";

export async function createAdmin(
  db: Database,
  overrides: { username?: string; role?: AdminRole; isActive?: boolean; password?: string } = {},
) {
  return db.adminUser.create({
    data: {
      username: overrides.username ?? `admin-${randomUUID().slice(0, 8)}`,
      displayName: "Test Admin",
      passwordHash: await hashPassword(overrides.password ?? TEST_PASSWORD),
      role: overrides.role ?? "ADMIN",
      isActive: overrides.isActive ?? true,
      // Fixed past date so tests with injected clocks are not treated as
      // "session created before the last password change".
      passwordChangedAt: new Date("2026-01-01T00:00:00Z"),
    },
  });
}
