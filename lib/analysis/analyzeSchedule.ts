import { resolvePriority } from "@/lib/analysis/priority";
import type { PreparedSeason } from "@/lib/types";

export type AnalysisTrack = {
  trackId: number;
  trackName: string;
  totalCount: number;
  classCounts: Record<string, number>;
  seriesWeeks: Record<string, [number, string]>;
  priority: string;
  priorityColor: string;
};

export type AnalysisResult = {
  seasonName: string;
  seriesNames: string[];
  tracks: AnalysisTrack[];
};

type MutableTrack = {
  trackId: number;
  trackName: string;
  classCounts: Record<string, number>;
  seriesWeeks: Record<string, [number, string]>;
};

export function analyzeSchedule(
  season: PreparedSeason,
  selectedSeriesNames: string[],
): AnalysisResult {
  const selectedSeries = season.series.filter((series) =>
    selectedSeriesNames.includes(series.seriesName),
  );
  const trackData = new Map<number, MutableTrack>();

  for (const series of selectedSeries) {
    for (const week of series.weeks) {
      const existing = trackData.get(week.trackId) ?? {
        trackId: week.trackId,
        trackName: week.trackName,
        classCounts: {},
        seriesWeeks: {},
      };

      if (!existing.seriesWeeks[series.seriesName]) {
        existing.seriesWeeks[series.seriesName] = [
          week.weekNumber,
          week.raceDate || "",
        ];
      }

      existing.classCounts[series.seriesClass] =
        (existing.classCounts[series.seriesClass] ?? 0) + 1;

      trackData.set(week.trackId, existing);
    }
  }

  const tracks = [...trackData.values()]
    .map((track) => {
      const totalCount = Object.keys(track.seriesWeeks).length;
      const [priority, priorityColor] = resolvePriority(totalCount);

      return {
        ...track,
        totalCount,
        priority,
        priorityColor,
      };
    })
    .sort((left, right) => right.totalCount - left.totalCount);

  return {
    seasonName: season.seasonName,
    seriesNames: selectedSeriesNames,
    tracks,
  };
}
