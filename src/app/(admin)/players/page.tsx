import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlannedSection } from "@/components/planned-section";
import { requirePagePermission } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Players" };

export default async function PlayersPage() {
  await requirePagePermission("players.view");
  return (
    <>
      <PageHeader title="Players" description="Player records stored in this dashboard. Live player data requires the Roblox integration." />
      <PlannedSection
        phase="Phase 2"
        items={[
          "Searchable player table (Roblox UserId, username, display name, progression, moderation status).",
          "Player detail view with the record's data source (DEMO / local / live).",
          "Moderation actions (warn, kick, restrict, ban) are enabled only once a game-side handler exists (Phase 4).",
        ]}
      />
    </>
  );
}
