# Roblox integration

## Current status (Phase 1): not implemented

- No code reads from or writes to Roblox. `src/services/roblox/` defines the interface and an
  `UnavailableRobloxAdapter` whose operations all fail with `NOT_CONFIGURED` or
  `NOT_IMPLEMENTED`. Tests assert that it never reports success.
- Setting `ROBLOX_UNIVERSE_ID` and `ROBLOX_OPEN_CLOUD_API_KEY` changes the reported status only to
  "configured, unverified". It never changes to "connected" until a real adapter has been
  implemented and tested against a private test experience.
- **The Beach Avenue! game code was not available** during Phase 1. No repository in the
  connected GitHub account contains it, and no place file was provided. Nothing below is based
  on the game's actual scripts.

## Why a button cannot just "do it"

The dashboard and the live game are separate systems. A request to the dashboard backend does
not execute code inside a running Roblox server. Every operation needs an explicit path that is
authenticated, delivered, executed by an authoritative server script, and acknowledged:

```
Dashboard (validates, authorizes, audits)
   └─> delivery mechanism (queue / messaging / data store)
         └─> game server script (re-validates, executes idempotently)
               └─> acknowledgement with result ──> dashboard marks SUCCEEDED/FAILED + audits
```

The schema already models this. `AdminCommand` has a unique `idempotencyKey`, a
`correlationId`, `expiresAt` and the statuses PENDING → DELIVERED → SUCCEEDED/FAILED/EXPIRED.

## Open Cloud capabilities found so far (to verify in Phase 4)

Roblox documentation hosts were unreachable from the development container, so these come from
search results and **must be re-checked against the official docs before any code depends on
them.** Sources conflicted on several points.

| Need | Candidate API | Notes / open questions |
| --- | --- | --- |
| Push a message to live servers | Open Cloud **Messaging Service** (`POST /cloud/v2/universes/{id}:publishMessage`; an older `messaging-service/v1/...` path also appears in docs) | Reaches only live servers. **Delivery is best-effort, not guaranteed.** Message limit ~1 KB. Shares rate limits with in-game MessagingService. Not suitable alone for rewards. |
| Durable queue for commands | Open Cloud **Memory Store** queue / sorted map endpoints (`/cloud/v2/universes/{id}/memory-stores/...`) | Exact scopes and quotas not confirmed. Memory store data is temporary (expires), which fits expiring commands. |
| Read/write persistent player data | Open Cloud **Data Stores** (v2) | Per-data-store, per-experience key scopes are possible. Writing player data from outside is risky if the game uses session locking (e.g. ProfileStore); needs the game's data layer. |
| Bans | Open Cloud **User Restrictions** (Ban API), in-game `Players:BanAsync` | Universe- or place-level. Duration format conflicted between sources. Developers report 504s when paging long restriction lists. |
| DAU / MAU / CCU | Creator Dashboard; a **beta** Open Cloud analytics query API was reported on the DevForum | Treat as unavailable until verified. Until then the dashboard shows "Not connected". |
| Experience secrets for HTTP from game servers | `HttpService:GetSecret` (experience Secrets store) | Needed only if game servers call the dashboard backend. |

Sources consulted (search results, not verified line by line):
[Messaging usage guide](https://create.roblox.com/docs/cloud/guides/usage-messaging),
[Bans and blocks reference](https://create.roblox.com/docs/cloud/reference/features/bans-and-blocks),
[Players:BanAsync](https://create.roblox.com/docs/reference/engine/classes/Players/BanAsync),
[Open Cloud data stores guide](https://create.roblox.com/docs/cloud/guides/data-stores),
[Open Cloud docs index](https://create.roblox.com/docs/cloud/llms.txt),
[DevForum: user-restrictions 504s](https://devforum.roblox.com/t/user-restrictions-open-cloud-api-often-returns-504s/4007401),
[DevForum: Open Cloud analytics query API (beta)](https://devforum.roblox.com/t/open-cloud-analytics-query-api-is-live-beta-%E2%80%94-tested-documented-with-a-client/4753664).

## Candidate designs (decision in Phase 4)

**A. Outbound-only via Open Cloud (leading candidate).** The dashboard writes each command to a
Memory Store queue through Open Cloud and optionally publishes a MessagingService "wake-up". Game
servers read the queue, execute, and write the result to a Memory Store map keyed by
`correlationId`, which the dashboard polls.

- Pro: the dashboard never has to be reachable from the internet, so it works while running
  locally with no hosting cost.
- Con: depends on Open Cloud quotas and scopes, and needs polling for results.

**B. Game servers poll the dashboard API over HTTPS.** Servers call `HttpService:RequestAsync`
to claim pending commands and post acknowledgements. Requests are signed with an HMAC secret
held in the experience Secrets store.

- Pro: simple, full control.
- Con: the dashboard must be publicly reachable over HTTPS (Phase 5 hosting), and the backend is
  exposed to the internet.

**C. Mailbox in the player's data store** for rewards to offline players, applied on next join.
This needs the game's data layer and session-locking behaviour.

Whichever is chosen:

- Rewards must be idempotent on the game side as well. The game records processed command ids
  (for example in the player's data) so a redelivered command is never applied twice.
- The game re-validates everything: command type is in the closed set, the item key exists, the
  quantity is within limits, the target UserId is positive, and the command has not expired.
- Expired commands are never executed, even if delivered late.
- **No arbitrary Lua or free-form commands, ever.**

## Information needed from the Beach Avenue! game

Please provide whichever of these you can. Even a partial answer narrows the Phase 4 plan.

1. **Game source:** a Rojo/Git repository or an exported place file (`.rbxlx`) containing
   `ServerScriptService`, `ServerStorage` and `ReplicatedStorage` scripts. The map is not needed
   and stays out of scope.
2. **Experience ids:** universe id and place ids, and ideally a **separate private test
   experience** for Phase 4.
3. **Player data layer:** raw `DataStoreService`, ProfileService/ProfileStore, DataStore2 or other.
   Also the data store names, key format (e.g. `Player_<UserId>`) and the saved data shape (coins,
   XP, level, and how fish, rods, pets and skins are stored).
4. **Item definitions:** where fish, rods, pets, skins and rarities are defined (ModuleScripts?),
   their id format, rod stats (catch speed, luck, reel bonus) and gacha weight tables.
5. **Existing admin and moderation:** any admin system (Adonis, HD Admin, custom), existing kick
   or ban logic, and whether `Players:BanAsync` is used.
6. **Remotes:** the list of RemoteEvents/RemoteFunctions and their server handlers (for a security
   review; the dashboard will not use client remotes).
7. **Settings:** whether "Allow HTTP Requests" is enabled, and whether the experience uses the
   Secrets store.
8. **Analytics:** any `AnalyticsService` custom events already logged.
9. **Team:** who holds the OWNER role, how many administrators, and the team's primary timezone.

## Phase 4 outline

1. Inspect the game code; document existing scripts, DataStore schemas, remotes and config.
2. Verify current Open Cloud capabilities, scopes, quotas and limits from the official docs.
3. Choose design A, B or C (or a combination) and document the required Luau changes.
   Propose the smallest safe change; do not overwrite existing game logic without justification.
4. Implement the server-side Luau command handler (validation, idempotency, expiry,
   acknowledgement) in the test experience.
5. Implement a real adapter behind `RobloxIntegration`. Test end-to-end in the private test
   experience, including duplicates, expiry, rejection and server restarts.
6. Only then report the integration as connected for the operations that passed.
