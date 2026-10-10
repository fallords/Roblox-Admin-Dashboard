import "server-only";
import { getEnv } from "@/lib/env";
import type { RobloxIntegration } from "./types";
import { UnavailableRobloxAdapter } from "./unavailable-adapter";

export type * from "./types";

/**
 * Select the Roblox integration adapter. Phase 1 has no live adapter, so this
 * always returns an adapter that refuses operations. Credentials are read here
 * on the server only and are never passed to the browser.
 */
export function getRobloxIntegration(): RobloxIntegration {
  const env = getEnv();
  const configured = Boolean(env.ROBLOX_UNIVERSE_ID && env.ROBLOX_OPEN_CLOUD_API_KEY);
  return new UnavailableRobloxAdapter(configured ? "NOT_IMPLEMENTED" : "NOT_CONFIGURED");
}
