# Beach Avenue! — Admin Dashboard

External web administration console for the Roblox game **Beach Avenue!** It runs in a browser,
independently of Roblox Studio.

> **Status: Phase 1 (foundation).** Login, sessions, role-based access control, audit logging, the
> database schema and the dashboard shell work locally. **There is no live Roblox connection yet.**
> Every live metric shows "Not connected", and all game data in the database is seed data labelled
> **DEMO**. See [`docs/phase-1-report.md`](docs/phase-1-report.md) for what exists and what comes next.

## Requirements

- Node.js **22.12+** (tested with 22.22) and npm 10+
- Nothing paid: no cloud services, API keys or hosting are needed for local use.

## Quick start

```bash
cp .env.example .env               # local settings; never commit .env
npm install                        # also generates the Prisma client
npm run db:setup                   # create prisma/dev.db and load DEMO seed data
npm run admin:create -- --username yourname --display-name "Your Name"
npm run dev                        # http://localhost:3000
```

`admin:create` prompts for a password (hidden input, at least 12 characters). The first account
becomes **OWNER**; later accounts default to **VIEWER** unless you pass `--role`.

There is no public registration and no self-service password reset.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm start` | Production build / serve the build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run TypeScript |
| `npm test` | Unit and integration tests (Vitest, real SQLite) |
| `npm run test:e2e` | Production build plus browser tests (Playwright, Chromium) |
| `npm run check` | lint + typecheck + unit and integration tests |
| `npm run db:setup` | Apply migrations and seed DEMO data |
| `npm run db:migrate` | Create/apply a migration after editing `prisma/schema.prisma` |
| `npm run db:reset` | **Deletes all local data**, re-applies migrations and seeds |
| `npm run admin -- <command>` | Administrator management (see below) |

### Administrator management

```bash
npm run admin -- list
npm run admin -- create --username alice --role MODERATOR
npm run admin -- reset-password --username alice   # also revokes alice's sessions
npm run admin -- revoke-sessions --username alice  # sign alice out everywhere
npm run admin -- deactivate --username alice       # block sign-in, revoke sessions
npm run admin -- activate --username alice
```

Every change is written to the audit log. The procedure for a suspected compromise is in
[`docs/security.md`](docs/security.md#revoking-compromised-credentials).

## Environment variables

See [`.env.example`](.env.example).

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | SQLite file, e.g. `file:./prisma/dev.db` (relative to the project root) |
| `TRUST_PROXY` | no (`false`) | Set `true` only behind a reverse proxy you control that overwrites `X-Forwarded-For`. This enables per-IP login throttling. |
| `ROBLOX_UNIVERSE_ID`, `ROBLOX_OPEN_CLOUD_API_KEY` | no | Reserved for Phase 4. Leave unset; the integration is not implemented. |

Secrets are read only on the server. Never put a secret in a `NEXT_PUBLIC_*` variable.

## Roles

| Role | Can do |
| --- | --- |
| OWNER | Everything, including administrator management |
| ADMIN | Everything except administrator management |
| MODERATOR | View dashboards, catalogs and events; moderate players |
| VIEWER | Read-only access to dashboards, players, catalogs, config and events |

Permissions are enforced on the server for every page and action. The navigation only hides
links as a convenience. See `src/lib/permissions/index.ts`.

## Project structure

```
src/
  app/                    Next.js App Router
    login/                Sign-in page and server action
    (admin)/              Authenticated area (layout checks the session)
      dashboard/ players/ inventory/ fishing/ pets/ events/
      analytics/ audit-logs/ settings/ forbidden/
  components/             UI components (ui/ = primitives, layout/ = shell)
  lib/
    auth/                 Passwords, sessions, throttling, cookies, data-access layer
    audit/                Append-only audit log writer
    database/             Prisma client (the only provider-specific code)
    permissions/          Roles → permissions
    validation/           Zod schemas
  services/roblox/        Roblox integration interface and the Phase 1 "unavailable" adapter
  proxy.ts                CSP nonce and optimistic redirect (Next.js 16 "proxy", formerly middleware)
prisma/                   Schema, migrations, DEMO seed
scripts/admin.ts          Administrator CLI
tests/                    unit/, integration/ (Vitest), e2e/ (Playwright)
docs/                     Phase report, security design, Roblox integration notes
```

## Demo data

`npm run db:setup` / `npm run db:seed` loads example fish, rods, pets, skins, events and players.
Every seeded record has `source = DEMO`, and the UI marks it with a **Demo** badge. Demo players
use **negative** Roblox UserIds, Roblox's convention for local test players, so they can never match
a real account, and live-command validation rejects them. The seed refuses to run when
`NODE_ENV=production`.

## Testing notes

- Integration tests run against real, migrated SQLite databases in `.tmp/` (one per test file).
- `npm run test:e2e` builds the app, creates `.tmp/e2e.db` with seed data and two test admins, and
  drives Chromium. On a new machine, run `npx playwright install chromium` once.
- Vitest is pinned to 3.2.x: Vitest 4/5 trigger an npm 10 resolver crash
  (`Cannot read properties of null (reading 'edgesOut')`). npm 11 handles them.
- ESLint is pinned to 9.x because `eslint-config-next`'s plugins do not support ESLint 10 yet.

## Further documentation

- [`docs/phase-1-report.md`](docs/phase-1-report.md): architecture, files, dependencies and costs, plan
- [`docs/security.md`](docs/security.md): security design, credential revocation, pre-deployment checklist
- [`docs/roblox-integration.md`](docs/roblox-integration.md): integration options and what is needed from the game
