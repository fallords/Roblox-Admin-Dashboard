// Shared by proxy.ts and server code. Keep this file free of imports so it can be
// loaded anywhere on the server without pulling in the database.

const isProduction = process.env.NODE_ENV === "production";

/**
 * `__Host-` prefix (production) forces Secure, Path=/ and no Domain, so the
 * cookie cannot be set or overridden by a subdomain.
 */
export const SESSION_COOKIE_NAME = isProduction ? "__Host-ba_session" : "ba_session";
export const SESSION_COOKIE_SECURE = isProduction;

/** Sliding inactivity timeout. */
export const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
/** Hard maximum lifetime of a session. */
export const SESSION_ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
/** Avoid a database write on every request: refresh activity at most this often. */
export const SESSION_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const LOGIN_PATH = "/login";
export const DEFAULT_AFTER_LOGIN_PATH = "/dashboard";

/** Paths that require an authenticated administrator. */
export const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/players",
  "/inventory",
  "/fishing",
  "/pets",
  "/events",
  "/analytics",
  "/audit-logs",
  "/settings",
  "/forbidden",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Validate a post-login redirect target. Only same-site admin paths are
 * allowed, which prevents open redirects such as `//evil.example` or
 * `/\evil.example`.
 */
export function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string" || value.length > 512) return DEFAULT_AFTER_LOGIN_PATH;
  if (!/^\/[a-zA-Z0-9\-._~/?=&%]*$/.test(value) || value.startsWith("//")) {
    return DEFAULT_AFTER_LOGIN_PATH;
  }
  const pathname = value.split("?")[0] ?? "";
  if (pathname === "/forbidden" || !isProtectedPath(pathname)) return DEFAULT_AFTER_LOGIN_PATH;
  return value;
}
