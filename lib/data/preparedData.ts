import metadata from "@/data/metadata.json";
import tracksIndex from "@/data/tracks-index.json";

import type { PreparedMetadata, PreparedSeason, TracksIndex } from "@/lib/types";

export async function getLatestPreparedData(): Promise<{
  metadata: PreparedMetadata;
  season: PreparedSeason;
  tracksIndex: TracksIndex;
}> {
  const season = (
    await import(`@/data/schedules/${metadata.latestSeasonSlug}.json`)
  ).default as PreparedSeason;

  return {
    metadata: metadata as PreparedMetadata,
    season,
    tracksIndex: tracksIndex as TracksIndex,
  };
}
