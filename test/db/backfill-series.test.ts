// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { readSeasonImports } from "@/scripts/db/backfill-series";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
it("loads all five bootstrap schedules and imports the explicitly current one last", () => {
  const seasons = readSeasonImports("test/fixtures/bootstrap-schedules", "2026-season-4");
  expect(seasons.map(s => s.seasonSlug)).toEqual(["2025-season-4", "2026-season-1", "2026-season-2", "2026-season-3", "2026-season-4"]);
  expect(seasons.map(s => s.series.length)).toEqual([99, 110, 108, 109, 112]);
});
it("rejects a missing current season or empty source directory", () => {
  expect(() => readSeasonImports("test/fixtures/bootstrap-schedules", "2099-season-1")).toThrow(/current/i);
  const directory = mkdtempSync(join(tmpdir(), "iracing-backfill-")); directories.push(directory);
  expect(() => readSeasonImports(directory, "2026-season-4")).toThrow();
});
it("rejects malformed input before backfill can write any seasons", () => {
  const directory = mkdtempSync(join(tmpdir(), "iracing-backfill-")); directories.push(directory);
  writeFileSync(join(directory, "bad.json"), '{"seasonSlug":"2026-season-4"}');
  expect(() => readSeasonImports(directory, "2026-season-4")).toThrow();
});
