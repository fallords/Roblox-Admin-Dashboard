import type { AdminRole } from "@/generated/prisma/enums";

export const PERMISSIONS = [
  "dashboard.view",
  "players.view",
  "players.moderate",
  "rewards.grant",
  "catalog.view",
  "catalog.edit",
  "config.view",
  "config.edit",
  "config.publish",
  "events.view",
  "events.manage",
  "analytics.view",
  "audit.view",
  "settings.view",
  "admins.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const VIEWER: readonly Permission[] = [
  "dashboard.view",
  "players.view",
  "catalog.view",
  "config.view",
  "events.view",
  "analytics.view",
];

const MODERATOR: readonly Permission[] = [...VIEWER, "players.moderate"];

const ADMIN: readonly Permission[] = PERMISSIONS.filter((permission) => permission !== "admins.manage");

/**
 * Least privilege by default: new administrators are VIEWER unless created
 * with a higher role. Only OWNER can manage other administrators.
 */
export const ROLE_PERMISSIONS: Readonly<Record<AdminRole, ReadonlySet<Permission>>> = {
  OWNER: new Set(PERMISSIONS),
  ADMIN: new Set(ADMIN),
  MODERATOR: new Set(MODERATOR),
  VIEWER: new Set(VIEWER),
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export class AuthorizationError extends Error {
  constructor(public readonly permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "AuthorizationError";
  }
}

export function assertPermission(role: AdminRole, permission: Permission): void {
  if (!hasPermission(role, permission)) throw new AuthorizationError(permission);
}

export const ROLE_LABELS: Readonly<Record<AdminRole, string>> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  VIEWER: "Viewer",
};
