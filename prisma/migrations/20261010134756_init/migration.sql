-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "passwordChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "absoluteExpiresAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "ipAddress" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorAdminId" TEXT,
    "actorUsername" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "result" TEXT NOT NULL,
    "correlationId" TEXT,
    "ipAddress" TEXT,
    "details" JSONB,
    CONSTRAINT "AuditLog_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "AdminUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "robloxUserId" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "coins" INTEGER,
    "xp" INTEGER,
    "level" INTEGER,
    "moderationStatus" TEXT NOT NULL DEFAULT 'NONE',
    "lastSeenAt" DATETIME,
    "source" TEXT NOT NULL,
    "syncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Rarity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Fish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rarityId" TEXT NOT NULL,
    "baseValue" INTEGER NOT NULL,
    "minWeightKg" REAL NOT NULL,
    "maxWeightKg" REAL NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fish_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FishSkin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fishId" TEXT NOT NULL,
    "rarityId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FishSkin_fishId_fkey" FOREIGN KEY ("fishId") REFERENCES "Fish" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FishSkin_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FishingRod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rarityId" TEXT NOT NULL,
    "catchSpeed" REAL NOT NULL,
    "luck" REAL NOT NULL,
    "reelBonus" REAL NOT NULL,
    "price" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FishingRod_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rarityId" TEXT NOT NULL,
    "bonusType" TEXT NOT NULL,
    "bonusValue" REAL NOT NULL,
    "unlockLevel" INTEGER,
    "unlockNote" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pet_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "displayTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rewards" JSONB,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConfigVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "activatedAt" DATETIME,
    "rejectedReason" TEXT,
    CONSTRAINT "ConfigVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminCommand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetUserId" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "deliveredAt" DATETIME,
    "completedAt" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "resultCode" TEXT,
    "resultMessage" TEXT,
    CONSTRAINT "AdminCommand_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "Session_adminUserId_idx" ON "Session"("adminUserId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_username_createdAt_idx" ON "LoginAttempt"("username", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_createdAt_idx" ON "LoginAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorAdminId_createdAt_idx" ON "AuditLog"("actorAdminId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_robloxUserId_key" ON "Player"("robloxUserId");

-- CreateIndex
CREATE INDEX "Player_username_idx" ON "Player"("username");

-- CreateIndex
CREATE INDEX "Player_source_idx" ON "Player"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Rarity_key_key" ON "Rarity"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Rarity_tier_key" ON "Rarity"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "Fish_key_key" ON "Fish"("key");

-- CreateIndex
CREATE INDEX "Fish_rarityId_idx" ON "Fish"("rarityId");

-- CreateIndex
CREATE UNIQUE INDEX "FishSkin_key_key" ON "FishSkin"("key");

-- CreateIndex
CREATE INDEX "FishSkin_fishId_idx" ON "FishSkin"("fishId");

-- CreateIndex
CREATE UNIQUE INDEX "FishingRod_key_key" ON "FishingRod"("key");

-- CreateIndex
CREATE INDEX "FishingRod_rarityId_idx" ON "FishingRod"("rarityId");

-- CreateIndex
CREATE UNIQUE INDEX "Pet_key_key" ON "Pet"("key");

-- CreateIndex
CREATE INDEX "Pet_rarityId_idx" ON "Pet"("rarityId");

-- CreateIndex
CREATE INDEX "GameEvent_status_startsAt_idx" ON "GameEvent"("status", "startsAt");

-- CreateIndex
CREATE INDEX "ConfigVersion_scope_status_idx" ON "ConfigVersion"("scope", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigVersion_scope_version_key" ON "ConfigVersion"("scope", "version");

-- CreateIndex
CREATE UNIQUE INDEX "AdminCommand_idempotencyKey_key" ON "AdminCommand"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AdminCommand_correlationId_key" ON "AdminCommand"("correlationId");

-- CreateIndex
CREATE INDEX "AdminCommand_status_expiresAt_idx" ON "AdminCommand"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "AdminCommand_targetUserId_idx" ON "AdminCommand"("targetUserId");

-- Audit log is append-only. The application only exposes insert and read
-- operations; these triggers also block UPDATE/DELETE issued through any other
-- path (Prisma, scripts, ad-hoc SQL) so history cannot be silently rewritten.
CREATE TRIGGER "AuditLog_no_update"
BEFORE UPDATE ON "AuditLog"
BEGIN
    SELECT RAISE(ABORT, 'AuditLog is append-only');
END;

CREATE TRIGGER "AuditLog_no_delete"
BEFORE DELETE ON "AuditLog"
BEGIN
    SELECT RAISE(ABORT, 'AuditLog is append-only');
END;
