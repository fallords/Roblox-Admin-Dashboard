import type { Metadata } from "next";
import { DataSourceBadge } from "@/components/data-source-badge";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Analytics" };

const METRICS = [
  "Daily active users",
  "Concurrent players",
  "Session duration",
  "Returning players",
  "Fishing activity",
  "Item acquisition",
  "Event participation",
];

export default async function AnalyticsPage() {
  await requirePagePermission("analytics.view");
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Only metrics from a connected source are shown. Nothing is estimated or generated."
      />
      <Card>
        <ul className="divide-y divide-border">
          {METRICS.map((metric) => (
            <li key={metric} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span>{metric}</span>
              <DataSourceBadge provenance="not_connected" />
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-4 text-sm text-muted">
        Until a source is connected, use the Roblox Creator Dashboard analytics. See <code className="font-mono text-xs">docs/roblox-integration.md</code>{" "}
        for the options being evaluated.
      </p>
    </>
  );
}
