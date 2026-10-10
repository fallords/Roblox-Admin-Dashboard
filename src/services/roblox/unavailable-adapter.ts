import type {
  IntegrationErrorCode,
  IntegrationHealth,
  IntegrationResult,
  RobloxIntegration,
} from "./types";

/**
 * Adapter used until a real integration is implemented and tested. Every
 * operation fails explicitly — it never pretends that a command was delivered.
 */
export class UnavailableRobloxAdapter implements RobloxIntegration {
  constructor(private readonly reason: Extract<IntegrationErrorCode, "NOT_CONFIGURED" | "NOT_IMPLEMENTED">) {}

  async getHealth(): Promise<IntegrationHealth> {
    return {
      status: this.reason === "NOT_CONFIGURED" ? "not_configured" : "configured_unverified",
      summary:
        this.reason === "NOT_CONFIGURED"
          ? "Roblox integration is not configured. No data is exchanged with live game servers."
          : "Roblox credentials are present, but the integration has not been implemented or verified yet. No data is exchanged with live game servers.",
      lastSuccessfulSyncAt: null,
      checkedAt: new Date(),
    };
  }

  private fail<T>(): Promise<IntegrationResult<T>> {
    return Promise.resolve({
      ok: false,
      error: {
        code: this.reason,
        message:
          this.reason === "NOT_CONFIGURED"
            ? "Roblox integration is not configured."
            : "This Roblox operation is not implemented yet.",
      },
    });
  }

  // Typed from the interface so callers see the real signatures.
  getPlayerStats: RobloxIntegration["getPlayerStats"] = () => this.fail();
  submitCommand: RobloxIntegration["submitCommand"] = () => this.fail();
  getCommandResult: RobloxIntegration["getCommandResult"] = () => this.fail();
  publishConfig: RobloxIntegration["publishConfig"] = () => this.fail();
}
