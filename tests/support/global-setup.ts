import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { ROOT, TEMPLATE_DB, TMP_DIR } from "./paths";

/** Build one migrated template database; each test file works on its own copy. */
export default function setup() {
  mkdirSync(TMP_DIR, { recursive: true });
  for (const suffix of ["", "-journal", "-wal", "-shm"]) rmSync(`${TEMPLATE_DB}${suffix}`, { force: true });
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: `file:${TEMPLATE_DB}` },
    stdio: "pipe",
  });
}
