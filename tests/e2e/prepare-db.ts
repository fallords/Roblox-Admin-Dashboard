/** Creates a fresh database for the e2e run: migrations, DEMO seed, two admins. */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { OWNER, VIEWER } from "./credentials";

const url = process.env.DATABASE_URL ?? "file:./.tmp/e2e.db";
const file = url.replace(/^file:/, "");
mkdirSync(".tmp", { recursive: true });
for (const suffix of ["", "-journal", "-wal", "-shm"]) rmSync(`${file}${suffix}`, { force: true });

const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: url, NODE_ENV: "development" };
const run = (args: string[], extra: Record<string, string> = {}) =>
  execFileSync("npx", args, { env: { ...env, ...extra }, stdio: "inherit" });

run(["prisma", "migrate", "deploy"]);
run(["tsx", "prisma/seed.ts"]);
run(["tsx", "scripts/admin.ts", "create", "--username", OWNER.username, "--role", "OWNER"], { ADMIN_PASSWORD: OWNER.password });
run(["tsx", "scripts/admin.ts", "create", "--username", VIEWER.username, "--role", "VIEWER"], { ADMIN_PASSWORD: VIEWER.password });
