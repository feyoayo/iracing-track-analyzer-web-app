import type { PreparedSeason, TrackAppearance, TracksIndex } from "@/lib/types";

export type TrackDirectoryEntry = {
  trackId: number;
  trackName: string;
  currentSeasonAppears: number;
};

export type TrackUsageResult = {
  trackId: number;
  trackName: string;
  currentSeason: TrackAppearance[];
  history: TrackAppearance[];
};

function getCurrentSeasonUsage(
  season: PreparedSeason,
  trackId: number,
): TrackAppearance[] {
  return season.series.flatMap((series) =>
    series.weeks
      .filter((week) => week.trackId === trackId)
      .map((week) => ({
        trackId: week.trackId,
        trackName: week.trackName,
        seasonName: season.seasonName,
        seriesName: series.seriesName,
        seriesClass: series.seriesClass,
        weekNumber: week.weekNumber,
        raceDate: week.raceDate,
      })),
  );
}

export function buildTrackDirectory(season: PreparedSeason): TrackDirectoryEntry[] {
  const tracks = new Map<number, TrackDirectoryEntry>();

  for (const series of season.series) {
    for (const week of series.weeks) {
      const current = tracks.get(week.trackId);
      if (current) {
        current.currentSeasonAppears += 1;
        continue;
      }

      tracks.set(week.trackId, {
        trackId: week.trackId,
        trackName: week.trackName,
        currentSeasonAppears: 1,
      });
    }
  }

  return [...tracks.values()].sort((left, right) =>
    left.trackName.localeCompare(right.trackName),
  );
}

export function getTrackUsageById(
  season: PreparedSeason,
  index: TracksIndex,
  trackId: number,
): TrackUsageResult | null {
  const history = index.tracks.filter((track) => track.trackId === trackId);
  if (history.length === 0) {
    return null;
  }

  return {
    trackId,
    trackName: history[0].trackName,
    currentSeason: getCurrentSeasonUsage(season, trackId),
    history,
  };
}

export function findTrackUsage(
  season: PreparedSeason,
  index: TracksIndex,
  query: string,
): TrackUsageResult | null {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return null;
  }

  const firstMatch = index.tracks.find((track) =>
    track.trackName.toLowerCase().includes(needle),
  );
  if (!firstMatch) {
    return null;
  }

  return getTrackUsageById(
    season,
    index,
    firstMatch.trackId,
  );
}
