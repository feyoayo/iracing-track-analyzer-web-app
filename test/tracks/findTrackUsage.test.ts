import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parsePreparedSeason, parseTracksIndex } from "@/lib/data/loaders";
import {
  buildTrackDirectory,
  findTrackUsage,
  getTrackUsageById,
} from "@/lib/tracks/findTrackUsage";

const season = parsePreparedSeason(
  readFileSync(
    path.join(
      process.cwd(),
      "test/fixtures/prepared-data/schedules/2026-season-3.json",
    ),
    "utf8",
  ),
);

const index = parseTracksIndex(
  readFileSync(
    path.join(process.cwd(), "test/fixtures/prepared-data/tracks-index.json"),
    "utf8",
  ),
);

describe("findTrackUsage", () => {
  it("builds a directory of current-season tracks", () => {
    const tracks = buildTrackDirectory(season);

    expect(tracks[0]).toMatchObject({
      trackName: "Spa-Francorchamps",
      currentSeasonAppears: 2,
    });
    expect(tracks).toHaveLength(2);
  });

  it("returns current and historical appearances for one track", () => {
    const usage = findTrackUsage(season, index, "spa");

    expect(usage?.trackName).toBe("Spa-Francorchamps");
    expect(usage?.currentSeason).toHaveLength(2);
    expect(usage?.history).toHaveLength(2);
    expect(usage?.currentSeason[0].seriesName).toBe("GT Sprint");
  });

  it("returns null for an empty query", () => {
    expect(findTrackUsage(season, index, "   ")).toBeNull();
  });

  it("returns usage by track id", () => {
    const usage = getTrackUsageById(season, index, 10);

    expect(usage?.trackName).toBe("Spa-Francorchamps");
    expect(usage?.history).toHaveLength(2);
  });
});
