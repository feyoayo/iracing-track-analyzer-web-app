# Prisma Data Access and Migrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace application Supabase Data API calls with Prisma and adopt Prisma Migrate without losing existing data or database authorization.

**Architecture:** Keep Supabase PostgreSQL and Auth. Server-only repositories use a lazy Prisma client through transactions that assume a fixed database role and install verified transaction-local identity. An initial SQL baseline preserves application tables, policies and triggers; existing databases adopt it only after equivalence checks.

**Tech Stack:** Next.js 15.3.8, React 19.1.0, TypeScript, Vitest 1.6, Prisma ORM 7 with its PostgreSQL adapter, PostgreSQL/Supabase. Resolve and pin matching Prisma 7 patch versions during setup; do not implicitly install a different major.

**Spec:** `docs/superpowers/specs/2026-11-14-prisma-data-access-design.md`

## Global Constraints

- Work on `codex/prisma-data-access`.
- Preserve existing data.
- No production reset or automatic migration as part of application startup/build.
- Keep the existing Supabase PostgreSQL database, Supabase Auth, Google login, current UI, API payloads, and prepared season JSON files.
- Verify identity with Supabase Auth on the server; never accept the acting user ID from request JSON.
- Never disable RLS to make queries work.
- Prisma must not create, alter or delete Supabase-owned auth tables. The existing application signup trigger attached to auth.users is preserved as explicit custom SQL, not generated auth-table DDL.
- Client generation must work during install/build without contacting a database.
- Do not require database credentials merely to browse anonymous static data.
- Read relevant guides in `node_modules/next/dist/docs/` before changing Next.js code. If absent after installing the locked Next version, record absence and consult official Next.js 15 docs.
- Real database checks require disposable Supabase environments. Missing credentials are a reported verification limitation, never grounds to claim those checks passed.

## Review Focus

1. Switching users on a reused connection must never retain the previous user's identity (Tasks 2 and 6).
2. Repeated preference writes must succeed under the existing INSERT/SELECT/DELETE policies without UPDATE permission (Tasks 3 and 6).
3. Feedback insertion must work without SELECT permission or RETURNING; a blank optional name must become null to satisfy the existing CHECK (Tasks 3–4 and 6).
4. A missing database URL must allow anonymous pages and offline generation while database operations fail without leaking credentials (Tasks 1, 2 and 5).
5. Adopting a database with schema drift must stop before recording the baseline, and future diffs must preserve auth references (Tasks 1 and 6).

## File Map and Dependencies

- `prisma/schema.prisma`: four public application models and minimal external auth user reference model.
- `prisma.config.ts`: environment loading, CLI connection, external-table exclusion, shadow URL.
- `prisma/migrations/0_init/migration.sql`, `migration_lock.toml`: initial application SQL history.
- `lib/db/client.ts`: lazy server-only Prisma singleton and bounded adapter pool.
- `lib/db/context.ts`: transaction-local role and identity boundary.
- `lib/db/preferences.ts`, `feedback.ts`: focused data operations.
- Existing `app/api/{owned-tracks,favorite-series,feedback}/route.ts`: HTTP validation, authentication, response contracts.
- Existing `app/{page,tracks/page,series/page}.tsx`: server loading through repositories.
- `test/db/`, `test/api/`, `test/app/data-loading.test.tsx`: unit/route/page regression tests.
- `test/integration/`, `vitest.integration.config.ts`: opt-in real database checks, excluded from the ordinary suite.
- `scripts/db/verify-baseline.ts`: read-only baseline equivalence verification.
- `scripts/db/expected-schema.sql`: catalog queries for application objects, not a database dump containing user data.
- `prisma/README.md`, root and Supabase READMEs, `.env.example`: setup and ownership handoff.
- `package.json`, one canonical lockfile, `.gitignore`, Vitest configuration: dependencies, scripts, generated output exclusions.

Task 1 precedes 2; 2 precedes 3; 3 precedes 4 and 5; 6 validates their combined behavior. Keep work sequential by default.

### Task 1: Model the Existing Database and Establish Migration History

**Files:** Create `prisma/schema.prisma`, `prisma.config.ts`, `prisma/migrations/0_init/migration.sql`, `prisma/migrations/migration_lock.toml`, `prisma/README.md`, `.env.example`; modify `package.json`, the canonical lockfile and `.gitignore`.

