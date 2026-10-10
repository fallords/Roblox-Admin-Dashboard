import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Resolve a `file:` URL to an absolute path so the app, Prisma CLI, seed and
 * scripts always open the same database file regardless of bundling.
 */
export function resolveSqliteUrl(url: string): string {
  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL must start with file:");
  }
  const target = url.slice("file:".length);
  if (target === ":memory:") return url;
  // Runtime config path: exclude from build-time file tracing.
  return `file:${path.resolve(/*turbopackIgnore: true*/ process.cwd(), target)}`;
}

/**
 * Create a Prisma client. Provider-specific wiring lives only here, so moving
 * to another database later means changing this file and the schema provider.
 */
export function createPrismaClient(databaseUrl: string) {
  const adapter = new PrismaBetterSqlite3({ url: resolveSqliteUrl(databaseUrl) });
  return new PrismaClient({ adapter });
}

export type Database = ReturnType<typeof createPrismaClient>;
