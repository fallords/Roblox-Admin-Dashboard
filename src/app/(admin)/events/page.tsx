import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlannedSection } from "@/components/planned-section";
import { requirePagePermission } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  await requirePagePermission("events.view");
  return (
    <>
      <PageHeader title="Events" description="Event definitions with explicit timezones. Times are stored in UTC." />
      <PlannedSection
        phase="Phase 2"
        items={[
          "Create and edit events: title, description, start/end with timezone, rewards.",
          "Draft, scheduled, active, completed and cancelled statuses (administrative labels).",
          "No automatic scheduling until a reliable scheduler and game-server delivery exist.",
        ]}
      />
    </>
  );
}
