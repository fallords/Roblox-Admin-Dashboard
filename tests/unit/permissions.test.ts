import { describe, expect, it } from "vitest";
import { AuthorizationError, PERMISSIONS, assertPermission, hasPermission } from "@/lib/permissions";

describe("role-based permissions", () => {
  it("grants OWNER every permission", () => {
    for (const permission of PERMISSIONS) expect(hasPermission("OWNER", permission)).toBe(true);
  });

  it("reserves administrator management for OWNER", () => {
    expect(hasPermission("ADMIN", "admins.manage")).toBe(false);
    expect(hasPermission("MODERATOR", "admins.manage")).toBe(false);
    expect(hasPermission("VIEWER", "admins.manage")).toBe(false);
  });

  it("keeps VIEWER read-only", () => {
    const writes = ["players.moderate", "rewards.grant", "catalog.edit", "config.edit", "config.publish", "events.manage"] as const;
    for (const permission of writes) expect(hasPermission("VIEWER", permission)).toBe(false);
    expect(hasPermission("VIEWER", "dashboard.view")).toBe(true);
  });

  it("lets MODERATOR moderate but not grant rewards, publish config or read audit logs", () => {
    expect(hasPermission("MODERATOR", "players.moderate")).toBe(true);
    expect(hasPermission("MODERATOR", "rewards.grant")).toBe(false);
    expect(hasPermission("MODERATOR", "config.publish")).toBe(false);
    expect(hasPermission("MODERATOR", "audit.view")).toBe(false);
  });

  it("denies unknown roles", () => {
    // @ts-expect-error -- simulating corrupted data
    expect(hasPermission("SUPERUSER", "dashboard.view")).toBe(false);
  });

  it("assertPermission throws a typed error", () => {
    expect(() => assertPermission("VIEWER", "rewards.grant")).toThrow(AuthorizationError);
    expect(() => assertPermission("ADMIN", "rewards.grant")).not.toThrow();
  });
});
