# Prisma database workflow

Prisma owns future application migrations. Supabase still owns PostgreSQL hosting
and Auth. Node 20.19+, 22.12+, or 24+ is required; use Node 24 LTS.
Use npm and commit package-lock.json. Do not maintain a second yarn lockfile.

Copy .env.example to .env.local. DATABASE_URL is a server-only runtime connection;
DIRECT_URL is a direct/session migration connection. Existing process variables
win over .env.local, which wins over .env. Generation and validation are offline;
migration commands require DIRECT_URL. Never expose these URLs as NEXT_PUBLIC_.

npm install and npm run build generate the client only. They never run migrations.
See the adoption and integration instructions below before changing any database.

For a provider-specific trusted root, set `DATABASE_SSL_CA_FILE` to the local CA
file. Runtime/import connections use strict verification. Migration commands use
`scripts/db/prisma-cli.mjs`: a loopback-only bridge verifies the remote TLS CA and
hostname, avoiding native platform trust differences. Use `npm run db:cli -- ...`
instead of invoking Prisma directly when that CA is configured. Provision the
public CA file separately in deployed environments; `ssl-cert/` is Git-ignored.

## Runtime roles and connections

Use a dedicated `NOINHERIT NOBYPASSRLS` login for DATABASE_URL, with permission
to assume **only** `anon` and `authenticated`. Provision its password out of band,
then grant membership using a database administrator:

```sql
-- app_runtime is a pre-created LOGIN with NOINHERIT NOBYPASSRLS.
GRANT anon, authenticated TO app_runtime;
```

Do not use the migration/table-owner login as the runtime login. The application
sets the role inside every transaction and sets transaction-local JWT subject
and claims from the server-verified Auth user. A failed role switch fails the
operation. Pool size is bounded to five connections per process; multiply by the
number of application instances when sizing your Supabase connection budget.
Use a transaction pooler for runtime when appropriate; DIRECT_URL must use a
direct or session connection for migration tools. Preserve TLS certificate checks.

Existing RLS policies remain enabled. The baseline explicitly grants the minimum
operations the app uses, without revoking existing Supabase default grants.
Feedback uses INSERT without RETURNING; preference enabling uses INSERT ON
CONFLICT DO NOTHING, so it needs neither an UPDATE policy nor an UPDATE grant.
Do not replace those calls with default returning inserts/upserts casually.

## New, empty Supabase environment

1. Provision a disposable Supabase project/local Supabase instance. Its `auth`
   schema, `auth.users`, `auth.uid()`, `anon` and `authenticated` must already exist.
2. Set DIRECT_URL to that environment's administrator direct/session connection.
3. Run `npm run db:migrate:deploy`, then `npm run db:migrate:status`.
4. Provision the runtime login described above and set DATABASE_URL accordingly.
5. Configure the Supabase Auth public variables and Google provider as described
   in the root README.

`0_init` preserves the four old SQL migrations, including their profile backfill,
CHECK constraints, RLS, FK deletion actions and application signup/update triggers.
It does not install Supabase itself. Do not deploy it to plain PostgreSQL without
first creating a Supabase-compatible infrastructure.

## Existing Supabase database: adopt without resetting

Do this separately from application deployment. This branch does not adopt a live
database automatically. Back up the database and verify the actual database, not
just the repository SQL.

1. Create a **fresh disposable reference Supabase environment of the same
   PostgreSQL/Supabase version**, and deploy `0_init` there using step 3 above.
2. Set DIRECT_URL to the existing target and BASELINE_REFERENCE_URL to the fresh
   reference. They must be different databases. Then run:

   ```bash
   npm run db:verify-baseline
   ```

   This is read-only on both connections. It compares application columns,
   defaults, keys/checks/indexes, policies, grants, RLS flags, function definitions/owners and their effective profile-write privileges,
   trigger attachments and pgcrypto placement. It does not read application rows.
   A mismatch is an adoption blocker. Resolve the actual differences explicitly,
   review any changes, and rerun; never reset or blindly mark the baseline applied.
   Different default grants/extension placement may require aligning the reference
   environment or a reviewed correction rather than weakening the target.
