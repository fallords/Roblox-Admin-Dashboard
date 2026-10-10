import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth/dal";
import { getDb } from "@/lib/database";
import { hasDemoData } from "@/lib/overview";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  // Layout check is for rendering the shell only; each page re-checks its own
  // permission because layouts are not re-run on every client navigation.
  const admin = await requireAdmin();
  const demoDataPresent = await hasDemoData(getDb());
  return (
    <AppShell admin={admin} demoDataPresent={demoDataPresent}>
      {children}
    </AppShell>
  );
}
