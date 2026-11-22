import type { PreparedSeason } from "@/lib/types";

const isFixed = (name: string) => /\bfixed\b/i.test(name);
const seriesKey = (name: string) => name.toLowerCase()
  .replace(/\bfixed\b/g, "")
  .replace(/\s+-\s*/g, " ")
  .replace(/\s+/g, " ")
  .trim();

// Only collapse Fixed variants when a regular counterpart exists in this season.
export function collapseFixedSeries(season: PreparedSeason) {
  const regular = season.series.filter(series => !isFixed(series.seriesName));
  const aliases = new Map<string, string>();
  for (const series of season.series) {
    if (!isFixed(series.seriesName)) continue;
    const counterpart = regular.find(candidate => candidate.seriesClass === series.seriesClass
      && ((series.linkedTo != null && candidate.id === series.linkedTo)
        || seriesKey(candidate.seriesName) === seriesKey(series.seriesName)));
    if (counterpart) aliases.set(series.seriesName, counterpart.seriesName);
  }
  return {
    season: { ...season, series: season.series.filter(series => !aliases.has(series.seriesName)) },
    resolveSelection: (names: string[]) => [...new Set(names.map(name => aliases.get(name) ?? name))],
  };
}
