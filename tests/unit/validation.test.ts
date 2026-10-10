import { describe, expect, it } from "vitest";
import { loginInputSchema, newPasswordSchema, usernameSchema } from "@/lib/validation/auth";
import { isDemoRobloxUserId, liveRobloxUserIdSchema, storedRobloxUserIdSchema } from "@/lib/validation/roblox";

describe("username validation", () => {
  it("normalizes to lowercase and trims", () => {
    expect(usernameSchema.parse("  Beach.Owner ")).toBe("beach.owner");
  });

  it.each(["ab", "-alice", "alice-", "al ice", "a".repeat(33), "alice<script>", "álvaro"])("rejects %j", (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });
});

describe("new password policy", () => {
  it("requires at least 12 characters", () => {
    expect(newPasswordSchema.safeParse("short-pass1").success).toBe(false);
    expect(newPasswordSchema.safeParse("long enough passphrase").success).toBe(true);
  });

  it("rejects repetitive and whitespace-padded passwords", () => {
    expect(newPasswordSchema.safeParse("aaaaaaaaaaaaaaaa").success).toBe(false);
    expect(newPasswordSchema.safeParse(" padded-password-x").success).toBe(false);
  });

  it("bounds the maximum length", () => {
    expect(newPasswordSchema.safeParse("x1y2z3".repeat(50)).success).toBe(false);
  });
});

describe("login input", () => {
  it("rejects oversized input before any hashing", () => {
    expect(loginInputSchema.safeParse({ username: "owner", password: "p".repeat(300) }).success).toBe(false);
    expect(loginInputSchema.safeParse({ username: "", password: "x" }).success).toBe(false);
  });
});

describe("Roblox UserId validation", () => {
  it.each(["1", "261", "8123456789", "9223372036854775807"])("accepts live id %s", (value) => {
    expect(liveRobloxUserIdSchema.safeParse(value).success).toBe(true);
  });

  it.each(["0", "-1001", "0123", "1.5", "1e9", "", "9223372036854775808", "12345678901234567890"])(
    "rejects live id %j",
    (value) => {
      expect(liveRobloxUserIdSchema.safeParse(value).success).toBe(false);
    },
  );

  it("allows negative DEMO ids in storage but flags them", () => {
    expect(storedRobloxUserIdSchema.safeParse("-1001").success).toBe(true);
    expect(isDemoRobloxUserId("-1001")).toBe(true);
    expect(isDemoRobloxUserId("1001")).toBe(false);
  });
});