3. After the comparison succeeds and the SQL baseline has been reviewed, record
   its history entry on the existing target:

   ```bash
   npm run db:cli -- migrate resolve --applied 0_init
   npm run db:migrate:status
   npm run db:migrate:deploy
   ```

   `resolve` records history; it does not execute table creation or backfill on
   existing data. `deploy` then applies only later unapplied migration files.
4. Configure DATABASE_URL for the application and verify the two-user integration
   scenarios before switching traffic. Keep the backup until acceptance.

Never run `prisma migrate reset` or `prisma db push` on the existing project.
Do not replay historical Supabase SQL after adopting Prisma.

## Future migrations and shadow database

The `auth.users` model is a partial external reference. Prisma's pinned
`externalTables` preview feature excludes that table from generated DDL. Supabase
owns its real structure and all other auth tables.

Generate migration SQL from **migration history to the application model**, not
by comparing the whole live auth schema to the partial model:

```bash
npm run db:migrate:create -- add_some_field
```

The command requires SHADOW_DATABASE_URL for a completely disposable **plain
PostgreSQL shadow database**. Never point it at a Supabase instance, live project,
or data you want to keep: Prisma resets shadow schemas. In the shadow cluster,
pre-create `anon` and `authenticated` roles. Its owner must be able to create
schemas, install pgcrypto, create functions/triggers and grant schema usage.
`prisma/shadow-init.sql` recreates the minimal auth dependencies after shadow
reset (id, email, metadata and auth.uid); it is a migration simulation, not an
Auth server or a production bootstrap.

This is a deliberate refinement of the design's Supabase-compatible shadow
requirement: compatibility is provided by the explicit shadow initializer,
rather than by resetting a full Supabase project's internal schemas.

Generation writes a new migration file only; it never deploys migrations or
resets the configured DIRECT_URL database. It rejects generated auth-object DDL.
Inspect every SQL file before applying it to a disposable development database:

- Keep auth-owned objects untouched; only application FK references and the
  existing application-owned signup trigger may mention auth.users.
- Preserve custom CHECKs, RLS policies, functions, grants and triggers. Prisma
  cannot infer these from the model. Add/update their custom SQL explicitly when
  changing related columns or tables.
- Every new public table needs appropriate RLS and grants in the same migration.
- Use `npm run db:migrate:deploy` explicitly after review/testing. Never append
  it to install, build, start or client-generation scripts.

Do not run `prisma migrate dev` against a full Supabase schema with this partial
Auth model. Its drift workflow may include Supabase objects the app does not own.
Keep Prisma CLI/client/adapter patch versions synchronized and reverify generated
SQL when upgrading the external-table preview feature.

## Series and schedule rollout

`20261115101103_create_series_schedule` adds `seasons`, `series`, and
`series_weeks`. It includes RLS, read-only public grants, category/week CHECKs,
the one-current-season partial index, and a same-season `linked_to` relation.
It does not import schedule rows. Installation/build/start never run it.

After adopting `0_init` on an existing project (above), or deploying migrations
to an empty environment, run the backfill separately using an administrator's
`DIRECT_URL`:

```bash
npm run db:migrate:deploy
npm run db:backfill-series -- test/fixtures/bootstrap-schedules --current 2026-season-4
npm run db:migrate:status
```

Expected source counts before any later schedule changes:

| Season | Series | Weeks |
| --- | ---: | ---: |
| 2025 Season 4 | 99 | 1310 |
| 2026 Season 1 | 110 | 1296 |
| 2026 Season 2 | 108 | 1424 |
| 2026 Season 3 | 109 | 1442 |
| 2026 Season 4 | 112 | 1478 |
| Total | 538 | 6950 |

