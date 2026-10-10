/** Where a displayed figure came from. Every metric in the UI carries one. */
export type DataProvenance = "demo" | "mixed" | "local" | "live" | "not_connected";

export function provenanceFromCounts(counts: { demo: number; manual: number; roblox: number }): DataProvenance {
  const { demo, manual, roblox } = counts;
  if (roblox > 0 && demo === 0 && manual === 0) return "live";
  if (demo > 0 && (manual > 0 || roblox > 0)) return "mixed";
  if (demo > 0) return "demo";
  return "local";
}
