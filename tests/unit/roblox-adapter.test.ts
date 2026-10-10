import { afterEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "@/lib/env";
import { getRobloxIntegration } from "@/services/roblox";
import { UnavailableRobloxAdapter } from "@/services/roblox/unavailable-adapter";

const envelope = {
  command: { type: "GRANT_REWARD" as const, robloxUserId: "261", rewardKey: "coins", quantity: 100 },
  idempotencyKey: "key-1",
  correlationId: "corr-1",
  issuedByAdminId: "admin-1",
  expiresAt: new Date(Date.now() + 60_000),
};

describe("Roblox integration (Phase 1)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
  });

  it("never reports success for any operation", async () => {
    for (const reason of ["NOT_CONFIGURED", "NOT_IMPLEMENTED"] as const) {
      const adapter = new UnavailableRobloxAdapter(reason);
      const results = await Promise.all([
        adapter.getPlayerStats("261"),
        adapter.submitCommand(envelope),
        adapter.getCommandResult("corr-1"),
        adapter.publishConfig({ scope: "FISHING", version: 1, checksum: "abc", correlationId: "corr-2" }),
      ]);
      for (const result of results) {
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe(reason);
      }
    }
  });

  it("reports not_configured health when credentials are absent", async () => {
    vi.stubEnv("ROBLOX_UNIVERSE_ID", "");
    vi.stubEnv("ROBLOX_OPEN_CLOUD_API_KEY", "");
    resetEnvCache();
    const health = await getRobloxIntegration().getHealth();
    expect(health.status).toBe("not_configured");
    expect(health.lastSuccessfulSyncAt).toBeNull();
  });

  it("does not claim connectivity even when credentials are present", async () => {
    vi.stubEnv("ROBLOX_UNIVERSE_ID", "123456");
    vi.stubEnv("ROBLOX_OPEN_CLOUD_API_KEY", "test-key-not-real");
    resetEnvCache();
    const integration = getRobloxIntegration();
    const health = await integration.getHealth();
    expect(health.status).toBe("configured_unverified");
    expect(health.summary).not.toContain("test-key-not-real");
    const result = await integration.submitCommand(envelope);
    expect(result.ok).toBe(false);
  });
});
