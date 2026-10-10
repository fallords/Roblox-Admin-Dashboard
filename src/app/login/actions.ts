"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth/constants";
import { setSessionCookie } from "@/lib/auth/cookies";
import { authenticate } from "@/lib/auth/login";
import { getDb } from "@/lib/database";
import { getRequestMeta } from "@/lib/request";

export type LoginFormState = {
  error: string | null;
  /** Echo the username (never the password) so the user does not retype it. */
  username: string;
};

export async function loginAction(_previous: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const username = formData.get("username");
  const password = formData.get("password");
  const echo = typeof username === "string" ? username.slice(0, 64) : "";

  const meta = getRequestMeta(await headers());
  const result = await authenticate(getDb(), { username, password }, meta);

  if (!result.ok) {
    if (result.reason === "rate_limited") {
      const minutes = Math.ceil(result.retryAfterSeconds / 60);
      return {
        error: `Too many failed sign-in attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
        username: echo,
      };
    }
    return { error: "Incorrect username or password.", username: echo };
  }

  await setSessionCookie(result.token, result.absoluteExpiresAt);
  redirect(safeRedirectPath(formData.get("next")));
}
