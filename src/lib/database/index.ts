import "server-only";
import { getEnv } from "@/lib/env";
import { createPrismaClient, type Database } from "./client";

export type { Database } from "./client";

const globalForDb = globalThis as unknown as { __beachAvenueDb?: Database };

/** Shared Prisma client for server code (reused across dev hot reloads). */
export function getDb(): Database {
  if (!globalForDb.__beachAvenueDb) {
    globalForDb.__beachAvenueDb = createPrismaClient(getEnv().DATABASE_URL);
  }
  return globalForDb.__beachAvenueDb;
}
