import { describe, expect, it } from "vitest";
import { getSeasonWeekLabel } from "@/lib/analysis/seasonWeek";
import { analyzeSchedule } from "@/lib/analysis/analyzeSchedule";
import { season } from "@/test/fixtures/weeklySeason";



describe("season dates", () => {
  it.each([
    ["2026-11-02T23:59:59Z", "Season starts Nov 3"],
    ["2026-11-09T23:59:59Z", "Week 1 · Nov 3–9"],
    ["2026-11-10T00:00:00Z", "Week 2 · Nov 10–16"],
    ["2026-11-16T23:59:59Z", "Week 2 · Nov 10–16"],
    ["2026-11-24T00:00:00Z", "Season completed"],
  ])("derives the common season week at %s", (date, label) => {
    expect(getSeasonWeekLabel(season, new Date(date))).toBe(label);
  });
  it("handles missing calendar dates", () => {
    expect(getSeasonWeekLabel({ ...season, series: [] }, new Date())).toBe("Schedule dates unavailable");
  });
  it("filters dates rather than round numbers and recalculates overlap", () => {
    const result = analyzeSchedule(season, ["Weekly", "Special"], new Date("2026-11-14T12:00:00Z"));
    expect(result.tracks.map(t => [t.trackId, t.totalCount])).toEqual([[3, 2], [2, 1]]);
    expect(result.tracks[1].seriesWeeks).toEqual({ Weekly: [2, "2026-11-10"] });
    expect(analyzeSchedule(season, ["Weekly", "Special"]).tracks).toHaveLength(3);
    expect(season.series[0].weeks).toHaveLength(3);
  });
  it("retains a round through its last instant and removes it at the boundary", () => {
    expect(analyzeSchedule(season, ["Weekly"], new Date("2026-11-09T23:59:59Z")).tracks).toHaveLength(3);
    expect(analyzeSchedule(season, ["Weekly"], new Date("2026-11-10T00:00:00Z")).tracks).toHaveLength(2);
  });
  it("returns no upcoming tracks after the season", () => {
    expect(analyzeSchedule(season, ["Weekly"], new Date("2026-12-01")).tracks).toEqual([]);
  });
  it("keeps rounds with unknown dates rather than silently hiding them", () => {
    const undated = { ...season, series: [{ ...season.series[0], weeks: [{ ...season.series[0].weeks[0], raceDate: "" }] }] };
    expect(analyzeSchedule(undated, ["Weekly"], new Date("2026-12-01")).tracks).toHaveLength(1);
  });
});
