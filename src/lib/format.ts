const utcFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Deterministic, explicit-timezone timestamp, e.g. "10 Oct 2026, 13:45 UTC". */
export function formatUtc(date: Date | null | undefined): string {
  if (!date) return "—";
  return `${utcFormatter.format(date)} UTC`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
