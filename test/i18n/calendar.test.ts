import { describe, expect, it } from "vitest";
import { getSeasonWeekLabel } from "@/lib/analysis/seasonWeek";
import { formatRaceDate } from "@/lib/i18n/messages";
import season from "../fixtures/prepared-data/schedules/2026-season-3.json";

describe("localized calendar", () => {
  it("localizes week labels and dates using the selected language", () => {
    const date = new Date(`${season.series[0].weeks[0].raceDate}T12:00:00Z`);
    expect(getSeasonWeekLabel(season, date, "uk")).toMatch(/^Тиждень 1 ·/);
    expect(getSeasonWeekLabel(season, date)).toMatch(/^Week 1 ·/);
    expect(formatRaceDate("2026-06-16", "uk")).toContain("черв.");
    expect(formatRaceDate("undated", "uk")).toBe("undated");
  });
});
