import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlannedSection } from "@/components/planned-section";
import { requirePagePermission } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Pet Config" };

export default async function PetsPage() {
  await requirePagePermission("config.view");
  return (
    <>
      <PageHeader title="Pet configuration" description="Pet catalog, rarity, gameplay bonuses, unlock requirements and gacha weights." />
      <PlannedSection
        phase="Phase 2"
        items={[
          "Pet catalog editing (no 3D asset or map editing).",
          "Gacha weight editor that rejects invalid distributions (non-positive weights, empty pools, rounding drift).",
          "Draft / published versioning shared with fishing configuration.",
        ]}
      />
    </>
  );
}
