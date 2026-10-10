import { describe, expect, it } from "vitest";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/session";

describe("session tokens", () => {
  it("are 256-bit base64url strings", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
  });

  it("are unique", () => {
    const tokens = new Set(Array.from({ length: 200 }, generateSessionToken));
    expect(tokens.size).toBe(200);
  });

  it("are stored only as a SHA-256 hash", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashSessionToken(token)).toBe(hash);
  });
});
