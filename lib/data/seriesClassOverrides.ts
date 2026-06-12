import type {
  PreparedSeason,
  PreparedSeries,
  TrackAppearance,
  TracksIndex,
} from "@/lib/types";

const SPORTS_CAR_OVERRIDES = new Set([
  "Advanced Mazda MX-5 Cup by Heusinkveld",
  "BMW M2 Cup",
  "Clio Cup",
  "Global Mazda MX-5 Cup by Fanatec",
  "LMP3 Trophy",
  "Radical Esports Cup",
  "Ring Meister by LVRY",
  "Toyota GR86 Cup by SIMAGIC",
]);

export function resolveSeriesClass(
  seriesName: string,
  seriesClass: string,
): string {
  if (SPORTS_CAR_OVERRIDES.has(seriesName)) {
    return "Sports Car";
  }

  return seriesClass;
}

function normalizeSeries(series: PreparedSeries): PreparedSeries {
  return {
    ...series,
    seriesClass: resolveSeriesClass(series.seriesName, series.seriesClass),
  };
}

function normalizeTrackAppearance(track: TrackAppearance): TrackAppearance {
  return {
    ...track,
    seriesClass: resolveSeriesClass(track.seriesName, track.seriesClass),
  };
}

export function normalizePreparedSeason(season: PreparedSeason): PreparedSeason {
  return {
    ...season,
    series: season.series.map(normalizeSeries),
  };
}

export function normalizeTracksIndex(index: TracksIndex): TracksIndex {
  return {
    tracks: index.tracks.map(normalizeTrackAppearance),
  };
}
