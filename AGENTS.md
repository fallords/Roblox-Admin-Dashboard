<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Beach Avenue! Admin — project rules

- Never display fabricated metrics or claim live Roblox connectivity. Unavailable data shows "Not connected"; seed data is `source = DEMO` and labelled in the UI.
- Every page, Server Action and Route Handler must authorize itself via `src/lib/auth/dal.ts` (`requirePagePermission` / `authorizeAction`). `proxy.ts` and layouts are not security boundaries.
- Validate all input with Zod on the server. Audit security-sensitive actions with `writeAuditLog`; never put secrets in audit details. `AuditLog` is append-only (DB triggers).
- Roblox commands are a closed, typed set (`src/services/roblox/types.ts`). Never add arbitrary Lua/command execution.
- Keep provider-specific database code in `src/lib/database/client.ts`.
- Before committing: `npm run check` (lint, typecheck, unit/integration tests) and `npm run test:e2e`.
- Docs: `docs/phase-1-report.md`, `docs/security.md`, `docs/roblox-integration.md`.
