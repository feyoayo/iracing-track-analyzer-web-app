# Series Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bundled series and schedule data with verified Postgres reads.

**Architecture:** Model seasons, seasonal series, and weekly schedules in Prisma.
Import prepared schedule data with an administrator connection, and expose public
reads through the application's existing role-scoped transaction boundary. Keep
the PreparedSeason interface so clients and analysis algorithms remain compatible.

**Tech Stack:** Next.js 15.3.8, Prisma 7.10.1, Supabase Postgres, TypeScript, Vitest.

**Spec:** docs/superpowers/specs/2026-11-15-series-database-design.md

## Global Constraints

- All new application migrations belong in prisma/migrations; never alter 0_init.
- Do not modify Supabase-owned auth objects or reset an existing database.
- Public schedules are readable by anon and authenticated; only an administrator
  import connection writes them.
- Track catalog/history and existing name-based favorites retain their current
  storage for this first migration.
- series.linked_to is a nullable, indexed, same-season self-reference. It marks
  related variants without merging their schedules, selection, or favorites.
- Never remove production JSON before verifying database backfill and reads.
- Installation, generation, build, and start must not apply migrations or imports.
- Read applicable Next.js documentation before changing code. The installed
  package lacks node_modules/next/dist/docs, so use official version 15 docs.

## Review Focus

- Importing a future season must not automatically switch the current season.
- A malformed or interrupted re-import must leave the previous schedule intact.
- Corrected imports must remove stale weeks without duplicating series.
- Date-only values must survive import/read round trips without timezone shifts.
- Every shared-loader caller must work at request time without database access
  during builds; current-season track history must not contradict new schedules.

---

### Task 1: Schema and access rules

**Files:**
- Modify: prisma/schema.prisma
- Create: prisma/migrations/<generated_timestamp>_create_series_schedule/migration.sql
- Create: test/integration/series-schedules.test.ts
- Modify: test/integration/setup.ts, test/integration/migrations.test.ts as needed

**Interfaces:**
- Produces Prisma models Season, Series, SeriesWeek, mapped to public.seasons,
  public.series, public.series_weeks exactly as specified.
- Produces SQL CHECKs, the partial current-season index, RESTRICT/CASCADE FKs,
  and public read-only grants/policies not representable in the Prisma model.
- Series includes linkedTo: number | null mapped to linked_to, with a same-season
  self-relation, a unique (season_id, id) target key, an index on
  (season_id, linked_to), and a CHECK rejecting linked_to = id. Custom SQL must
  clear only linked_to when its target is deleted, retaining season_id.

- [ ] Write integration tests: duplicate season/series/week fails; two current
  seasons fail; invalid category and week zero fail; anon/authenticated can read
  imported fixtures but cannot INSERT, UPDATE, DELETE, or TRUNCATE schedules.
- [ ] Test nullable links and multiple variants pointing to one target; reject
  missing targets, cross-season links, and self-links. Deleting a target must
  clear referring links while preserving the referring series and their weeks.
- [ ] Run against fresh disposable targets and confirm failures from missing
  schedule tables before adding schema.
- [ ] Add Prisma models and generate migration using the repository migration
  workflow with a disposable shadow. Review custom SQL and auth-object guard.
- [ ] Preserve baseline-adoption testing: compare the legacy environment to a
  baseline-only reference before applying later migrations. Do not compare old
  legacy schema against a reference already containing the new tables.
- [ ] Run schema integration tests and a history-to-model drift check; expect
  passing constraints/RLS tests and no unexpected modeled DDL.
- [ ] Run npm run db:validate and npm run db:generate; expect success.

### Task 2: Validated transactional import

**Files:**
- Create: scripts/db/import-series.ts
- Create: test/db/import-series.test.ts
- Extend: test/integration/series-schedules.test.ts
- Modify: package.json

**Interfaces:**
- Consumes PreparedSeason and the Task 1 models.
- Produces parseSeasonImport(input: unknown): PreparedSeason and
  importSeason(db: PrismaClient, season: PreparedSeason,
  options: { makeCurrent: boolean }): Promise<void>.
- CLI: npm run db:import-series -- <schedule.json> [--current]. Uses DIRECT_URL;
  errors must not print connection strings or credentials.

- [ ] Test valid source, invalid calendar date, duplicate series/week, missing
  fields, and unsupported category. Assert rejection before any writes.
- [ ] Run tests and confirm the absent importer fails them.
- [ ] Implement complete validation and existing category normalization; use
  date-only UTC conversions and one transaction per imported season.
