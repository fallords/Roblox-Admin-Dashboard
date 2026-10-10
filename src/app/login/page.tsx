import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "@/components/layout/brand";
import { safeRedirectPath } from "@/lib/auth/constants";
import { getCurrentSession } from "@/lib/auth/dal";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = safeRedirectPath(Array.isArray(next) ? next[0] : next);

  if (await getCurrentSession()) redirect(target);

  return (
    <main className="flex min-h-dvh items-start justify-center px-4 pt-[12vh] pb-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 mb-5 text-sm text-muted">Authorized administrators only.</p>
          <LoginForm next={target} />
        </div>
        <p className="mt-4 text-center text-xs text-subtle">
          No self-service registration or password reset. Accounts are created by the owner with{" "}
          <code className="font-mono">npm run admin:create</code>.
        </p>
      </div>
    </main>
  );
}