**Interfaces:** Produce Prisma models `Profile`, `Feedback`, `UserOwnedTrack`, `UserFavoriteSeries`, and external `AuthUser`. Preference keys are `(userId, trackId)` and `(userId, seriesName)`; all names map to existing SQL identifiers. `DATABASE_URL` is runtime-only server configuration; `DIRECT_URL` is the CLI connection and `SHADOW_DATABASE_URL` is disposable migration infrastructure.

- [ ] Read the approved spec, current SQL files and package configuration. Install existing dependencies, choose one lockfile workflow consistent with the repository, and record baseline test/lint/build results before implementation. Do not silently upgrade Next.js or Supabase.
- [ ] Verify compatible Prisma 7 package engine requirements and external-table support from versioned official documentation/CLI help. Pin `prisma`, `@prisma/client`, `@prisma/adapter-pg` to matching patches; pin driver/support dependencies. Record Node requirements.
- [ ] Define the four public models with exact UUID/native timestamp types, nullability, database defaults, composite keys and FK delete/update behavior. Model minimal `auth.users` fields needed for references, mark `auth.users` external in Prisma config, and enable the required externalTables flag. Do not use `@@ignore` as a substitute for migration exclusion.
- [ ] Configure generated client output outside browser code, ignore generated files, and load `.env.local` and `.env` explicitly with process environment taking precedence. Permit offline validate/generate with no credentials; database commands must require a real explicit connection and never default to production or a silently usable local database.
- [ ] Build `0_init` from existing SQL in dependency order: extension, public tables, functions, triggers/backfill, constraints, policies and comments. Preserve SQL default expressions and existing constraint names. Explicitly include only grants required for the existing anon/authenticated policies; never add public SELECT on feedback. Preserve the existing signup trigger and its scoped function behavior.
- [ ] Document that fresh replay targets Supabase, not plain Postgres, and shadow replay needs a disposable Supabase-compatible environment containing auth roles/functions/table dependencies. Document any shadow initialization required by the selected CLI version; do not rely on auth surviving a shadow reset.
- [ ] Add scripts `db:generate`, `db:validate`, `db:migrate:create` (create-only), `db:migrate:deploy`, `db:migrate:status`. Run generation on install/build, never deploy migrations there. Document `prisma migrate resolve --applied 0_init` as a post-verification adoption action, not an automatic install script.
- [ ] Run `npm run db:validate` and `npm run db:generate` with database variables unset; expect successful offline completion. Inspect generated baseline SQL for auth DDL and accidental changes; reserve actual replay/drift verification for Task 6.
- [ ] Commit the schema, baseline, dependency/configuration and setup documentation changes as one reviewable unit.

### Task 2: Enforce User Context Around Prisma Queries

**Files:** Create `lib/db/client.ts`, `lib/db/context.ts`, `test/db/client.test.ts`, `test/db/context.test.ts`; adjust Vitest's test-only handling of `server-only` if necessary.

**Interfaces:** `getPrisma(): PrismaClient`; `withDatabaseIdentity<T>(userId: string | null, operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>`. Null means anon. Only the server authentication boundary supplies user IDs. Repositories receive no unscoped public client accessor.

- [ ] Write failing tests with these assertions: importing modules does not construct/connect a client; absent runtime URL rejects only on access; repeated access reuses a client; a user operation sees fixed authenticated role plus the supplied subject; null sees anon plus no subject; context setup failure never invokes the operation; operation rejection propagates and closes the transaction. Assert user values are bound parameters, not interpolated SQL.
- [ ] Run `npm run test -- test/db/client.test.ts test/db/context.test.ts`; expect failures for missing implementations.
- [ ] Implement lazy server-only client creation with a bounded pool, finite connection/transaction timeouts, and development reuse. Keep credentials out of errors returned to users.
- [ ] Implement the identity helper using one interactive transaction, fixed `SET LOCAL ROLE authenticated`/`anon` statements and parameterized `set_config` calls for transaction-local JWT subject/claims. Install only verified sub/role, not arbitrary user metadata. Role assumption must fail closed. Do not expose the unrestricted client to API handlers or pages.
- [ ] Re-run the two test files; expect all assertions to pass. Actual role reset on pooled reuse is tested against PostgreSQL in Task 6, not inferred from mocks.
- [ ] Commit the transaction boundary and its tests.

### Task 3: Implement Preference and Feedback Repositories

**Files:** Create `lib/db/preferences.ts`, `lib/db/feedback.ts`, `test/db/preferences.test.ts`, `test/db/feedback.test.ts`.

