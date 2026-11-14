# Changelog

## Unreleased

### Added

- GitHub Actions CI runs automated tests for pull requests to `main` and pushes
  to `main`.

### Changed

- Replaced Supabase Data API queries with Prisma for favorite series, owned tracks,
  and feedback, preserving Supabase Auth and row-level access policies. Added
  Prisma migrations, baseline adoption tooling, and automated tests.
