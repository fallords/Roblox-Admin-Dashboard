import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlannedSection } from "@/components/planned-section";
import { requirePagePermission } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Inventory & Rewards" };

export default async function InventoryPage() {
  await requirePagePermission("catalog.view");
  return (
    <>
      <PageHeader title="Inventory & Rewards" description="Catalogs of fish, fish skins, fishing rods, pets, currencies and rarities." />
      <PlannedSection
        phase="Phase 2"
        items={[
          "Catalog browsing and editing backed by the local database.",
          "Reward workflow: select player → select reward → quantity → preview → confirm.",
          "Reward submission stays disabled until a live command path with acknowledgement and idempotency is implemented and tested (Phase 4).",
        ]}
      />
    </>
  );
}
