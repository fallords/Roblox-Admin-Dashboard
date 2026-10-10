import "server-only";
import type { DataSource, EventStatus } from "@/generated/prisma/enums";
import { listRecentAuditLogs } from "@/lib/audit";
import type { Database } from "@/lib/database";
import { getRobloxIntegration, type IntegrationHealth } from "@/services/roblox";

export type SourceCounts = { total: number; demo: number; manual: number; roblox: number };

function toSourceCounts(rows: { source: DataSource; _count: { _all: number } }[]): SourceCounts {
  const counts: SourceCounts = { total: 0, demo: 0, manual: 0, roblox: 0 };
  for (const row of rows) {
    const n = row._count._all;
    counts.total += n;
    if (row.source === "DEMO") counts.demo += n;
    else if (row.source === "MANUAL") counts.manual += n;
    else counts.roblox += n;
  }
  return counts;
}

export type OverviewData = {
  players: SourceCounts;
  fish: SourceCounts;
  rods: SourceCounts;
  pets: SourceCounts;
  fishSkins: SourceCounts;
  events: { counts: SourceCounts; byStatus: Record<EventStatus, number> };
  recentActions: Awaited<ReturnType<typeof listRecentAuditLogs>>;
  integration: IntegrationHealth;
};

export async function getOverviewData(db: Database): Promise<OverviewData> {
  const [players, fish, rods, pets, fishSkins, events, eventStatus, recentActions, integration] = await Promise.all([
    db.player.groupBy({ by: ["source"], _count: { _all: true } }),
    db.fish.groupBy({ by: ["source"], _count: { _all: true } }),
    db.fishingRod.groupBy({ by: ["source"], _count: { _all: true } }),
    db.pet.groupBy({ by: ["source"], _count: { _all: true } }),
    db.fishSkin.groupBy({ by: ["source"], _count: { _all: true } }),
    db.gameEvent.groupBy({ by: ["source"], _count: { _all: true } }),
    db.gameEvent.groupBy({ by: ["status"], _count: { _all: true } }),
    listRecentAuditLogs(db, 8),
    getRobloxIntegration().getHealth(),
  ]);

  const byStatus: Record<EventStatus, number> = { DRAFT: 0, SCHEDULED: 0, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const row of eventStatus) byStatus[row.status] = row._count._all;

  return {
    players: toSourceCounts(players),
    fish: toSourceCounts(fish),
    rods: toSourceCounts(rods),
    pets: toSourceCounts(pets),
    fishSkins: toSourceCounts(fishSkins),
    events: { counts: toSourceCounts(events), byStatus },
    recentActions,
    integration,
  };
}

/** True when any DEMO seed record exists, so the UI can flag demo mode. */
export async function hasDemoData(db: Database): Promise<boolean> {
  const where = { source: "DEMO" as const };
  const found = await Promise.all([
    db.player.findFirst({ where, select: { id: true } }),
    db.fish.findFirst({ where, select: { id: true } }),
    db.pet.findFirst({ where, select: { id: true } }),
    db.gameEvent.findFirst({ where, select: { id: true } }),
  ]);
  return found.some(Boolean);
}
