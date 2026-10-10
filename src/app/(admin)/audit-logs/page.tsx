import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlannedSection } from "@/components/planned-section";
import { requirePagePermission } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Audit Logs" };

export default async function AuditLogsPage() {
  await requirePagePermission("audit.view");
  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Append-only record of sign-ins, access denials and administrative actions. The latest entries appear on the Overview page."
      />
      <PlannedSection
        phase="Phase 2"
        items={[
          "Full searchable, filterable audit log (action, administrator, target, result, correlation ID).",
          "Read-only: the application exposes no edit or delete; the database rejects UPDATE/DELETE.",
        ]}
      />
    </>
  );
}
