# Security design

Scope: Phase 1 (local development). The **Pre-deployment checklist** at the end must be complete
before the dashboard is reachable from the internet.

## Threat model (summary)

| Asset | Main threats | Controls |
| --- | --- | --- |
| Admin accounts | Password guessing, credential stuffing, session theft | argon2id, login throttling, httpOnly/SameSite cookies, hashed session tokens, idle and absolute expiry, revocation |
| Game economy (Phase 2+) | Unauthorized or duplicated reward grants | RBAC, server-side validation, confirmation, idempotency keys, command expiry, audit |
| Players (moderation) | Wrongful kicks or bans | RBAC, closed command set, audit, confirmation |
| Roblox credentials (Phase 4) | Leakage to the browser or logs | Server-only env vars, never rendered, redacted from audit details |
| Audit trail | Tampering, deletion | Append-only API and database triggers that reject UPDATE/DELETE |

## Authentication

- **No public registration.** Accounts are created with `npm run admin:create` on the server.
- **Passwords:** argon2id (`@node-rs/argon2`) with m=19 MiB, t=2, p=1 (the OWASP baseline). Each
  hash is a PHC string, so the parameters can be raised later. New passwords need 12–256
  characters and must not be repetitive (NIST SP 800-63B style). Pasting and password managers
  are supported.
- **Uniform failures:** unknown users, deactivated users and wrong passwords all return
  "Incorrect username or password". An unknown user still costs one argon2 verification, so timing
  does not reveal valid usernames. The audit log records the internal reason.
- **Throttling** (`src/lib/auth/rate-limit.ts`):
  - At most 5 failures per username in 15 minutes. This is the primary control and cannot be
    bypassed by changing IP. While blocked, even the correct password is refused, so a locked
    account cannot be used to test passwords.
  - At most 20 failures per IP in 15 minutes. This applies only when `TRUST_PROXY=true`, because
    without a trusted proxy the `X-Forwarded-For` header is client-controlled. (Next.js keeps a
    client-supplied value.)
  - Trade-off: someone who knows a username can lock that account for 15 minutes. That is
    acceptable for a small admin team; there is no permanent lockout.

## Sessions

- Random 256-bit token in an `httpOnly` cookie: `SameSite=Lax`, `Path=/`, and in production
  `Secure` with the `__Host-` prefix.
- The database stores only **SHA-256(token)**, so a database leak does not yield usable sessions.
- Idle timeout 2 hours (sliding; activity is written at most every 5 minutes). Absolute lifetime
  12 hours.
- A session is rejected and deleted when it has expired, the admin is deactivated, or the
  password changed after the session was created.
- Sign-out deletes the server-side session; replaying the old cookie fails (covered by an e2e
  test).

## Authorization

- Roles OWNER > ADMIN > MODERATOR > VIEWER map to explicit permissions in
  `src/lib/permissions/index.ts`. Least privilege: new accounts default to VIEWER.
- **Every page and server action checks its own permission** through the data-access layer
  (`src/lib/auth/dal.ts`). `proxy.ts` only does an optimistic redirect when no cookie is present.
  The admin layout check is not relied on either, because layouts do not re-run on every client
  navigation.
- Denials are written to the audit log (`access.denied`).

## Request integrity

- **CSRF:** mutations use Server Actions (POST only). Next.js rejects a Server Action whose
  `Origin` does not match the host. `SameSite=Lax` cookies add a second layer. GET requests have
  no side effects.
- **Open redirects:** the post-login `next` parameter must be a known admin path
  (`safeRedirectPath`, unit-tested against `//host`, `/\host`, schemes, CR/LF).
- **Validation:** every input is parsed with Zod on the server (`src/lib/validation`). Oversized
  input is rejected before hashing.
- **No arbitrary code execution:** the Roblox interface accepts a closed set of typed commands.
  There is no way to send Lua or free-form commands (`src/services/roblox/types.ts`).

## Headers

Set in `next.config.ts` and `src/proxy.ts`:

- `Content-Security-Policy` with a per-request nonce for scripts (`'strict-dynamic'`, no
  `unsafe-inline` scripts; `unsafe-eval` only in development), plus `frame-ancestors 'none'`,
  `form-action 'self'`, `object-src 'none'` and `base-uri 'self'`
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`,
  `Cross-Origin-Opener-Policy: same-origin`, a restrictive `Permissions-Policy`
- `Strict-Transport-Security` in production builds
- `X-Powered-By` removed; pages are `Cache-Control: no-store`

## Audit log

- Records sign-in success, failure and throttling; sign-out; access denials; and every CLI
  account change. Later phases add configuration, reward, moderation, event and integration
  events.
- Fields: UTC timestamp, actor id and username snapshot, action, target type/id, result,
  correlation id, IP (marked unverified unless behind a trusted proxy), and redacted details.
- **Append-only:** the application has no update or delete code path, and SQLite triggers abort
  any `UPDATE` or `DELETE` on `AuditLog` (tested).
- Details are redacted: keys that look like passwords, tokens, secrets, API keys, cookies or
  sessions are replaced with `[redacted]`. Values are size-capped.

## Secrets

- Server-only environment variables, validated by `src/lib/env.ts`. Nothing secret is prefixed
  `NEXT_PUBLIC_`.
- Modules that touch the database or credentials import `server-only`, so importing them from a
  client component fails the build.
- Phase 1 needs no secrets at all: session tokens are random and verified against the database,
  not signed with a key.

## Revoking compromised credentials

**An administrator's password may be compromised:**

1. `npm run admin -- reset-password --username <name>`. This sets a new password, invalidates
   all of that admin's sessions, and is audited.
2. Review the audit log for that admin's recent `auth.login` and other actions.

**An administrator account must be blocked immediately:**

1. `npm run admin -- deactivate --username <name>`. Sign-in is blocked and every session is
   revoked. (The last active OWNER cannot be deactivated.)

**All sessions must be dropped (e.g. a suspected cookie leak):**

1. Run `npm run admin -- revoke-sessions --username <name>` for each admin, or stop the app and
   delete all rows from the `Session` table.

**Roblox Open Cloud API key (Phase 4):**

1. Revoke or regenerate the key in the Roblox Creator Dashboard (Open Cloud → API Keys).
2. Update `ROBLOX_OPEN_CLOUD_API_KEY` on the server and restart.
3. Check the audit log for `integration.*` events in the exposure window.

**Shared secret between the game and the backend (Phase 4, if that design is chosen):** rotate it
in both the Roblox experience Secrets store and the server environment. Support for two active
secrets during rotation will be designed in Phase 4.

## Pre-deployment checklist (Phase 5)

- [ ] HTTPS only, with a valid certificate; HSTS enabled (production build)
- [ ] `NODE_ENV=production`, so cookies are `Secure`/`__Host-`
- [ ] No DEMO data in the production database (`db:seed` refuses under production)
- [ ] Persistent storage for the database, with backups (SQLite on ephemeral serverless disks loses data)
- [ ] `TRUST_PROXY` set correctly for the hosting platform
- [ ] Only real administrator accounts exist; OWNER count reviewed
- [ ] `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` set if running more than one instance
- [ ] Rate limits reviewed for the hosting setup (SQLite-backed limits are per database)
- [ ] Roblox API keys scoped to the minimum operations and to the specific experience, with an
      expiry and IP restriction where possible
- [ ] Dependency audit (`npm audit`) reviewed
