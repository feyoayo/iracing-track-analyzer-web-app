# Changelog

## Unreleased

### Added

- Current season week and date range in the shared season card, calculated from
  parsed schedule dates and refreshed automatically.
- A discreet `Include past weeks` checkbox for track overlap analysis, with past
  weeks hidden by default and the current week retained. Preferences are saved
  to signed-in accounts or guest browser storage; Excel exports remain unchanged.
- GitHub Actions CI runs automated tests for pull requests to `main` and pushes
  to `main`.

### Changed

- Track counts, overlap, and priorities now reflect the displayed schedule dates.
- Browser selection storage tolerates unavailable storage and invalid saved data.
- Replaced Supabase Data API queries with Prisma for favorite series, owned tracks,
  and feedback, preserving Supabase Auth and row-level access policies. Added
  Prisma migrations, baseline adoption tooling, and automated tests.
