import path from "node:path";

export const ROOT = path.resolve(__dirname, "../..");
export const TMP_DIR = path.join(ROOT, ".tmp");
export const TEMPLATE_DB = path.join(TMP_DIR, "test-template.db");
