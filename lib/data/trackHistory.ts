import type { PreparedSeason, TracksIndex } from "../types";

/** Replace only this season's history, retaining all other imported seasons. */
export function mergeSeasonIntoTracksIndex(index: TracksIndex, season: PreparedSeason): TracksIndex {
  const historical = index.tracks.filter(track => track.seasonName !== season.seasonName);
  const current = season.series.flatMap(series => series.weeks.map(week => ({
    ...week, seasonName: season.seasonName, seriesName: series.seriesName, seriesClass: series.seriesClass,
  })));
  return { tracks: [...historical, ...current].sort((a, b) =>
    b.seasonName.localeCompare(a.seasonName, "en", { numeric: true }) || b.weekNumber - a.weekNumber,
  ) };
}
