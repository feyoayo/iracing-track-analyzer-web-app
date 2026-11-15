export type PreparedWeek = {
  trackId: number;
  trackName: string;
  weekNumber: number;
  raceDate: string;
};

export type PreparedSeries = {
  id?: number;
  linkedTo?: number | null;
  seriesName: string;
  seriesClass: string;
  weeks: PreparedWeek[];
};

export type PreparedSeason = {
  seasonSlug: string;
  seasonName: string;
  series: PreparedSeries[];
};

export type PreparedMetadata = {
  latestSeasonSlug: string;
  latestSeasonName: string;
};

export type TrackAppearance = {
  trackId: number;
  trackName: string;
  seasonName: string;
  seriesName: string;
  seriesClass: string;
  weekNumber: number;
  raceDate: string;
};

export type TracksIndex = {
  tracks: TrackAppearance[];
};