**Interfaces:** `getOwnedTrackIds(userId: string): Promise<number[]>`; `setTrackOwned(userId: string, trackId: number, owned: boolean): Promise<void>`; `getFavoriteSeriesNames(userId: string): Promise<string[]>`; `setSeriesFavorite(userId: string, seriesName: string, favorite: boolean): Promise<void>`; `saveFeedback(input: { userId: string | null; name: string | null; message: string; pagePath: string | null }): Promise<void>`.

- [ ] Write failing repository tests: reads select only needed fields and filter by acting user; deletes include user and item; enabling uses duplicate-tolerant INSERT; disabling uses idempotent deleteMany; feedback uses the verified identity, null for blank name and a write without RETURNING. Assert each operation runs inside the Task 2 context, including anonymous feedback.
- [ ] Run `npm run test -- test/db/preferences.test.ts test/db/feedback.test.ts`; expect missing-module failures.
- [ ] Implement the interfaces with `findMany`, `createMany({ skipDuplicates: true })`, and `deleteMany` as appropriate. Preference writes must not rely on UPDATE policies. Feedback must not use `create` with implicit SELECT/RETURNING under an insert-only role. Let database failures propagate to callers.
- [ ] Re-run repository tests; expect pass. Use real duplicate/insert-only policy checks in Task 6.
- [ ] Commit repository implementation and tests.

### Task 4: Move the Three API Routes to Prisma

**Files:** Modify `app/api/owned-tracks/route.ts`, `app/api/favorite-series/route.ts`, `app/api/feedback/route.ts`; create `test/api/owned-tracks.test.ts`, `favorite-series.test.ts`, `feedback.test.ts`.

**Interfaces:** Preserve `GET/PUT /api/owned-tracks` (`trackIds`, `trackId`, `owned`), `GET/PUT /api/favorite-series` (`seriesNames`, `seriesName`, `favorite`), and `POST /api/feedback` (`message`, `name`, `pagePath`, `{ ok: true }`). Consume Task 3 repositories and existing verified `supabase.auth.getUser()`.

- [ ] Read relevant installed Next.js guides before editing handlers; use versioned official guides if the packaged directory is absent and record that fact.
- [ ] Write route tests: unauthenticated preference requests return 401 without repository calls; valid requests pass verified user IDs; a supplied JSON user_id is ignored; malformed JSON and invalid payloads return 400; database failures return existing generic 500 messages without credentials. Preserve Supabase-unconfigured handling.
- [ ] Add boundary tests: track IDs are positive integers, boolean fields are actual booleans, series names are trimmed/nonempty, feedback lengths 4/5/1000/1001, names 120/121; blank optional name is stored as null. Anonymous feedback has null userId; signed-in feedback has the verified ID; both return `{ ok: true }` on success.
- [ ] Run `npm run test -- test/api`; expect failures against unchanged behavior/data imports.
- [ ] Replace `.from(...)` queries with Task 3 calls, keeping validation and response shapes. Catch database exceptions, avoid returning raw exceptions, and remove the stateless Data API client from feedback. Keep Supabase clients needed for Auth.
- [ ] Re-run `npm run test -- test/api`; expect all assertions to pass.
- [ ] Commit the API migration and tests.

### Task 5: Move Server Page Loading to Prisma

**Files:** Modify `app/page.tsx`, `app/tracks/page.tsx`, `app/series/page.tsx`; create `test/app/data-loading.test.tsx`; retain `test/app/page.test.tsx`.

**Interfaces:** Preserve current component props and auth/header rendering. Main page consumes both read repositories concurrently; directory pages consume their respective repository. Anonymous users receive empty arrays and trigger no database initialization.

- [ ] Write page tests with mocked child components/repositories: anonymous pages render without any database URL or query; authenticated pages receive only that user's list; database rejection becomes the existing empty-list fallback; main page preserves successful owned tracks when favorite loading fails and vice versa.
- [ ] Run `npm run test -- test/app`; new tests must expose unchanged Data API loading while existing shell tests establish compatibility.
- [ ] Replace page Data API calls with scoped repository calls and independent per-list fallback, preserving parallel reads and all existing props. Continue verifying user identity server-side.
- [ ] Run `npm run test -- test/app`; expect all page/shell assertions to pass. Search `app`/`lib` for remaining application `.from(...)` or `.rpc(...)` data calls; expect none. Auth calls remain.
- [ ] Commit page migration and tests.

### Task 6: Verify Database Behavior and Document Adoption

