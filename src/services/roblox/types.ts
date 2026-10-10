/**
 * Contract between the dashboard and Beach Avenue! game servers.
 *
 * The website and the Roblox game are separate systems. Nothing in this
 * interface reaches a live server until an adapter implements a real,
 * independently tested delivery mechanism (see docs/roblox-integration.md).
 */

export type IntegrationErrorCode =
  /** Required configuration (universe id, API key, …) is missing. */
  | "NOT_CONFIGURED"
  /** Configuration exists but this operation has not been implemented yet. */
  | "NOT_IMPLEMENTED"
  /** The remote side rejected the request (4xx). */
  | "REJECTED"
  /** Network error, timeout or 5xx. Safe to retry with the same idempotency key. */
  | "UNAVAILABLE"
  /** Remote quota exhausted. */
  | "RATE_LIMITED";

export type IntegrationResult<T> =
  | { ok: true; data: T; correlationId: string }
  | { ok: false; error: { code: IntegrationErrorCode; message: string }; correlationId?: string };

export type IntegrationStatus =
  | "not_configured"
  | "configured_unverified"
  | "connected"
  | "degraded";

export type IntegrationHealth = {
  status: IntegrationStatus;
  /** Human-readable explanation suitable for the Settings page. */
  summary: string;
  /** Last time data was successfully read from or acknowledged by the game. */
  lastSuccessfulSyncAt: Date | null;
  checkedAt: Date;
};

export type LivePlayerStats = {
  robloxUserId: string;
  coins: number;
  xp: number;
  level: number;
};

/** Commands are a closed set. Arbitrary code execution is never supported. */
export type GameCommand =
  | { type: "GRANT_REWARD"; robloxUserId: string; rewardKey: string; quantity: number }
  | { type: "WARN_PLAYER"; robloxUserId: string; reason: string }
  | { type: "KICK_PLAYER"; robloxUserId: string; reason: string }
  | { type: "RESTRICT_PLAYER"; robloxUserId: string; reason: string; durationSeconds: number }
  | { type: "BAN_PLAYER"; robloxUserId: string; reason: string; durationSeconds: number | null }
  | { type: "UNBAN_PLAYER"; robloxUserId: string };

export type CommandEnvelope = {
  command: GameCommand;
  /** Prevents duplicate execution (e.g. double reward grants). */
  idempotencyKey: string;
  correlationId: string;
  issuedByAdminId: string;
  expiresAt: Date;
};

export type CommandReceipt = {
  correlationId: string;
  status: "PENDING" | "DELIVERED" | "SUCCEEDED" | "FAILED" | "EXPIRED";
  message?: string;
};

export interface RobloxIntegration {
  getHealth(): Promise<IntegrationHealth>;
  getPlayerStats(robloxUserId: string): Promise<IntegrationResult<LivePlayerStats>>;
  submitCommand(envelope: CommandEnvelope): Promise<IntegrationResult<CommandReceipt>>;
  getCommandResult(correlationId: string): Promise<IntegrationResult<CommandReceipt>>;
  publishConfig(input: {
    scope: "FISHING" | "PETS" | "GACHA";
    version: number;
    checksum: string;
    correlationId: string;
  }): Promise<IntegrationResult<CommandReceipt>>;
}
