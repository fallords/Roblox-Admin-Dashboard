import {
  Activity,
  CalendarClock,
  Fish,
  Gauge,
  Package,
  PawPrint,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Gauge, permission: "dashboard.view" },
  { href: "/players", label: "Players", icon: Users, permission: "players.view" },
  { href: "/inventory", label: "Inventory & Rewards", icon: Package, permission: "catalog.view" },
  { href: "/fishing", label: "Fishing Config", icon: Fish, permission: "config.view" },
  { href: "/pets", label: "Pet Config", icon: PawPrint, permission: "config.view" },
  { href: "/events", label: "Events", icon: CalendarClock, permission: "events.view" },
  { href: "/analytics", label: "Analytics", icon: Activity, permission: "analytics.view" },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText, permission: "audit.view" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings.view" },
];