**Files:** Create `vitest.integration.config.ts`, `test/integration/migrations.test.ts`, `rls.test.ts`, `scripts/db/verify-baseline.ts`, `scripts/db/expected-schema.sql`; modify `vitest.config.ts`, `package.json`, `prisma/README.md`, `README.md`, `supabase/README.md` and `.env.example`.

**Interfaces:** `npm run test:integration` runs opt-in Node-environment tests; `npm run db:verify-baseline` exits zero only when catalog checks match expected application schema/custom objects. Integration variables: `TEST_DATABASE_URL`, `TEST_DIRECT_URL` for one disposable Supabase environment and `TEST_BASELINE_DIRECT_URL` for a second disposable legacy-schema environment; fixture Auth admin variables are test-only. Require explicit test-target acknowledgement and distinct target URLs; do not log secrets or change a configured live database.

- [ ] Write failing migration tests: replay `0_init` on a clean disposable Supabase environment; independently build the legacy schema from the four historical SQL files on the other environment, insert fixtures, verify equivalence, resolve the baseline, and confirm a subsequent deploy preserves fixture rows. Change an application column or policy and assert equivalence verification fails before resolve. Verify migration history/status and no unexplained Prisma schema drift.
- [ ] Implement read-only catalog verification covering column types/defaults/nullability, PK/FK/check constraints/delete actions, grants, RLS flags/policy definitions, trigger attachments/functions and required extension. Compare semantic catalog values rather than raw formatting. Baseline equivalence compares schema and security objects, not user-row contents; test fixture preservation separately. Require human resolution of any mismatch, never auto-reset or auto-resolve.
- [ ] Add real RLS tests using two users created through Supabase Auth: each sees only their own preferences; direct attempted cross-user writes fail; repeated enable/disable operations succeed; anon can insert feedback but cannot read it; authenticated feedback records the verified user; profile signup/update triggers and user deletion FK actions remain correct.
- [ ] Add pool-size-one context tests: sequential A/B/anonymous operations and a failed transaction cannot leak subjects/roles; include overlapping operations for isolation. Verify insert-only feedback works without RETURNING and preference toggles need no UPDATE policy.
- [ ] Exclude integration tests from ordinary Vitest runs, set Node environment for them, add explicit target safeguards and fixture cleanup limited to test-created rows/users. Missing integration credentials must fail the explicitly invoked integration command clearly, not report successful skipped checks.
- [ ] Run `npm run test:integration` when disposable credentials are available. Otherwise record these checks as unrun and deliver exact provisioning/run instructions; do not infer database safety from mocked tests.
- [ ] Run a create-only migration diff on the disposable/shadow setup and inspect generated SQL: no auth-table DDL, dropped auth references, table recreation or unexpected schema changes. Document the external-table feature/version dependency. A minimal auth model is never permission to prune live auth columns.
- [ ] Document existing-database adoption: backup; inspect actual schema; run read-only verification; reconcile differences; only then resolve `0_init`; check status; deploy future migrations. Do not run resolve or deploy against live data as part of this implementation.
- [ ] Document fresh Supabase setup, separate runtime/migration roles and required role memberships/grants, offline generation, shadow reset behavior, and create-only SQL review for custom policies/triggers/checks. Label `supabase/migrations` historical/retired without deleting it. Explain generation/install/build versus explicit migration deployment.
- [ ] Run `npm run db:validate`, `npm run db:generate`, `npx tsc --noEmit`, `npm run test`, `npm run lint`, `npm run build`, and `git diff --check`. Report actual results, distinguish pre-existing failures, and never mark unrun integration tests passing.
- [ ] Review the complete branch for browser imports of database code, secrets, auth weakening and migration drift. Commit final verification tooling/docs and report what remains necessary to adopt the live database.

## Plan Self-Review

- Spec coverage: four models/custom SQL and adoption (1, 6), scoped runtime/pooling (2), preference/feedback behavior (3, 4), server page compatibility (5), setup/security/live limitations (6).
- Interfaces: Tasks 4–5 use only repository functions from Task 3; Task 3 uses the context from Task 2; generated names match Task 1.
- Review focus: each of the five conditions has unit or real database assertions assigned above.
- Implementation stays on the existing feature branch; no implementation or dependency installation is part of writing this plan.

## Reference Decisions

Prisma 7 supports external tables through `tables.external` and an experimental flag, including references from application tables to `auth.users`. This is the selected way to preserve cross-schema references without handing auth ownership to Prisma. Confirm the pinned patch's CLI behavior before execution:
https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/externally-managed-tables

Existing databases adopt the SQL baseline by marking it already applied after verification; they do not replay table creation:
https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/baselining
