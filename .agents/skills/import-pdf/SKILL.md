---
name: import-pdf
description: "Use when the user wants to add or update an iRacing season schedule from a PDF, refresh web data, or import a new season. Runs the Python parser from ../iracing-track-analyzer and writes JSON into ./data."
---

# Import season PDF

```bash
bun scripts/import-pdf.ts <schedule.pdf> [--season "2026 Season 4"]
```

- Season name is derived from a filename like `2026s4.pdf`; pass `--season` otherwise.
- Requires the analyzer repo at `../iracing-track-analyzer` (override with `ANALYZER_DIR`) with its `venv` installed.
- Re-running on the same PDF is safe (SQLite uses `INSERT OR IGNORE`).
- After it finishes, review `git diff data/` and commit the JSON.