Verify on the target:

```sql
SELECT s.slug, s.is_current,
       count(DISTINCT r.id) AS series_count, count(w.series_id) AS week_count
FROM public.seasons s
LEFT JOIN public.series r ON r.season_id = s.id
LEFT JOIN public.series_weeks w ON w.series_id = r.id
GROUP BY s.id ORDER BY s.year, s.season_number;
```

Configure the restricted `DATABASE_URL` runtime role described above and verify
series browsing, planning/export, and track detail pages before deploying
application traffic or removing source schedules. Future imports use
`db:import-series -- <file> [--current]`; importing a future schedule does not
automatically select it. Initial links are NULL; configure confirmed pairs
explicitly. Re-imports preserve links unless their target is removed.

Prisma warns that composite `SetNull` contains required `season_id`. The reviewed
migration uses PostgreSQL's `ON DELETE SET NULL (linked_to)` column list: only
the optional link is cleared. Prisma cannot express that column list, so preserve
the custom SQL when generating future relation changes. The schema and history
have been checked with `prisma migrate diff`; do not replace this FK with the
default full-column SetNull DDL.

The baseline verifier intentionally compares only the four original application
tables and their associated objects, for safe legacy adoption. It does not prove
the new schedules are migrated or populated; use schedule tests and the explicit
count/read checks above for that.

## Tests

Offline checks:

```bash
npm run db:validate
npm run db:generate
npx tsc --noEmit
npm run test
npm run lint
npm run build
```

The normal suite includes API authentication/validation/errors, page fallbacks,
scoped repositories, context setup and migration-tool guards. Schedule tests use
pinned PGlite (embedded PostgreSQL) with real Prisma connections to check the new
SQL migration, permissions, links, transactional imports, all five source seasons,
and PDF orchestration with a fake analyzer. They require local loopback socket
access; a restricted sandbox may need permission to run `npm test`.
The suite excludes live Supabase integration tests. Embedded tests do not prove
Supabase Auth behavior or real multi-session locking under concurrency.

For real integration tests, provision **two fresh, empty disposable Supabase
environments** matching the deployed PostgreSQL version. They must contain no
application tables or Prisma history. The suite intentionally refuses to reuse
an existing application database. Reset/recreate only these disposable environments
before another run; successful runs leave the application schema/history in them.

Set the test variables from `.env.example`:

- TEST_DATABASE_ACK=`disposable` acknowledges disposable targets.
- TEST_DATABASE_URL is the first environment's runtime-role URL.
- TEST_DIRECT_URL is the same database's administrator direct/session URL.
- TEST_BASELINE_DIRECT_URL is the second environment's administrator URL.
- TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_ROLE_KEY belong to the first
  disposable project's Auth service, for creating/deleting fixture users. Never
  expose the test administrator key in browser variables.
- SHADOW_DATABASE_URL points to the disposable shadow described above, for
  history-to-model drift verification.

URLs must differ from configured live DATABASE_URL/DIRECT_URL. Supabase project
references are recognized across direct and shared-pooler connections, so changing
only the database role/password/connection mode does not bypass this check. Unset live
variables in the test shell if necessary; do not relabel a live URL as TEST_*.
The runtime URL must connect to the same underlying database as TEST_DIRECT_URL;
a cross-connection advisory-lock check verifies that before writes begin.

```bash
npm run test:integration
```

The suite replays the Prisma baseline in the first environment, independently
replays the legacy SQL in the second, checks catalog equivalence, adopts the
legacy baseline and confirms fixture preservation. It also checks policy/column
drift detection, two Auth users' RLS isolation, duplicate toggles, feedback inserts with SELECT explicitly revoked, single-connection identity cleanup after success/failure, profile
triggers and deletion behavior. Fixture users/feedback are cleaned up; schema and
migration history remain in these disposable projects.

A missing test configuration fails the integration command explicitly. Do not
report integration checks as passing until this command actually succeeds.
