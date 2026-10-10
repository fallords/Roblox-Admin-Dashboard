import { describe, expect, it } from "vitest";
import { redactDetails } from "@/lib/audit";

describe("audit detail redaction", () => {
  it("redacts sensitive keys at any depth", () => {
    const result = redactDetails({
      password: "hunter2hunter2",
      nested: { apiKey: "rbx-123", api_key: "x", authToken: "t", ok: "kept" },
      list: [{ secret: "s" }, { value: 1 }],
      Authorization: "Bearer abc",
      sessionId: "abc",
    });
    expect(result).toEqual({
      password: "[redacted]",
      nested: { apiKey: "[redacted]", api_key: "[redacted]", authToken: "[redacted]", ok: "kept" },
      list: [{ secret: "[redacted]" }, { value: 1 }],
      Authorization: "[redacted]",
      sessionId: "[redacted]",
    });
  });

  it("truncates long strings and deep nesting", () => {
    const long = "x".repeat(600);
    expect((redactDetails({ note: long }) as { note: string }).note.length).toBeLessThan(510);
    const deep = { a: { b: { c: { d: { e: { f: "too deep" } } } } } };
    expect(JSON.stringify(redactDetails(deep))).toContain("[truncated]");
  });

  it("serializes bigint safely", () => {
    expect(redactDetails({ id: BigInt(42) })).toEqual({ id: "42" });
  });
});
