/**
 * DEMO seed data for local development.
 *
 * Everything created here has `source: DEMO`. None of it comes from the live
 * game. Demo players use negative Roblox UserIds (Roblox's own convention for
 * local test players) so they can never collide with — or be mistaken for —
 * real accounts, and live commands reject them.
 *
 * The seed is idempotent: it upserts by stable keys. It never creates admin
 * accounts; use `npm run admin:create` for that.
 */
import "dotenv/config";
import { createPrismaClient } from "../src/lib/database/client";
import type { EventStatus, PetBonusType } from "../src/generated/prisma/enums";

const SOURCE = "DEMO" as const;

const rarities = [
  { key: "common", name: "Common", tier: 1, color: "#9CA3AF" },
  { key: "uncommon", name: "Uncommon", tier: 2, color: "#4ADE80" },
  { key: "rare", name: "Rare", tier: 3, color: "#60A5FA" },
  { key: "epic", name: "Epic", tier: 4, color: "#C084FC" },
  { key: "legendary", name: "Legendary", tier: 5, color: "#FBBF24" },
  { key: "mythic", name: "Mythic", tier: 6, color: "#F472B6" },
];

const fish = [
  { key: "demo_sardine", name: "Sardine", rarity: "common", baseValue: 5, minWeightKg: 0.05, maxWeightKg: 0.2 },
  { key: "demo_mackerel", name: "Mackerel", rarity: "common", baseValue: 8, minWeightKg: 0.3, maxWeightKg: 1.2 },
  { key: "demo_clownfish", name: "Clownfish", rarity: "uncommon", baseValue: 15, minWeightKg: 0.1, maxWeightKg: 0.3 },
  { key: "demo_red_snapper", name: "Red Snapper", rarity: "uncommon", baseValue: 22, minWeightKg: 1, maxWeightKg: 6 },
  { key: "demo_mahi_mahi", name: "Mahi-Mahi", rarity: "rare", baseValue: 45, minWeightKg: 4, maxWeightKg: 18 },
  { key: "demo_sailfish", name: "Sailfish", rarity: "epic", baseValue: 120, minWeightKg: 20, maxWeightKg: 60 },
  { key: "demo_golden_tuna", name: "Golden Tuna", rarity: "legendary", baseValue: 400, minWeightKg: 60, maxWeightKg: 250 },
  { key: "demo_abyssal_leviathan", name: "Abyssal Leviathan", rarity: "mythic", baseValue: 1500, minWeightKg: 300, maxWeightKg: 900 },
];

const fishSkins = [
  { key: "demo_skin_neon_sardine", name: "Neon Sardine", fish: "demo_sardine", rarity: "rare" },
  { key: "demo_skin_sunset_snapper", name: "Sunset Snapper", fish: "demo_red_snapper", rarity: "epic" },
  { key: "demo_skin_crystal_sailfish", name: "Crystal Sailfish", fish: "demo_sailfish", rarity: "legendary" },
  { key: "demo_skin_shadow_leviathan", name: "Shadow Leviathan", fish: "demo_abyssal_leviathan", rarity: "mythic" },
];

const rods = [
  { key: "demo_driftwood_rod", name: "Driftwood Rod", rarity: "common", catchSpeed: 1.0, luck: 1.0, reelBonus: 0, price: 0 },
  { key: "demo_bamboo_rod", name: "Bamboo Rod", rarity: "uncommon", catchSpeed: 1.1, luck: 1.05, reelBonus: 0.05, price: 750 },
  { key: "demo_carbon_rod", name: "Carbon Rod", rarity: "rare", catchSpeed: 1.25, luck: 1.15, reelBonus: 0.1, price: 4000 },
  { key: "demo_coral_rod", name: "Coral Rod", rarity: "epic", catchSpeed: 1.4, luck: 1.3, reelBonus: 0.2, price: null },
  { key: "demo_tidecaller_rod", name: "Tidecaller Rod", rarity: "legendary", catchSpeed: 1.6, luck: 1.6, reelBonus: 0.35, price: null },
];

const pets: { key: string; name: string; rarity: string; bonusType: PetBonusType; bonusValue: number; unlockLevel: number | null; unlockNote: string | null }[] = [
  { key: "demo_hermit_crab", name: "Hermit Crab", rarity: "common", bonusType: "COIN_MULTIPLIER", bonusValue: 0.05, unlockLevel: null, unlockNote: "Gacha" },
  { key: "demo_seagull", name: "Seagull", rarity: "uncommon", bonusType: "CATCH_SPEED", bonusValue: 0.08, unlockLevel: 5, unlockNote: "Gacha" },
  { key: "demo_sea_otter", name: "Sea Otter", rarity: "rare", bonusType: "LUCK", bonusValue: 0.12, unlockLevel: 10, unlockNote: "Gacha" },
  { key: "demo_dolphin", name: "Dolphin", rarity: "epic", bonusType: "REEL_BONUS", bonusValue: 0.2, unlockLevel: 20, unlockNote: "Gacha" },
  { key: "demo_sea_turtle", name: "Golden Sea Turtle", rarity: "legendary", bonusType: "XP_MULTIPLIER", bonusValue: 0.3, unlockLevel: 35, unlockNote: "Event reward" },
];

