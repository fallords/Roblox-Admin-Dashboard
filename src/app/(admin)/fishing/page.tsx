import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlannedSection } from "@/components/planned-section";
import { requirePagePermission } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Fishing Config" };

export default async function FishingPage() {
  await requirePagePermission("config.view");
  return (
    <>
      <PageHeader title="Fishing configuration" description="Rod statistics, fish rarity, reward tables and cooldowns." />
      <PlannedSection
        phase="Phase 2"
        items={[
          "Edit rod catch speed, luck and reel bonus with validation and safe defaults.",
          "Draft vs. published configuration versions with checksums and a diff preview.",
          "Publishing to live servers requires the game to validate and accept the version (Phase 4).",
        ]}
      />
    </>
  );
}