- [ ] Test import twice yields unchanged counts; corrected import replaces stale
  rows; failed import rolls back; no --current preserves the current pointer;
  --current switches it atomically. Expect the same YYYY-MM-DD after reading.
- [ ] Implement writes keyed by season slug and seasonal series name. Preserve
  surviving series IDs, replace their weeks, and remove obsolete series.
  Serialize current-pointer changes so concurrent imports cannot unset it.
- [ ] Preserve linked_to on surviving series during re-import; new source rows
  start unlinked. Test that removing a target clears referring links. Existing
  source files provide no pair mapping, so do not guess links from names.
- [ ] Run importer unit/integration tests; expect all passing.

### Task 3: Request-time reads and compatible application data

**Files:**
- Create: lib/db/schedules.ts
- Modify: lib/data/preparedData.ts
- Create: test/db/schedules.test.ts
- Modify: test/app/data-loading.test.tsx and affected page tests
- Extend: test/integration/series-schedules.test.ts

**Interfaces:**
- Produces getCurrentPreparedSeason(): Promise<PreparedSeason> through
  withDatabaseIdentity(null, ...).
- Preserves getLatestPreparedData() return shape: metadata, season, tracksIndex.
  Metadata's current season comes from Postgres; track history remains local.

- [ ] Write read tests: expected names/categories/weeks/date strings, deterministic
  ordering, missing-current error, and propagated database failure.
- [ ] Run read tests and confirm they fail before implementing the repository.
- [ ] Implement the mapping and request-time loader using Next.js 15 connection()
  before database access. Do not add a persistent cache in this first pass.
- [ ] Test all shared-loader page callers, including anonymous requests, against
  injected schedule data. Ensure current-season track usage reflects database
  data when the retained historical index contains older current-season rows.
- [ ] Run existing analysis, workbook, tracks, and page tests; expect unchanged
  user-visible calculations and no missing schedule props.
- [ ] Build without DATABASE_URL configured; expect success without attempting
  database reads during prerendering.

### Task 4: Backfill, PDF workflow, and rollout

**Files:**
- Modify: scripts/import-pdf.ts, README.md, prisma/README.md
- Modify: .agents/skills/import-pdf/SKILL.md to reflect the new workflow
- Remove after verified backfill: data/schedules/*.json
- Retain: test/fixtures/prepared-data/schedules/*.json

**Interfaces:**
- Consumes Task 2 import CLI and Task 3 database reader.
- Produces a PDF refresh workflow that imports temporary parser output into
  Postgres without keeping production series JSON in the repository.

- [ ] Capture independent source counts and representative weekly schedules for
  all five seasons before removal. Record normalization differences explicitly.
- [ ] Apply the reviewed migration to a disposable environment and import all
  five source files, designating metadata.latestSeasonSlug as current.
- [ ] Query per-season counts and compare read results, dates, and normalized
  classifications with the original files; expect complete agreement.
- [ ] Change the PDF exporter destination to a temporary directory; import
  schedules from that output. Preserve the separately retained local track
  history refresh. Future-season imports require an explicit current selection.
- [ ] Document baseline adoption, migration, import, runtime role configuration,
  verification, and app deployment in that order. No automatic live deployment.
- [ ] After the target backfill is verified, remove bundled schedules and any
  unused local metadata imports. Keep test fixtures and the track history index.
- [ ] Run npm run test, npm run lint, npx tsc --noEmit, npm run db:validate,
  npm run db:generate, npm run build, and npm run test:integration against the
  configured disposable targets. Record actual results and any unavailable
  checks before claiming completion.

## Current readiness

Implementation is present in the working tree. Schema, RLS, variant links,
transactional imports, all five source seasons, request-time loader behavior,
and PDF orchestration have been verified against disposable embedded PostgreSQL
and normal application tests. Migration history-to-schema diff is empty; the
production build succeeds without database access. See the execution record in
docs/superpowers/verification/2026-11-15-series-progress.md for evidence/limits.

Live rollout completed on 2026-11-15. The existing baseline was compared with a
disposable PostgreSQL reference and registered without replaying its SQL. The
schedule migration and a follow-up protection migration for Prisma metadata were
applied. All 5 seasons / 538 series / 6950 weeks were imported and compared with
the source, and prior application rows retain their original hashes.

The local runtime now uses a dedicated restricted role and verified TLS. Four
database-backed pages returned HTTP 200 in a production-mode local server.
Production schedules were moved from data/schedules to
test/fixtures/bootstrap-schedules. Hosted Auth integration/concurrency test
environments remain unconfigured; no public website deployment was performed.
