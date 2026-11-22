# Series database design

Status: three-table approach approved in conversation on 2026-11-15.

## Intent and scope

Make Supabase Postgres the source of truth for seasons, series, and their weekly
schedules, using the existing Prisma integration. Preserve the current browsing,
filtering, analysis, and Excel export behavior. This first migration does not add
an administration UI or migrate the track catalog or user preferences.

## Approaches

- A JSON document per season in Postgres would require fewer application changes,
  but would retain document-level validation and make schedule queries and
  updates less convenient.
- Separate seasons, series, and series_weeks tables provide relational constraints
  and allow querying individual schedules and track appearances. This is the
  approved approach.
- A permanent series catalog plus a season-membership table would support stable
  identity across seasons, but requires identity and rename rules that the
  current source data does not supply. Defer this additional table.

## Tables

All listed columns are NOT NULL unless explicitly marked nullable. Integer entity IDs are database-generated
primary keys, using identity columns. These are application IDs, not iRacing API
series IDs.

### public.seasons

| Column | PostgreSQL type | Constraints |
| --- | --- | --- |
| id | integer | Identity primary key |
| slug | text | Unique, nonblank; e.g. 2026-season-4 |
| name | text | Nonblank; e.g. 2026 Season 4 |
| year | integer | Positive |
| season_number | integer | Between 1 and 4 |
| is_current | boolean | Default false |

Unique `(year, season_number)`. A unique partial index on `is_current WHERE
is_current` permits at most one current season. A successful bootstrap/import
must designate a current season; the reader reports missing current data rather
than silently choosing an arbitrary season. The pointer is explicit because a
future schedule can be imported before it becomes current.

### public.series

| Column | PostgreSQL type | Constraints |
| --- | --- | --- |
| id | integer | Identity primary key |
| season_id | integer | Foreign key to seasons.id |
| name | text | Nonblank |
| category | text | Formula, Sports Car, Oval, or Other |
| linked_to | integer | Nullable reference to another series.id in the same season; default NULL |

Unique `(season_id, name)` also provides the index for season lookups. A series
appearing in two seasons has two rows. Names and classification belong to that
season's snapshot. Use a text CHECK constraint for the existing four categories;
adding a category requires an explicit migration.

`linked_to` identifies a related variant, such as a fixed-setup series linked to
its open-setup counterpart. Store the target row's ID rather than its name. For
example, an open series with id 101 has linked_to NULL, and its fixed variant
with id 102 has linked_to 101. The direction is stored once; a reader can find
related variants through incoming or outgoing links. Multiple variants may link
to the same target, so linked_to is not unique.

Enforce that the target exists, belongs to the same season, and is not the
source row itself. Index `(season_id, linked_to)` for reverse lookups. Deleting
a target clears only linked_to on its referring rows; it does not delete those
series or change their season. Implement the same-season relationship with a
composite foreign key to `(season_id, id)` and a supporting unique constraint.
The custom deletion action must clear only the nullable linked_to column.

This first step stores the relationship as metadata. Each variant retains its
own name, category, weeks, selection, and favorites. Sharing a schedule or
deduplicating analysis results would be a separate behavior decision. Readers
must not recursively follow links to resolve schedules, so links do not create
schedule inheritance.

The existing source JSON does not identify pairs. Initially import linked_to as
NULL and populate confirmed pairs explicitly; do not infer them from similar
names. Re-importing a surviving series preserves its configured link. Removing
a linked target clears the reference as described above.

### public.series_weeks

| Column | PostgreSQL type | Constraints |
| --- | --- | --- |
| series_id | integer | Foreign key to series.id |
| week_number | integer | Positive |
| track_id | integer | Existing source identifier |
| track_name | text | Nonblank imported name |
| race_date | date | Existing source raceDate, without timezone conversion |

Primary key `(series_id, week_number)`. Index `track_id` for track usage queries.
There is no tracks foreign key while the track catalog remains local. Retain the
imported track name as the schedule snapshot. Do not impose a 12-week limit:
the source includes special and endurance calendars.

The builder's proposed deletion rule is RESTRICT from seasons to series and
CASCADE from series to weeks: removing an entire season requires an explicit
operation, while replacing a series' weeks remains straightforward.

## Access and integrity

Enable RLS on all three public tables. Grant SELECT to anon and authenticated
with SELECT policies using true: this is public schedule data. Explicitly revoke
other privileges from PUBLIC, anon, and authenticated on these new tables,
including privileges inherited from Supabase default grants. Imports use a
server-only administrator connection; ordinary app users cannot modify schedules.

Keep the existing withDatabaseIdentity(null, ...) transaction boundary for
public application reads. Do not introduce a service key into browser code.

## Application integration

Continue returning PreparedSeason, mapping category to seriesClass and database
dates to YYYY-MM-DD. Read the current season and its ordered series/weeks in a
consistent database transaction. Preserve the existing category corrections on
import. Database errors must not silently fall back to bundled schedule JSON.

The shared getLatestPreparedData loader is used by series, planning, tracks,
profile, and auth-error pages. Updating it affects all those callers. Use Next.js
15 request-time rendering so builds do not need database access and imported
changes become visible without a rebuild. The installed Next.js 15.3.8 package
does not contain node_modules/next/dist/docs; consult the official version 15
documentation before changing rendering behavior.

Track history in data/tracks-index.json remains local for this first step. Any
current-season track usage must continue to agree with the migrated schedules.
Favorites remain keyed by series name, retaining their existing behavior.

## Import and rollout

1. Create a new Prisma migration containing tables, constraints, indexes, RLS,
   and grants. Preserve the existing baseline and Supabase-owned auth objects.
2. Add a validating, repeatable importer for the existing PreparedSeason format.
   Re-importing a season updates it without duplicates and removes stale weeks
   and series inside one transaction. Validate the whole input before writing.
3. Backfill all five existing season files. Retain the selected current season
   from metadata, currently 2026-season-4. Check per-season series/week counts,
   normalized categories, and representative schedule results.
4. Update reads and the PDF workflow to use the database. PDF parser output can
   be temporary import input; it must no longer be committed runtime storage.
5. Remove production schedule JSON only after the backfill and database reads
   have been verified. JSON test fixtures may remain.

Design approval itself did not change the live database. The authorized rollout
was subsequently completed on 2026-11-15; see
docs/superpowers/verification/2026-11-15-series-rollout.md. Application deployment
must follow migration and backfill, not precede them.

## Verification

Test constraints, uniqueness, public reads, denied public writes, repeat imports,
stale-week removal, transaction rollback, and the one-current-season rule against
a disposable database. Test valid variant links, missing/cross-season/self-link
rejection, multiple variants referencing one target, link preservation on
re-import, and reference clearing on target deletion. Compare imported schedules with the existing source and
run the existing analysis, track usage, Excel, and page tests. Run Prisma
validation/generation, TypeScript, lint, and build. Report unavailable live or
integration checks explicitly.
