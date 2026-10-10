import { Badge } from "@/components/ui/badge";
import type { DataProvenance } from "@/lib/provenance";

const LABELS: Record<DataProvenance, { label: string; tone: "demo" | "neutral" | "success" | "info"; title: string }> = {
  demo: { label: "Demo", tone: "demo", title: "Seed data for development — not from the live game" },
  mixed: { label: "Demo + local", tone: "demo", title: "Includes seed (DEMO) records alongside dashboard-entered records" },
  local: { label: "Local DB", tone: "info", title: "Stored in this dashboard's database — not synchronized with the game" },
  live: { label: "Live", tone: "success", title: "Read from the game through a verified integration" },
  not_connected: { label: "Not connected", tone: "neutral", title: "No integration provides this data yet" },
};

/** Every metric shows where its number came from. */
export function DataSourceBadge({ provenance }: { provenance: DataProvenance }) {
  const { label, tone, title } = LABELS[provenance];
  return (
    <Badge tone={tone} title={title}>
      {label}
    </Badge>
  );
}

