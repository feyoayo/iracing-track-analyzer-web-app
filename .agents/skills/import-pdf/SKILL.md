---
name: import-pdf
description: "Use when the user wants to add or update an iRacing season schedule from a PDF, refresh web data, or import a new season. Runs the external Python parser and imports the selected schedule into Postgres."
---

# Import season PDF

```bash
npm run import-pdf -- <schedule.pdf> [--season "2026 Season 4"] [--current]
```

- Season name is derived from a filename like `2026s4.pdf`; pass `--season` otherwise.
- Requires the analyzer repo at `../iracing-track-analyzer` (override with `ANALYZER_DIR`) with its `venv` installed.
- Requires server-only `DIRECT_URL` and applied Prisma schedule migrations.
- Output schedules are temporary; only the selected season is imported into Postgres.
- The current season changes only with explicit `--current`.
- Re-imports preserve configured `linked_to` values on surviving series and replace stale weeks transactionally.
- The analyzer's SQLite staging uses insert-ignore behavior. Corrected PDFs may require correcting staging data first; investigate duplicate-week validation failures rather than ignoring them.
- Other seasons' database schedules and local track history are preserved.
- After it finishes, verify database schedules and review `git diff data/tracks-index.json`. Commit the historical track index while tracks remain local; do not commit schedule JSON.
