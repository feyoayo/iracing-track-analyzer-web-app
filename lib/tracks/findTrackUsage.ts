import type { PreparedSeason, TrackAppearance, TracksIndex } from "@/lib/types";

export type TrackUsageResult = {
  trackId: number;
  trackName: string;
  currentSeason: TrackAppearance[];
  history: TrackAppearance[];
};

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

  const currentSeason = season.series.flatMap((series) =>
    series.weeks
      .filter((week) => week.trackId === firstMatch.trackId)
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

  const history = index.tracks.filter(
    (track) => track.trackId === firstMatch.trackId,
  );

  return {
    trackId: firstMatch.trackId,
    trackName: firstMatch.trackName,
    currentSeason,
    history,
  };
}
