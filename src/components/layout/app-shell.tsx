import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionAdmin } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brand } from "./brand";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export function AppShell({
  admin,
  demoDataPresent,
  children,
}: {
  admin: SessionAdmin;
  demoDataPresent: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-border bg-surface lg:flex lg:min-h-dvh lg:flex-col lg:gap-6 lg:p-4">
        <Brand />
        <nav aria-label="Main navigation">
          <NavLinks role={admin.role} />
        </nav>
      </aside>

      <div id="app-content" className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-canvas/95 px-4 backdrop-blur sm:px-6">
          <MobileNav role={admin.role} />
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {demoDataPresent ? (
              <Badge tone="demo" title="The database contains seed data that is not from the live game">
                Demo data
              </Badge>
            ) : null}
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm text-fg">{admin.displayName}</p>
              <p className="text-xs text-subtle">
                @{admin.username} · {ROLE_LABELS[admin.role]}
              </p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
                <LogOut aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
