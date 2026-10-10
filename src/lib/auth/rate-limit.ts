import type { Database } from "@/lib/database/client";

export const LOGIN_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  /** Primary control: cannot be bypassed by spoofing IP headers. */
  maxFailuresPerUsername: 5,
  /** Best effort: only meaningful when client IPs are trustworthy (TRUST_PROXY). */
  maxFailuresPerIp: 20,
  /** Attempts older than this are pruned. */
  retentionMs: 24 * 60 * 60 * 1000,
} as const;

export type LoginThrottle = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Decide whether a login attempt may proceed. Counts failures inside the
 * window; for the username limit, failures before the most recent successful
 * login are ignored.
 */
export async function checkLoginThrottle(
  db: Database,
  input: { username: string; ipAddress?: string | null },
  now: Date = new Date(),
): Promise<LoginThrottle> {
  const windowStart = new Date(now.getTime() - LOGIN_RATE_LIMIT.windowMs);

  const lastSuccess = await db.loginAttempt.findFirst({
    where: { username: input.username, success: true, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const usernameSince = lastSuccess && lastSuccess.createdAt > windowStart ? lastSuccess.createdAt : windowStart;

  const usernameFailures = await db.loginAttempt.findMany({
    where: { username: input.username, success: false, createdAt: { gt: usernameSince } },
    orderBy: { createdAt: "desc" },
    take: LOGIN_RATE_LIMIT.maxFailuresPerUsername,
    select: { createdAt: true },
  });
  if (usernameFailures.length >= LOGIN_RATE_LIMIT.maxFailuresPerUsername) {
    // Blocked until the oldest of the counted failures leaves the window.
    const oldest = usernameFailures[usernameFailures.length - 1]!.createdAt;
    return { allowed: false, retryAfterSeconds: retryAfter(oldest, now) };
  }

  if (input.ipAddress) {
    const ipFailures = await db.loginAttempt.findMany({
      where: { ipAddress: input.ipAddress, success: false, createdAt: { gt: windowStart } },
      orderBy: { createdAt: "desc" },
      take: LOGIN_RATE_LIMIT.maxFailuresPerIp,
      select: { createdAt: true },
    });
    if (ipFailures.length >= LOGIN_RATE_LIMIT.maxFailuresPerIp) {
      const oldest = ipFailures[ipFailures.length - 1]!.createdAt;
      return { allowed: false, retryAfterSeconds: retryAfter(oldest, now) };
    }
  }

  return { allowed: true };
}

function retryAfter(oldestFailure: Date, now: Date): number {
  const ms = oldestFailure.getTime() + LOGIN_RATE_LIMIT.windowMs - now.getTime();
  return Math.max(1, Math.ceil(ms / 1000));
}

export async function recordLoginAttempt(
  db: Database,
  input: { username: string; ipAddress?: string | null; success: boolean },
  now: Date = new Date(),
): Promise<void> {
  await db.loginAttempt.create({
    data: {
      username: input.username.slice(0, 64),
      ipAddress: input.ipAddress?.slice(0, 64) ?? null,
      success: input.success,
      createdAt: now,
    },
  });
  await db.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - LOGIN_RATE_LIMIT.retentionMs) } },
  });
}
