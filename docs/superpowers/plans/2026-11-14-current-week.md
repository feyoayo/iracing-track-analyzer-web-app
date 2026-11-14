# Current Week Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show the current season week and optionally include completed weeks in analysis.
**Architecture:** Pure UTC date utilities derive season status and filter rounds before analysis. A shared header component and account-aware preference hook expose these in the existing UI; the unfiltered result still feeds Excel.
**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase Auth, Vitest.
**Spec:** docs/superpowers/specs/2026-11-14-current-week-design.md

## Global Constraints
- Small muted checkbox labeled Include past weeks, off by default.
- Excel behavior unchanged.
- Account preference takes priority; absent preference adopts guest value.
- Work in the current preview workspace; no new dependencies or schema changes.

## Review Focus
- Exact UTC boundary retains current week, excludes only completed rounds.
- Nonstandard rounds do not corrupt the common season calendar.
- Empty filtered table must retain its control.
- Storage failures must not prevent analysis.
- Failed account saves must surface and offer retry; account choice must not leak to guest storage.

### Task 1: Dates and analysis
- [x] Add failing tests in test/analysis/seasonWeek.test.ts for UTC boundaries, before/after season, nonstandard rounds, missing dates, and immutable filtering.
- [x] Implement lib/analysis/seasonWeek.ts and optional date cutoff in analyzeSchedule.
- [x] Run date and analysis tests.

### Task 2: Persistence
- [x] Add failing API and UI tests for authenticated validation, guest migration, account precedence, storage failures and failed saves.
- [x] Implement app/api/analysis-preferences/route.ts, lib/state/analysisPreferences.ts and components/analysis/useAnalysisPreference.ts; load initial value from verified user metadata in app/page.tsx.
- [x] Run persistence tests.

### Task 3: UI and verification
- [x] Add UI coverage for filtering, empty results, header dates and unchanged export input.
- [x] Add shared live clock/header status, quiet checkbox, and separate filtered/unfiltered results in AppClient.
- [x] Run full tests, lint, type checking, and browser verification.

## Validation

141 tests pass. ESLint, TypeScript, and git diff whitespace checks pass. Browser verification confirmed Week 9, switching 4/12 rounds, and guest persistence on reload. Account saving is covered with mocked Supabase API tests; no live account was available in the preview.

Implementation notes: user metadata stores only this display preference, never authorization. Stale preference responses are discarded on refreshed account props. Existing selection storage now tolerates blocked localStorage so analysis remains usable. Installed Next.js 15.3.8 does not ship node_modules/next/dist/docs; consulted official route-handler docs and existing route patterns instead.
