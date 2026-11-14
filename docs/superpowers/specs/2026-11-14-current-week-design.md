# Current week and past weeks

Approved in chat on 2026-11-14.

Show the season name above the current week and its date range in the shared header. Derive the common weekly season calendar from parsed dates; filter individual series by dates, since their round numbers can differ. Use UTC midnight for date-only schedule boundaries; retain the entire current seven-day week. Show explicit before-season/after-season states.

Add a small muted Include past weeks checkbox above analysis, off by default. Recompute table tracks, overlap, priority and summary from remaining dates. Keep the checkbox reachable when no remaining races exist. Excel continues to receive the unfiltered analysis.

Persist guests in localStorage. Authenticated users use an account preference, with account value taking priority; initialize absent account preference from guest choice. Show a small retryable error if saving fails.

Approaches: a prominent switch versus a quiet checkbox; user selected the checkbox. Account persistence uses Supabase user metadata for this non-security preference, avoiding a database migration; authorization always uses verified identity. Do not change Excel implementation or parsed data.
