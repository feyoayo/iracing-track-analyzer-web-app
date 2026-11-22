# Analysis Filter Dialog Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement inline. Steps use checkbox syntax for tracking.

**Goal:** Give the analysis table full width and stage all filters in a modal, with useful defaults for users without saved settings.

**Architecture:** AppClient owns applied selection and preferences. AnalysisFilterDialog owns temporary selection; AnalysisFilters renders searchable class/series controls. AppShell renders one full-width card; AnalysisTable accepts toolbar controls.

**Tech Stack:** React 19, existing Radix Dialog, TypeScript, Vitest/Testing Library.

**Spec:** docs/superpowers/specs/2026-11-22-analysis-filter-dialog-design.md

## Global Constraints

- Preserve favorites, URL classes, intentionally empty settings and full-season Excel export.
- No database changes or new dependencies.
- Installed Next.js has no dist/docs directory; use existing React patterns without changing Next.js APIs.

## Review Focus

- Users with empty saved selection must not be reset to Sports Car.
- Dialog cancellation must not change local storage, URL or week preferences.
- Shared class links take precedence over saved class choices.
- Search must not discard hidden selections.
- Controls must remain usable with short mobile viewports and keyboard focus.

### Task 1: Defaults and staged filters

**Files:** AppClient.tsx, AnalysisFilters.tsx, new AnalysisFilterDialog.tsx, AppShell.tsx, AnalysisTable.tsx under components; test/app/class-selection.test.tsx, week-filter.test.tsx, page.test.tsx.

- [x] Add tests for all Sports Car defaults, saved empty selections, draft Apply/Cancel, search and preference staging; run and observe expected failures.
- [x] Implement the dialog and full-width table toolbar. Preserve persistence logic, changing only the absent-settings fallback.
- [x] Adapt existing class and week UI tests to opening and applying the dialog.
- [x] Run affected tests, full suite, lint and TypeScript checking; inspect desktop/mobile UI when available.
- [x] Review the final diff and record verification results. Leave changes reviewable in the working tree.

## Verification

- New dialog tests: observed five failures before implementation, then five passes.
- Affected UI tests: 18 passed.
- Full suite: 32 files, 200 tests passed. Initial sandbox run blocked local test-server binds; rerun outside sandbox passed.
- `npm run lint`, `npx tsc --noEmit` and `git diff --check`: passed.
- Playwright with headless installed Chrome against user-started localhost:3000: passed desktop 1440×1000, mobile 390×844 and short 667×375 viewport checks. Confirmed 43 default Sports Car selections, no sidebar/page overflow, Cancel, Apply, Escape/focus restoration, search, explicitly empty selection after reload and no browser page errors.
- Screenshots inspected at `/private/tmp/iracing-ui-check/`: desktop, modal desktop, mobile, modal mobile and short modal.
- Browser-only Playwright dependencies and screenshots stay in temporary storage; repository dependencies unchanged.
- Independent final code review: no significant issues found. Changes remain uncommitted for review in the current workspace.
