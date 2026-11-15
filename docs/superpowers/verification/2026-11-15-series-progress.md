# Execution ledger — plan: docs/superpowers/plans/2026-11-15-series-database.md

Current status: hosted rollout completed; see
docs/superpowers/verification/2026-11-15-series-rollout.md. The entries below
preserve the earlier implementation and local-verification stages.

- Baseline: 148 tests passed, one pre-existing failure in test/app/page.test.tsx
  expecting the removed text logo. The actual header is an image with an accessible
  home link. Update that stale assertion when adapting page tests.
- Ruling: Work in the existing development checkout, preserving untracked yarn.lock;
  no new worktree or branch is necessary for these authorized local changes.
- Ruling: Docker remains inaccessible even outside the sandbox. Use pinned PGlite
  with its PostgreSQL socket for disposable schema/import/Prisma verification.
  This proves application SQL behavior, but does not replace hosted Supabase Auth
  integration tests or multi-session concurrency tests.
- Pre-flight: importer and repository consume the schema from Task 1; the shared
  loader consumes the repository. Keep their PreparedSeason boundary unchanged.
- No live writes have been performed. Local env has public Auth settings only;
  the hosted project still contains only the four existing application tables.

## Implementation and evidence

- Task 1 implemented: generated Prisma schema delta, reviewed identity columns,
  partial current index, CHECKs, RLS/read-only grants and same-season links.
  New schema tests first failed on missing tables, then passed. The migration
  preserves the baseline and auth-owned objects.
- Ruling: Initial SQL was generated with Prisma's offline schema-to-schema diff
  against the original committed schema, since Docker/shadow access was initially
  unavailable. Subsequently replayed the complete migration history with a local
  embedded shadow (including pgcrypto/auth initializer); history-to-model diff
  returned an empty migration (exit 0).
- Prisma validate succeeds with an expected SetNull warning: the model cannot
  express PostgreSQL's column-specific SET NULL (linked_to). The migration
  preserves required season_id and the deletion tests prove it.
- Task 2 implemented: full validation before writes, per-season transaction,
  global import advisory lock, explicit current selection, stable series IDs,
  preserved links, stale row replacement, sanitized CLI errors, directory backfill.
- Task 3 implemented: anonymous RLS reads, repeatable-read snapshots, request-time
  rendering using Next.js 15 connection(), database metadata, chronological
  current-season history reconciliation. Existing preference behavior remains.
- Task 4 workflow implemented: PDF output is temporary; imports only the selected
  season and atomically replaces that season's local track history. Updated
  README and import skill. JSON removal and hosted backfill remain pending.
- Full source round trip: 5 seasons, 538 series, 6950 weeks; dates, names, normalized
  categories and every series' weeks match the source. Sources retained for rollout.
- Rollback tests inject an application failure into a real Prisma transaction.
  PGlite's socket bridge cannot recover from SQL error protocol messages; SQL
  constraint errors are independently tested through direct embedded Postgres.
- Independent review identified three PDF/history issues: historical loss on
  partial export, unrelated-season overwrite, and reversed history ordering.
  All three were reproduced with tests and corrected in one review fix pass.
  PDF workflow tests run real fake Python parser/exporter processes and real
  Prisma imports; they do not prove the external analyzer's PDF decoding.
- Existing external analyzer insert-ignore behavior can retain old rows for
  corrected PDFs. Documented this existing staging limitation rather than changing
  the separate analyzer project.
- One verification run raced build-time Prisma regeneration and could not load
  generated files. Subsequent full-suite verification runs after generation.
- Hosted integration command fails explicitly because TEST_DATABASE_ACK and
  disposable TEST_* targets are absent. Real Supabase Auth and multi-session
  concurrency checks have not run. No live schedule migration/backfill is claimed.

## Final local verification

- `npm test -- --reporter=dot`: 29 files, 190 tests passed (after build generation).
- `npx tsc --noEmit`: exit 0.
- `npm run lint`: exit 0.
- `npm run db:validate`: exit 0, expected documented composite SetNull warning.
- `npm run build`: exit 0; all schedule-backed pages are dynamic and no database
  credentials were needed during the build.
- Complete history-to-model migration diff: exit 0, empty migration.
- `git diff --check`: exit 0.
- `npm run test:integration`: not verified; fails configuration guard because no
  disposable Supabase TEST_* environment is configured.

Remaining: configure runtime/migration connections, safely adopt the existing
Prisma baseline, deploy migration and backfill on the intended target, verify
hosted reads/counts, then remove bootstrap schedules. Changes remain uncommitted
in the existing checkout; the user's pre-existing yarn.lock is untouched.
