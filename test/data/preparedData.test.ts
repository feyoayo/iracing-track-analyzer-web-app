// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const source = vi.hoisted(() => ({ read: vi.fn(), connection: vi.fn() }));
vi.mock("@/lib/db/schedules", () => ({ getCurrentPreparedSeason: source.read }));
vi.mock("next/server", () => ({ connection: source.connection }));
vi.mock("@/data/tracks-index.json", () => ({ default: { tracks: [
  { trackId: 10, trackName: "Spa", seasonName: "2027 Season 1", seriesName: "Stale", seriesClass: "Other", weekNumber: 1, raceDate: "2027-01-01" },
  { trackId: 10, trackName: "Spa", seasonName: "2026 Season 4", seriesName: "History", seriesClass: "Sports Car", weekNumber: 1, raceDate: "2026-09-15" },
] } }));
import { getLatestPreparedData } from "@/lib/data/preparedData";

beforeEach(() => {
  vi.clearAllMocks();
  source.read.mockResolvedValue({ seasonSlug: "2027-season-1", seasonName: "2027 Season 1", series: [
    { seriesName: "New", seriesClass: "Formula", weeks: [
      { trackId: 99, trackName: "New Track", weekNumber: 1, raceDate: "2027-01-12" },
    ] },
  ] });
});
it("uses the database current season and replaces stale current-season track history", async () => {
  const result = await getLatestPreparedData();
  expect(result.metadata).toEqual({ latestSeasonSlug: "2027-season-1", latestSeasonName: "2027 Season 1" });
  expect(result.season.series[0].seriesName).toBe("New");
  expect(result.tracksIndex.tracks).toEqual([
    { trackId: 99, trackName: "New Track", seasonName: "2027 Season 1", seriesName: "New", seriesClass: "Formula", weekNumber: 1, raceDate: "2027-01-12" },
    { trackId: 10, trackName: "Spa", seasonName: "2026 Season 4", seriesName: "History", seriesClass: "Sports Car", weekNumber: 1, raceDate: "2026-09-15" },
  ]);
  expect(source.connection).toHaveBeenCalledOnce();
  expect(source.connection.mock.invocationCallOrder[0]).toBeLessThan(source.read.mock.invocationCallOrder[0]);
});
it("propagates database failure without returning bundled schedules", async () => {
  source.read.mockRejectedValue(new Error("database unavailable"));
  await expect(getLatestPreparedData()).rejects.toThrow("database unavailable");
});
