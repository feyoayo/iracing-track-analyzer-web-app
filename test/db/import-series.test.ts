// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseSeasonImport } from "@/scripts/db/import-series";

const sample = {
  seasonSlug: "2026-season-4", seasonName: "2026 Season 4",
  series: [{ seriesName: "GT3 Open", seriesClass: "Sports Car", weeks: [
    { trackId: 10, trackName: "Spa", weekNumber: 1, raceDate: "2026-09-15" },
    { trackId: 20, trackName: "Monza", weekNumber: 2, raceDate: "2026-09-22" },
  ] }],
};
describe("schedule import validation", () => {
  it("preserves a valid schedule and date-only values", () => {
    expect(parseSeasonImport(sample)).toEqual(sample);
  });
  it("applies existing series category corrections", () => {
    const input = structuredClone(sample);
    input.series[0].seriesName = "BMW M2 Cup"; input.series[0].seriesClass = "Other";
    expect(parseSeasonImport(input).series[0].seriesClass).toBe("Sports Car");
  });
  it.each([null, {}, { ...sample, series: [] }, { ...sample, seasonSlug: "bad" }])("rejects malformed season %j", input => {
    expect(() => parseSeasonImport(input)).toThrow();
  });
  it.each(["2026-02-30", "2026-13-01", "2026-09-15T00:00:00Z", ""])("rejects invalid date %s", raceDate => {
    const input = structuredClone(sample); input.series[0].weeks[0].raceDate = raceDate;
    expect(() => parseSeasonImport(input)).toThrow();
  });
  it("rejects duplicate series and weeks", () => {
    expect(() => parseSeasonImport({ ...sample, series: [...sample.series, ...sample.series] })).toThrow();
    const input = structuredClone(sample); input.series[0].weeks[1].weekNumber = 1;
    expect(() => parseSeasonImport(input)).toThrow();
  });
  it.each(["Unknown", ""])("rejects unsupported category %s", seriesClass => {
    const input = structuredClone(sample); input.series[0].seriesClass = seriesClass;
    expect(() => parseSeasonImport(input)).toThrow();
  });
  it.each([0, -1, 1.5, 2147483648])("rejects invalid week %s", weekNumber => {
    const input = structuredClone(sample); input.series[0].weeks[0].weekNumber = weekNumber;
    expect(() => parseSeasonImport(input)).toThrow();
  });
});
