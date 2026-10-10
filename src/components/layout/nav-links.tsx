"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/generated/prisma/enums";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./navigation";

/** Links the current role may open. Pages still enforce permissions server-side. */
export function NavLinks({ role, onNavigate }: { role: AdminRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => hasPermission(role, item.permission));

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/10 font-medium text-accent-strong"
                  : "text-muted hover:bg-surface-raised hover:text-fg",
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
