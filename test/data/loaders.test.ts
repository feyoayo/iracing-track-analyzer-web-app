import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  parsePreparedMetadata,
  parsePreparedSeason,
  parseTracksIndex,
} from "@/lib/data/loaders";

describe("prepared data loaders", () => {
  it("parses metadata for the latest season", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "test/fixtures/prepared-data/metadata.json"),
      "utf8",
    );

    const parsed = parsePreparedMetadata(raw);

    expect(parsed.latestSeasonSlug).toBe("2026-season-3");
    expect(parsed.latestSeasonName).toBe("2026 Season 3");
  });

  it("parses the latest season payload", () => {
    const raw = readFileSync(
      path.join(
        process.cwd(),
        "test/fixtures/prepared-data/schedules/2026-season-3.json",
      ),
      "utf8",
    );

    const parsed = parsePreparedSeason(raw);

    expect(parsed.seasonSlug).toBe("2026-season-3");
    expect(parsed.series[0].seriesName).toBe("GT Sprint");
    expect(parsed.series[0].weeks[0].trackName).toBe("Spa-Francorchamps");
  });

  it("parses the track index payload", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "test/fixtures/prepared-data/tracks-index.json"),
      "utf8",
    );

    const parsed = parseTracksIndex(raw);

    expect(parsed.tracks[0].trackName).toBe("Spa-Francorchamps");
    expect(parsed.tracks[1].seasonName).toBe("2026 Season 2");
  });
});
