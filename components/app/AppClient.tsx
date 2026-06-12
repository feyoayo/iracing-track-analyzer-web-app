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
  const classes = useMemo(
    () => [...new Set(season.series.map((series) => series.seriesClass))],
    [season],
  );
  const [selectedClass, setSelectedClass] = useState(classes[0] ?? "");
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [trackQuery, setTrackQuery] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const saved = loadSelection();
    if (!saved) {
      return;
    }

    setSelectedClass(saved.selectedClass || classes[0] || "");
    setSelectedSeries(saved.selectedSeries || []);
    setTrackQuery(saved.lastTrackQuery || "");
  }, [classes]);

  useEffect(() => {
    setResult(analyzeSchedule(season, selectedSeries));
    saveSelection({
      selectedClass,
      selectedSeries,
      lastTrackQuery: trackQuery,
    });
  }, [season, selectedClass, selectedSeries, trackQuery]);

  const classSeries = season.series
    .filter((series) => series.seriesClass === selectedClass)
    .map((series) => series.seriesName);

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
            onTrackQueryChange={setTrackQuery}
          />
          <ExportButton result={result} />
        </>
      }
      analysis={<AnalysisTable result={result} />}
      trackLookup={
        <TrackLookupPanel
          usage={findTrackUsage(season, tracksIndex, trackQuery)}
        />
      }
    />
  );
}
