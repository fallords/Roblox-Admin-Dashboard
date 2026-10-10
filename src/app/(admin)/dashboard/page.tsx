import type { Metadata } from "next";
import Link from "next/link";
import { DataSourceBadge } from "@/components/data-source-badge";
import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/dal";
import { getDb } from "@/lib/database";
import { formatNumber, formatUtc } from "@/lib/format";
import { getOverviewData, type SourceCounts } from "@/lib/overview";
import { hasPermission } from "@/lib/permissions";
import { provenanceFromCounts, type DataProvenance } from "@/lib/provenance";

export const metadata: Metadata = { title: "Overview" };

function Metric({
  title,
  value,
  provenance,
  note,
}: {
  title: string;
  value: string;
  provenance: DataProvenance;
  note?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <DataSourceBadge provenance={provenance} />
      </CardHeader>
      <CardContent>
        <p className={provenance === "not_connected" ? "text-lg font-medium text-subtle" : "text-2xl font-semibold tabular-nums"}>
          {value}
        </p>
        {note ? <p className="mt-1 text-xs text-subtle">{note}</p> : null}
      </CardContent>
    </Card>
  );
}

function countMetric(counts: SourceCounts) {
  return { value: formatNumber(counts.total), provenance: provenanceFromCounts(counts) };
}

const RESULT_TONE = { SUCCESS: "success", FAILURE: "danger", DENIED: "danger", ERROR: "danger" } as const;

export default async function DashboardPage() {
  const admin = await requirePagePermission("dashboard.view");
  const canViewSettings = hasPermission(admin.role, "settings.view");
  const data = await getOverviewData(getDb());
  const live = data.integration.status === "connected";

  return (
    <>
      <PageHeader
        title="Overview"
        description="Every figure states its source. Demo figures come from seed data; nothing on this page is read from live game servers."
      />

      {!live ? (
        <Alert tone="info" title="Roblox integration: not connected" className="mb-6">
          {data.integration.summary} Live metrics show “Not connected” instead of estimates.{" "}
          {canViewSettings ? (
            <Link href="/settings" className="text-accent-strong underline-offset-4 hover:underline">
              Integration settings
            </Link>
          ) : null}
        </Alert>
      ) : null}

      <section aria-labelledby="live-heading" className="mb-8">
        <h2 id="live-heading" className="mb-3 text-sm font-semibold tracking-wide text-subtle uppercase">
          Live game
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Active servers" value="Not connected" provenance="not_connected" />
          <Metric title="Concurrent players" value="Not connected" provenance="not_connected" />
          <Metric title="Daily active users" value="Not connected" provenance="not_connected" />
          <Metric
            title="Last successful sync"
            value={data.integration.lastSuccessfulSyncAt ? formatUtc(data.integration.lastSuccessfulSyncAt) : "Never"}
            provenance={live ? "live" : "not_connected"}
          />
        </div>
      </section>

      <section aria-labelledby="records-heading" className="mb-8">
        <h2 id="records-heading" className="mb-3 text-sm font-semibold tracking-wide text-subtle uppercase">
          Administrative records
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Player records" {...countMetric(data.players)} note="Records stored in this dashboard" />
          <Metric title="Fish species" {...countMetric(data.fish)} note={`${formatNumber(data.fishSkins.total)} fish skins`} />
          <Metric title="Fishing rods" {...countMetric(data.rods)} />
          <Metric title="Pets" {...countMetric(data.pets)} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-1">
          <CardHeader>
            <CardTitle>Event status</CardTitle>
            <DataSourceBadge provenance={provenanceFromCounts(data.events.counts)} />
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border text-sm">
              {Object.entries(data.events.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between py-2">
                  <dt className="text-muted capitalize">{status.toLowerCase()}</dt>
                  <dd className="tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-subtle">Statuses are administrative labels; no scheduler runs events yet.</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent administrative actions</CardTitle>
            <DataSourceBadge provenance="local" />
          </CardHeader>
          <CardContent>
            {data.recentActions.length === 0 ? (
              <p className="py-6 text-center text-sm text-subtle">No actions recorded yet.</p>
            ) : (
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <caption className="sr-only">Most recent audit log entries</caption>
                  <thead className="text-xs text-subtle">
                    <tr className="border-b border-border">
                      <th scope="col" className="px-5 py-2 font-medium">Time (UTC)</th>
                      <th scope="col" className="px-2 py-2 font-medium">Admin</th>
                      <th scope="col" className="px-2 py-2 font-medium">Action</th>
                      <th scope="col" className="px-5 py-2 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.recentActions.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-5 py-2 whitespace-nowrap text-muted tabular-nums">{formatUtc(entry.createdAt)}</td>
                        <td className="px-2 py-2">{entry.actorUsername ?? <span className="text-subtle">—</span>}</td>
                        <td className="px-2 py-2 font-mono text-xs">{entry.action}</td>
                        <td className="px-5 py-2">
                          <Badge tone={RESULT_TONE[entry.result]}>{entry.result}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