const players = Array.from({ length: 12 }, (_, index) => {
  const n = index + 1;
  return {
    robloxUserId: String(-(1000 + n)),
    username: `demo_angler_${String(n).padStart(2, "0")}`,
    displayName: `Demo Angler ${n}`,
    coins: 250 * n * n,
    xp: 400 * n,
    level: 1 + Math.floor(n * 1.5),
    moderationStatus: n === 7 ? ("WARNED" as const) : ("NONE" as const),
  };
});

const DAY = 24 * 60 * 60 * 1000;
// Fixed anchor so repeated seeds produce identical data.
const anchor = Date.UTC(2026, 9, 1, 12, 0, 0);
const events: { title: string; description: string; startsAt: Date; endsAt: Date; status: EventStatus }[] = [
  {
    title: "[DEMO] Golden Tide Weekend",
    description: "Example event: increased legendary catch chance. Seed data only.",
    startsAt: new Date(anchor - 14 * DAY),
    endsAt: new Date(anchor - 12 * DAY),
    status: "COMPLETED",
  },
  {
    title: "[DEMO] Coral Reef Tournament",
    description: "Example tournament definition. Seed data only.",
    startsAt: new Date(anchor + 30 * DAY),
    endsAt: new Date(anchor + 32 * DAY),
    status: "SCHEDULED",
  },
  {
    title: "[DEMO] Pet Festival",
    description: "Example pet gacha event draft. Seed data only.",
    startsAt: new Date(anchor + 60 * DAY),
    endsAt: new Date(anchor + 67 * DAY),
    status: "DRAFT",
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Refusing to seed DEMO data with NODE_ENV=production (set ALLOW_DEMO_SEED=true to override).");
  }

  const db = createPrismaClient(url);
  try {
    const rarityIds = new Map<string, string>();
    for (const r of rarities) {
      const row = await db.rarity.upsert({
        where: { key: r.key },
        update: { name: r.name, tier: r.tier, color: r.color },
        create: { ...r, source: SOURCE },
      });
      rarityIds.set(r.key, row.id);
    }
    const rarityId = (key: string) => {
      const id = rarityIds.get(key);
      if (!id) throw new Error(`Unknown rarity ${key}`);
      return id;
    };

    const fishIds = new Map<string, string>();
    for (const f of fish) {
      const data = { name: f.name, rarityId: rarityId(f.rarity), baseValue: f.baseValue, minWeightKg: f.minWeightKg, maxWeightKg: f.maxWeightKg };
      const row = await db.fish.upsert({ where: { key: f.key }, update: data, create: { key: f.key, ...data, source: SOURCE } });
      fishIds.set(f.key, row.id);
    }

    for (const s of fishSkins) {
      const fishId = fishIds.get(s.fish);
      if (!fishId) throw new Error(`Unknown fish ${s.fish}`);
      const data = { name: s.name, fishId, rarityId: rarityId(s.rarity) };
      await db.fishSkin.upsert({ where: { key: s.key }, update: data, create: { key: s.key, ...data, source: SOURCE } });
    }

    for (const r of rods) {
      const data = { name: r.name, rarityId: rarityId(r.rarity), catchSpeed: r.catchSpeed, luck: r.luck, reelBonus: r.reelBonus, price: r.price };
      await db.fishingRod.upsert({ where: { key: r.key }, update: data, create: { key: r.key, ...data, source: SOURCE } });
    }

    for (const p of pets) {
      const data = {
        name: p.name,
        rarityId: rarityId(p.rarity),
        bonusType: p.bonusType,
        bonusValue: p.bonusValue,
        unlockLevel: p.unlockLevel,
        unlockNote: p.unlockNote,
      };
      await db.pet.upsert({ where: { key: p.key }, update: data, create: { key: p.key, ...data, source: SOURCE } });
    }

    for (const p of players) {
      const { robloxUserId, ...data } = p;
      await db.player.upsert({ where: { robloxUserId }, update: data, create: { robloxUserId, ...data, source: SOURCE } });
    }

    // Events have no natural key; replace the DEMO set as a whole.
    await db.gameEvent.deleteMany({ where: { source: SOURCE } });
    await db.gameEvent.createMany({ data: events.map((e) => ({ ...e, displayTimezone: "UTC", source: SOURCE })) });

    console.log(
      `Seeded DEMO data: ${rarities.length} rarities, ${fish.length} fish, ${fishSkins.length} skins, ` +
        `${rods.length} rods, ${pets.length} pets, ${players.length} players, ${events.length} events.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
