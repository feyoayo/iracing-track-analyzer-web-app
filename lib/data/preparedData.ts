import "server-only";
import { connection } from "next/server";
import { cacheLife } from "next/cache";
import tracksIndex from "@/data/tracks-index.json";
import { getCurrentPreparedSeason } from "@/lib/db/schedules";
import { mergeSeasonIntoTracksIndex } from "@/lib/data/trackHistory";

import type { PreparedMetadata, PreparedSeason, TracksIndex } from "@/lib/types";

export async function getLatestPreparedData(): Promise<{
  metadata: PreparedMetadata;
  season: PreparedSeason;
  tracksIndex: TracksIndex;
}> {
  // Database schedules are request-time data; builds must not open a connection.
  await connection();
  return getCachedPreparedData();
}

async function getCachedPreparedData() {
  "use cache";
  cacheLife("hours");

  const season = await getCurrentPreparedSeason();

  return {
    metadata: { latestSeasonSlug: season.seasonSlug, latestSeasonName: season.seasonName },
    season,
    tracksIndex: mergeSeasonIntoTracksIndex(tracksIndex as TracksIndex, season),
  };
}
