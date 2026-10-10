import type { Metadata } from "next";
import { DataSourceBadge } from "@/components/data-source-badge";
import { PageHeader } from "@/components/page-header";
import { PlannedSection } from "@/components/planned-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/dal";
import { formatUtc } from "@/lib/format";
import { getRobloxIntegration } from "@/services/roblox";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePagePermission("settings.view");
  const health = await getRobloxIntegration().getHealth();

  return (
    <>
      <PageHeader title="Settings & integrations" description="Integration health and security status. Secret values are never displayed." />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Roblox integration</CardTitle>
          <DataSourceBadge provenance={health.status === "connected" ? "live" : "not_connected"} />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{health.summary}</p>
          <p className="text-muted">Last successful sync: {health.lastSuccessfulSyncAt ? formatUtc(health.lastSuccessfulSyncAt) : "Never"}</p>
          <p className="text-muted">Checked: {formatUtc(health.checkedAt)}</p>
          <p className="text-muted">
            Setup: see <code className="font-mono text-xs">docs/roblox-integration.md</code>. The integration is implemented
            and tested in Phase 4; until then no command reaches a live server.
          </p>
        </CardContent>
      </Card>
      <PlannedSection
        phase="Phase 2"
        items={[
          "Backend health, data synchronization status and configuration version.",
          "Administrator access overview (owner only).",
          "Security status: session settings, rate limits and credential-revocation procedure.",
        ]}
      />
    </>
  );
}
