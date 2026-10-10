import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine((value) => value.startsWith("file:"), "DATABASE_URL must be a SQLite file: URL"),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  ROBLOX_UNIVERSE_ID: z.preprocess(emptyToUndefined, z.string().regex(/^\d+$/).optional()),
  ROBLOX_OPEN_CLOUD_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Validated server environment. Parsed lazily so `next build` does not need a
 * database. Never import this from client components: it would not expose
 * secrets (Next.js only inlines NEXT_PUBLIC_* vars) but the values would be
 * undefined and the import is a design error.
 */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n- ${issues.join("\n- ")}`);
  }
  cached = parsed.data;
  return cached;
}

/** Test helper: forget the cached environment. */
export function resetEnvCache(): void {
  cached = undefined;
}
