import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_SECURE } from "./constants";

export async function readSessionCookie(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Only callable from Server Actions / Route Handlers (Next.js forbids cookie writes during render). */
export async function setSessionCookie(token: string, absoluteExpiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    // The browser may keep the cookie until the hard cap; the server enforces
    // the shorter idle timeout on every request.
    expires: absoluteExpiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
