import { afterEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "@/lib/env";
import { getRequestMeta } from "@/lib/request";

const headers = (values: Record<string, string>) => new Headers(values);

describe("request metadata", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
  });

  it("treats X-Forwarded-For as unverified unless TRUST_PROXY is enabled", () => {
    vi.stubEnv("TRUST_PROXY", "false");
    resetEnvCache();
    const meta = getRequestMeta(headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1", "user-agent": "test" }));
    expect(meta).toEqual({ ipAddress: "203.0.113.7", ipTrusted: false, userAgent: "test" });
  });

  it("trusts the forwarded client IP behind a trusted proxy", () => {
    vi.stubEnv("TRUST_PROXY", "true");
    resetEnvCache();
    expect(getRequestMeta(headers({ "x-forwarded-for": "2001:db8::1" })).ipTrusted).toBe(true);
  });

  it("discards values that are not IP addresses", () => {
    vi.stubEnv("TRUST_PROXY", "true");
    resetEnvCache();
    const meta = getRequestMeta(headers({ "x-forwarded-for": "<script>alert(1)</script>" }));
    expect(meta.ipAddress).toBeNull();
    expect(meta.ipTrusted).toBe(false);
  });
});
