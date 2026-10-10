import { getEnv } from "@/lib/env";
import type { RequestMeta } from "@/lib/auth/login";

type HeaderReader = { get(name: string): string | null };

/**
 * Extract client metadata. X-Forwarded-For is only trusted when TRUST_PROXY is
 * enabled; otherwise it may have been supplied by the client and is recorded
 * as unverified information.
 */
export function getRequestMeta(headers: HeaderReader): RequestMeta {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim() || null;
  const ipAddress = first && /^[0-9a-fA-F:.]{2,45}$/.test(first) ? first : null;
  const userAgent = headers.get("user-agent")?.slice(0, 256) ?? null;
  return { ipAddress, ipTrusted: getEnv().TRUST_PROXY && ipAddress !== null, userAgent };
}
