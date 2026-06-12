import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { analyzeSchedule } from "@/lib/analysis/analyzeSchedule";
import { parsePreparedSeason } from "@/lib/data/loaders";

const season = parsePreparedSeason(
  readFileSync(
    path.join(
      process.cwd(),
      "test/fixtures/prepared-data/schedules/2026-season-3.json",
    ),
    "utf8",
  ),
);

describe("analyzeSchedule", () => {
  it("matches the python semantics for selected series", () => {
    const result = analyzeSchedule(season, ["GT Sprint", "GT3 Fixed"]);

    expect(result.seriesNames).toEqual(["GT Sprint", "GT3 Fixed"]);
    expect(result.tracks).toEqual([
      {
        trackId: 10,
        trackName: "Spa-Francorchamps",
        totalCount: 2,
        classCounts: { "Sports Car": 2 },
        seriesWeeks: {
          "GT Sprint": [1, "2026-06-16"],
          "GT3 Fixed": [4, "2026-07-07"],
        },
        priority: "Optional",
        priorityColor: "E8F5E9",
      },
      {
        trackId: 11,
        trackName: "Watkins Glen",
        totalCount: 1,
        classCounts: { "Sports Car": 1 },
        seriesWeeks: {
          "GT Sprint": [2, "2026-06-23"],
        },
        priority: "Optional",
        priorityColor: "E8F5E9",
      },
    ]);
  });
});
