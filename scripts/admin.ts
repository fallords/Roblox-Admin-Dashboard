/**
 * Administrator account management (there is no public registration).
 *
 *   npm run admin -- create --username alice [--display-name "Alice"] [--role OWNER|ADMIN|MODERATOR|VIEWER]
 *   npm run admin -- reset-password --username alice
 *   npm run admin -- deactivate --username alice
 *   npm run admin -- activate --username alice
 *   npm run admin -- revoke-sessions --username alice
 *   npm run admin -- list
 *
 * Passwords are read from a hidden prompt. For non-interactive automation
 * (CI, tests) ADMIN_PASSWORD may be set instead — avoid it on shared machines.
 * Every change is written to the audit log with actor "cli".
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { createPrismaClient, type Database } from "../src/lib/database/client";
import { writeAuditLog } from "../src/lib/audit";
import { hashPassword } from "../src/lib/auth/password";
import { invalidateAllSessions } from "../src/lib/auth/session";
import { displayNameSchema, newPasswordSchema, usernameSchema } from "../src/lib/validation/auth";
import type { AdminRole } from "../src/generated/prisma/enums";

const ROLES: readonly AdminRole[] = ["OWNER", "ADMIN", "MODERATOR", "VIEWER"];
const CLI_ACTOR = "cli";

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function readHidden(question: string): Promise<string> {
  const stdin = process.stdin;
  if (!stdin.isTTY) fail("No interactive terminal. Set ADMIN_PASSWORD for non-interactive use.");
  return new Promise((resolve) => {
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function obtainPassword(): Promise<string> {
  const fromEnv = process.env.ADMIN_PASSWORD;
  const password = fromEnv ?? (await readHidden("New password (min 12 characters): "));
  const parsed = newPasswordSchema.safeParse(password);
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Invalid password.");
  if (fromEnv === undefined) {
    const confirm = await readHidden("Confirm password: ");
    if (confirm !== password) fail("Passwords do not match.");
  }
  return parsed.data;
}

function parseUsername(value: string | undefined): string {
  if (!value) fail("--username is required.");
  const parsed = usernameSchema.safeParse(value);
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Invalid username.");
  return parsed.data;
}

async function findAdmin(db: Database, username: string) {
  const admin = await db.adminUser.findUnique({ where: { username } });
  if (!admin) fail(`No administrator named "${username}".`);
  return admin;
}

async function create(db: Database, opts: { username?: string; "display-name"?: string; role?: string }) {
  const username = parseUsername(opts.username);
  if (await db.adminUser.findUnique({ where: { username } })) fail(`Administrator "${username}" already exists.`);

  const existingCount = await db.adminUser.count();
  let role: AdminRole;
  if (opts.role) {
    const upper = opts.role.toUpperCase() as AdminRole;
    if (!ROLES.includes(upper)) fail(`--role must be one of ${ROLES.join(", ")}.`);
    role = upper;
  } else {
    // The first account is the owner; later accounts default to least privilege.
    role = existingCount === 0 ? "OWNER" : "VIEWER";
  }

  const displayName = displayNameSchema.safeParse(opts["display-name"] ?? username);
  if (!displayName.success) fail("--display-name must be 1-64 characters.");

  const passwordHash = await hashPassword(await obtainPassword());
  const admin = await db.adminUser.create({
    data: { username, displayName: displayName.data, passwordHash, role },
  });
  await writeAuditLog(db, {
    action: "admin.create",
    result: "SUCCESS",
    actorUsername: CLI_ACTOR,
    targetType: "admin",
    targetId: username,
    details: { role, via: "cli" },
  });
  console.log(`Created ${role} administrator "${admin.username}".`);
}

async function resetPassword(db: Database, opts: { username?: string }) {
  const admin = await findAdmin(db, parseUsername(opts.username));
  const passwordHash = await hashPassword(await obtainPassword());
  // passwordChangedAt invalidates sessions created before now; delete them too.
  await db.adminUser.update({ where: { id: admin.id }, data: { passwordHash, passwordChangedAt: new Date() } });
  const revoked = await invalidateAllSessions(db, admin.id);
  await writeAuditLog(db, {
    action: "admin.update",
    result: "SUCCESS",
    actorUsername: CLI_ACTOR,
    targetType: "admin",
    targetId: admin.username,
    details: { change: "password_reset", sessionsRevoked: revoked, via: "cli" },
  });
  console.log(`Password reset for "${admin.username}". ${revoked} session(s) revoked.`);
}

async function setActive(db: Database, opts: { username?: string }, isActive: boolean) {
  const admin = await findAdmin(db, parseUsername(opts.username));
  if (!isActive && admin.role === "OWNER") {
    const owners = await db.adminUser.count({ where: { role: "OWNER", isActive: true } });
    if (owners <= 1) fail("Refusing to deactivate the last active OWNER.");
  }
  await db.adminUser.update({ where: { id: admin.id }, data: { isActive } });
  const revoked = isActive ? 0 : await invalidateAllSessions(db, admin.id);
  await writeAuditLog(db, {
    action: "admin.update",
    result: "SUCCESS",
    actorUsername: CLI_ACTOR,
    targetType: "admin",
    targetId: admin.username,
    details: { change: isActive ? "activated" : "deactivated", sessionsRevoked: revoked, via: "cli" },
  });
  console.log(`${isActive ? "Activated" : "Deactivated"} "${admin.username}".${isActive ? "" : ` ${revoked} session(s) revoked.`}`);
}

async function revokeSessions(db: Database, opts: { username?: string }) {
  const admin = await findAdmin(db, parseUsername(opts.username));
  const revoked = await invalidateAllSessions(db, admin.id);
  await writeAuditLog(db, {
    action: "admin.update",
    result: "SUCCESS",
    actorUsername: CLI_ACTOR,
    targetType: "admin",
    targetId: admin.username,
    details: { change: "sessions_revoked", sessionsRevoked: revoked, via: "cli" },
  });
  console.log(`Revoked ${revoked} session(s) for "${admin.username}".`);
}

async function list(db: Database) {
  const admins = await db.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { username: true, displayName: true, role: true, isActive: true, lastLoginAt: true },
  });
  if (admins.length === 0) {
    console.log("No administrators. Create one with: npm run admin:create -- --username <name>");
    return;
  }
  console.table(
    admins.map((a) => ({
      username: a.username,
      displayName: a.displayName,
      role: a.role,
      active: a.isActive,
      lastLoginUtc: a.lastLoginAt?.toISOString() ?? "never",
    })),
  );
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      username: { type: "string" },
      "display-name": { type: "string" },
      role: { type: "string" },
    },
  });
  const command = positionals[0];
  const url = process.env.DATABASE_URL;
  if (!url) fail("DATABASE_URL is not set. Copy .env.example to .env first.");

  const db = createPrismaClient(url);
  try {
    switch (command) {
      case "create":
        return await create(db, values);
      case "reset-password":
        return await resetPassword(db, values);
      case "deactivate":
        return await setActive(db, values, false);
      case "activate":
        return await setActive(db, values, true);
      case "revoke-sessions":
        return await revokeSessions(db, values);
      case "list":
        return await list(db);
      default:
        fail("Usage: npm run admin -- <create|reset-password|deactivate|activate|revoke-sessions|list> [--username name]");
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
