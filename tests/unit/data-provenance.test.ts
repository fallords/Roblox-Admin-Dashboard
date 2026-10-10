import { describe, expect, it } from "vitest";
import { provenanceFromCounts } from "@/lib/provenance";

describe("data provenance labels", () => {
  it("labels seed-only data as demo", () => {
    expect(provenanceFromCounts({ demo: 3, manual: 0, roblox: 0 })).toBe("demo");
  });

  it("flags any mix that contains demo data", () => {
    expect(provenanceFromCounts({ demo: 3, manual: 2, roblox: 0 })).toBe("mixed");
    expect(provenanceFromCounts({ demo: 1, manual: 0, roblox: 5 })).toBe("mixed");
  });

  it("labels dashboard-entered data as local, never live", () => {
    expect(provenanceFromCounts({ demo: 0, manual: 4, roblox: 0 })).toBe("local");
    expect(provenanceFromCounts({ demo: 0, manual: 0, roblox: 0 })).toBe("local");
  });

  it("labels data as live only when every record came from the game", () => {
    expect(provenanceFromCounts({ demo: 0, manual: 0, roblox: 9 })).toBe("live");
    expect(provenanceFromCounts({ demo: 0, manual: 1, roblox: 9 })).toBe("local");
  });
});
