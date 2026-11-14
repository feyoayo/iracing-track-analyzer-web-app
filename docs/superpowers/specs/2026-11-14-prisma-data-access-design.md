# Prisma data access and migrations

## Intent and scope

Replace Supabase Data API queries with Prisma ORM and make Prisma Migrate the
owner of future application database migrations. The user chose both queries
and migrations. Work on `codex/prisma-data-access`.

Keep the existing Supabase PostgreSQL database, Supabase Auth, Google login,
current UI, API payloads, and prepared season JSON files. Preserve existing data.
No production reset or automatic migration as part of application startup/build.

## Current application

- Three pages load favorite series and/or owned tracks for the signed-in user.
- Two API routes read and toggle those preferences.
- One API route accepts anonymous or authenticated feedback.
- Four SQL files define profiles, feedback, owned tracks, and favorite series,
  including RLS policies, foreign keys to auth.users, and profile triggers.
- Profiles currently have no application queries; still represent their schema.
- No database connection environment files or installed dependencies are present
  in this checkout. Live schema equivalence has not been verified.

## Approaches

1. Prisma queries with Supabase-owned migrations: smaller change, two tools to
   understand. Not selected because the user also wants Prisma migrations.
2. Prisma queries and Prisma Migrate on existing Supabase: selected. Requires a
   baseline and explicit preservation of SQL features Prisma cannot represent.
3. Move hosting or authentication too: unnecessary expansion; excluded.

## Data access and authorization

Use a server-only, lazily initialized Prisma client with connection reuse during
development. Choose a pinned supported Prisma version compatible with the
project's Node/Next.js/TypeScript versions during implementation.

Centralize favorite-series, owned-tracks, and feedback operations in server-only
data functions. Verify identity with Supabase Auth on the server; never accept
the acting user ID from request JSON. Scope reads/deletes to that user and use
composite keys for idempotent preference writes. Preserve current validation,
JSON response shapes, anonymous page defaults, and generic API failure messages.
Preserve the pages' current empty-list fallback on database read failures.

Keep RLS effective for Prisma operations: run application queries in an interactive
transaction under the fixed `authenticated` or `anon` PostgreSQL role and set
transaction-local JWT subject/claims from the verified server identity. Use
parameterized values and fixed SQL role names. No request-controlled role or
metadata-based permissions. Context must not survive transaction completion or
leak through pooled connections. Authenticate before starting a user transaction.
Anonymous feedback uses the anon role; authenticated feedback uses the verified
user ID. Runtime credentials must be able to assume these roles; document this
requirement and fail closed if it is unmet. Never disable RLS to make queries work.

## Schema and migration ownership

Map Prisma models to existing public table/column names, UUIDs, timestamps,
nullable fields, defaults and composite primary keys. Preserve foreign keys and
delete actions against Supabase-managed auth.users; Prisma must not create,
alter or delete Supabase-owned auth tables. The implementer chooses the supported
Prisma mechanism for external references and verifies migration output for drift.

Create a checked-in initial Prisma SQL baseline from the repository's four SQL
files. Include CHECK constraints, RLS policies, profile synchronization and update
triggers, functions, extensions and backfill behavior. Ensure dependency order
works on a fresh Supabase database. Fresh means a Supabase environment with its
auth schema and roles already installed, not a plain empty PostgreSQL instance.

For an existing database, first compare its actual application schema and custom
SQL objects against the baseline. Only when equivalent mark the baseline applied
with Prisma's supported migration-history command; do not execute CREATE TABLE
over existing data. If live access is unavailable, deliver the baseline and exact
verification/adoption instructions and clearly report that adoption remains
unverified. Do not silently assume the live database matches repository SQL.

Retain old Supabase migration files as historical references, label them retired,
and direct all future application migrations to Prisma. Policies, triggers and
cross-schema foreign keys remain custom SQL in Prisma migrations. Document review
of generated SQL so future diffs cannot remove them or touch auth-owned objects.
Use a separate direct/session connection for migration tooling and a pooled
runtime connection where appropriate. Local migration development requires a
disposable Supabase-compatible shadow environment, separate from live databases.

## Delivery and verification

Provide scripts for client generation, schema validation, migration creation,
status and deployment; document environment variables, existing-database adoption,
fresh Supabase setup, shadow requirements, and future custom SQL migrations.
Client generation must work during install/build without contacting a database.
Do not require database credentials merely to browse anonymous static data.

Read the installed Next.js documentation before editing Next.js code. If the
required packaged guides are absent, consult official version-appropriate docs
and record that limitation.

Test authentication rejection, user scoping, idempotent toggles, anonymous and
authenticated feedback, transaction-local identity/role setup and error handling.
Run schema validation, generation, TypeScript checks, existing tests, lint and
production build. When a disposable Supabase database is available, verify fresh
migration replay, baseline adoption, RLS isolation between two users, and context
cleanup across pooled transactions. Otherwise explicitly report these database
checks as unrun and provide a repeatable integration verification procedure.

## Implementation decisions delegated

Exact compatible package versions, adapter/pool sizing, names of helper modules,
and test organization. No schema redesign, UI changes, deployment, or hosting
migration is included. Any discovered live schema difference must be reconciled
before marking its baseline applied.

## References

- https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/baselining
- https://supabase.com/docs/guides/database/prisma
