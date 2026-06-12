"use client";

import { useEffect, useMemo, useState } from "react";

import { AnalysisFilters } from "@/components/analysis/AnalysisFilters";
import { AnalysisTable } from "@/components/analysis/AnalysisTable";
import { ExportButton } from "@/components/analysis/ExportButton";
import { AppShell } from "@/components/layout/AppShell";
import { TrackLookupPanel } from "@/components/tracks/TrackLookupPanel";
import {
  analyzeSchedule,
  type AnalysisResult,
} from "@/lib/analysis/analyzeSchedule";
import {
  normalizePreparedSeason,
  normalizeTracksIndex,
} from "@/lib/data/seriesClassOverrides";
import { loadSelection, saveSelection } from "@/lib/state/storage";
import { findTrackUsage } from "@/lib/tracks/findTrackUsage";
import type { PreparedSeason, TracksIndex } from "@/lib/types";

export function AppClient({
  season,
  tracksIndex,
}: {
  season: PreparedSeason;
  tracksIndex: TracksIndex;
}) {
  const normalizedSeason = useMemo(() => normalizePreparedSeason(season), [season]);
  const normalizedTracksIndex = useMemo(
    () => normalizeTracksIndex(tracksIndex),
    [tracksIndex],
  );

  const classes = useMemo(
    () => [...new Set(normalizedSeason.series.map((series) => series.seriesClass))],
    [normalizedSeason],
  );
  const [selectedClass, setSelectedClass] = useState(classes[0] ?? "");
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [trackQuery, setTrackQuery] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const classSeries = useMemo(
    () =>
      normalizedSeason.series
        .filter((series) => series.seriesClass === selectedClass)
        .map((series) => series.seriesName),
    [normalizedSeason, selectedClass],
  );

  useEffect(() => {
    const fallbackClass = classes[0] || "";
    const saved = loadSelection();
    const nextClass =
      saved?.selectedClass && classes.includes(saved.selectedClass)
        ? saved.selectedClass
        : fallbackClass;
    const nextClassSeries = normalizedSeason.series
      .filter((series) => series.seriesClass === nextClass)
      .map((series) => series.seriesName);

    setSelectedClass(nextClass);
    setSelectedSeries(
      saved
        ? saved.selectedSeries.filter((seriesName) =>
            nextClassSeries.includes(seriesName),
          )
        : [],
    );
    setTrackQuery(saved?.lastTrackQuery || "");
  }, [classes, normalizedSeason.series]);

  useEffect(() => {
    setResult(analyzeSchedule(normalizedSeason, selectedSeries));
    saveSelection({
      selectedClass,
      selectedSeries,
      lastTrackQuery: trackQuery,
    });
  }, [normalizedSeason, selectedClass, selectedSeries, trackQuery]);

  const usage = findTrackUsage(normalizedSeason, normalizedTracksIndex, trackQuery);

  return (
    <AppShell
      seasonName={season.seasonName}
      controls={
        <>
          <AnalysisFilters
            classes={classes}
            selectedClass={selectedClass}
            seriesNames={classSeries}
            selectedSeries={selectedSeries}
            trackQuery={trackQuery}
            onClassChange={(value) => {
              setSelectedClass(value);
              setSelectedSeries([]);
            }}
            onSeriesToggle={(value) =>
              setSelectedSeries((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value],
              )
            }
            onSelectAllSeries={() => setSelectedSeries(classSeries)}
            onClearSeries={() => setSelectedSeries([])}
            onTrackQueryChange={setTrackQuery}
          />
          <ExportButton result={result} />
        </>
      }
      analysis={<AnalysisTable result={result} />}
      trackLookup={<TrackLookupPanel usage={usage} query={trackQuery} />}
    />
  );
}
