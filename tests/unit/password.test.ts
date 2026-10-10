import { describe, expect, it } from "vitest";
import { burnPasswordVerification, hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("produces argon2id hashes with the configured parameters", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(hash).not.toContain("correct horse");
  });

  it("verifies correct and rejects incorrect passwords", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword(hash, "correct horse battery staple")).toBe(true);
    expect(await verifyPassword(hash, "Correct horse battery staple")).toBe(false);
  });

  it("uses a unique salt per hash", async () => {
    expect(await hashPassword("same-password-twice")).not.toBe(await hashPassword("same-password-twice"));
  });

  it("treats malformed hashes as failed verification", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
    expect(await verifyPassword("", "")).toBe(false);
  });

  it("dummy verification always fails", async () => {
    expect(await burnPasswordVerification("whatever")).toBe(false);
  });
});
