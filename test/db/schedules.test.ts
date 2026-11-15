// @vitest-environment node
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { normalizePreparedSeason } from "@/lib/data/seriesClassOverrides";
import type { PreparedSeason } from "@/lib/types";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { createSchedulePrisma } from "../helpers/schedule-prisma";
const boundary = vi.hoisted(() => ({ client: null as PrismaClient | null }));
vi.mock("@/lib/db/client", () => ({ getPrisma: () => boundary.client }));
import { getCurrentPreparedSeason } from "@/lib/db/schedules";
import { importSeason } from "@/scripts/db/import-series";

const sample = {
  seasonSlug: "2026-season-4", seasonName: "2026 Season 4",
  series: [
    { seriesName: "GT3 Open", seriesClass: "Sports Car", weeks: [
      { trackId: 20, trackName: "Monza", weekNumber: 2, raceDate: "2026-09-22" },
      { trackId: 10, trackName: "Spa", weekNumber: 1, raceDate: "2026-09-15" },
    ] },
    { seriesName: "GT3 Fixed", seriesClass: "Sports Car", weeks: [
      { trackId: 10, trackName: "Spa", weekNumber: 1, raceDate: "2026-09-15" },
    ] },
  ],
};
let fixture: Awaited<ReturnType<typeof createSchedulePrisma>>;
beforeAll(async () => { fixture = await createSchedulePrisma(); boundary.client = fixture.prisma; }, 30000);
beforeEach(async () => { await fixture.prisma.series.deleteMany(); await fixture.prisma.season.deleteMany(); });
afterAll(async () => { await fixture?.close(); });

it("round trips schedules through Prisma and anonymous RLS with sorted weeks", async () => {
  await importSeason(fixture.prisma, sample, { makeCurrent: true });
  const result = await getCurrentPreparedSeason();
  expect(result).toMatchObject({ seasonSlug: "2026-season-4", seasonName: "2026 Season 4" });
  expect(result.series.map(s => s.seriesName)).toEqual(["GT3 Fixed", "GT3 Open"]);
  expect(result.series[1].weeks).toEqual([
    { trackId: 10, trackName: "Spa", weekNumber: 1, raceDate: "2026-09-15" },
    { trackId: 20, trackName: "Monza", weekNumber: 2, raceDate: "2026-09-22" },
  ]);
});
it("imports idempotently, preserves links and replaces stale schedules", async () => {
  await importSeason(fixture.prisma, sample, { makeCurrent: true });
  const open = await fixture.prisma.series.findFirstOrThrow({ where: { name: "GT3 Open" } });
  await fixture.prisma.series.updateMany({ where: { name: "GT3 Fixed" }, data: { linkedTo: open.id } });
  await importSeason(fixture.prisma, sample, { makeCurrent: false });
  expect(await fixture.prisma.series.count()).toBe(2);
  expect(await fixture.prisma.seriesWeek.count()).toBe(3);
  expect((await fixture.prisma.series.findFirstOrThrow({ where: { name: "GT3 Fixed" } })).linkedTo).toBe(open.id);
  const changed = structuredClone(sample); changed.series[0].weeks = [changed.series[0].weeks[1]];
  await importSeason(fixture.prisma, changed, { makeCurrent: false });
  expect(await fixture.prisma.seriesWeek.count()).toBe(2);
  await importSeason(fixture.prisma, { ...sample, series: [sample.series[1]] }, { makeCurrent: false });
  expect(await fixture.prisma.series.count()).toBe(1);
  expect((await fixture.prisma.series.findFirstOrThrow()).linkedTo).toBeNull();
});
it("does not switch current season when importing future data without --current", async () => {
  await importSeason(fixture.prisma, sample, { makeCurrent: true });
  const future = { ...sample, seasonSlug: "2027-season-1", seasonName: "2027 Season 1" };
  await importSeason(fixture.prisma, future, { makeCurrent: false });
  expect((await getCurrentPreparedSeason()).seasonSlug).toBe("2026-season-4");
  await importSeason(fixture.prisma, future, { makeCurrent: true });
  expect((await getCurrentPreparedSeason()).seasonSlug).toBe("2027-season-1");
});
it("rejects malformed input before writing and rolls back failures inside an import", async () => {
  await importSeason(fixture.prisma, sample, { makeCurrent: true });
  await expect(importSeason(fixture.prisma, { ...sample, series: [] }, { makeCurrent: true })).rejects.toThrow();
  // Inject an application exception after DELETE, keeping the transaction real.
  // PGlite's socket bridge cannot recover from wire-protocol SQL errors.
  const failingClient = fixture.prisma.$extends({ query: { seriesWeek: {
    async createMany() { throw new Error("Interrupted import"); },
  } } }) as unknown as PrismaClient;
  const broken = structuredClone(sample); broken.seasonName = "Should roll back";
  await expect(importSeason(failingClient, broken, { makeCurrent: true })).rejects.toThrow("Interrupted import");
  expect((await getCurrentPreparedSeason()).seasonName).toBe("2026 Season 4");
  expect(await fixture.prisma.series.count()).toBe(2);
  expect(await fixture.prisma.seriesWeek.count()).toBe(3);
});
it("reports a missing current season and does not fall back to local JSON", async () => {
  await expect(getCurrentPreparedSeason()).rejects.toThrow(/current season/i);
});

it("backfills all five production schedules without losing series, weeks or date values", async () => {
  for (const [slug, seriesCount, weekCount] of [
    ["2025-season-4", 99, 1310], ["2026-season-1", 110, 1296],
    ["2026-season-2", 108, 1424], ["2026-season-3", 109, 1442], ["2026-season-4", 112, 1478],
  ] as const) {
    const original = JSON.parse(readFileSync(`test/fixtures/bootstrap-schedules/${slug}.json`, "utf8")) as PreparedSeason;
    await importSeason(fixture.prisma, original, { makeCurrent: true });
    const result = await getCurrentPreparedSeason();
    expect(result.series).toHaveLength(seriesCount);
    expect(result.series.reduce((n, s) => n + s.weeks.length, 0)).toBe(weekCount);
    const expected = normalizePreparedSeason(original);
    for (const series of expected.series) {
      const actual = result.series.find(s => s.seriesName === series.seriesName);
      expect(actual?.seriesClass).toBe(series.seriesClass);
      expect(actual?.weeks).toEqual([...series.weeks].sort((a, b) => a.weekNumber - b.weekNumber));
    }
  }
  expect(await fixture.prisma.season.count()).toBe(5);
  expect(await fixture.prisma.series.count()).toBe(538);
  expect(await fixture.prisma.seriesWeek.count()).toBe(6950);
}, 60000);
