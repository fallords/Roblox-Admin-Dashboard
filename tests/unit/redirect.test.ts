import { describe, expect, it } from "vitest";
import { isProtectedPath, safeRedirectPath } from "@/lib/auth/constants";

describe("post-login redirect validation", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/players", "/players"],
    ["/players?query=demo", "/players?query=demo"],
    ["/settings/integrations", "/settings/integrations"],
  ])("allows %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/dashboard",
    "javascript:alert(1)",
    "/login",
    "/forbidden",
    "/api/anything",
    "/dashboardx",
    "dashboard",
    "",
    "/dashboard\nSet-Cookie: x",
  ])("falls back to /dashboard for %j", (input) => {
    expect(safeRedirectPath(input)).toBe("/dashboard");
  });

  it("ignores non-string values", () => {
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath(["/players"])).toBe("/dashboard");
  });

  it("identifies protected paths by segment, not prefix", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/players/123")).toBe(true);
    expect(isProtectedPath("/playersabc")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });
});
