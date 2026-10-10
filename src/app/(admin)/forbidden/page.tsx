import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Access denied" };

export default async function ForbiddenPage() {
  await requireAdmin();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <ShieldAlert aria-hidden="true" className="size-8 text-danger" />
      <h1 className="text-xl font-semibold">Access denied</h1>
      <p className="text-sm text-muted">Your role does not include permission for that page. The attempt has been recorded in the audit log.</p>
      <Link href="/dashboard" className="text-sm text-accent-strong underline-offset-4 hover:underline">
        Back to the overview
      </Link>
    </div>
  );
}
