"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { AnalysisFilters } from "@/components/analysis/AnalysisFilters";
import { AnalysisTable } from "@/components/analysis/AnalysisTable";
import { ExportButton } from "@/components/analysis/ExportButton";
import { AppShell } from "@/components/layout/AppShell";
import {
  analyzeSchedule,
  type AnalysisResult,
} from "@/lib/analysis/analyzeSchedule";
import { normalizePreparedSeason } from "@/lib/data/seriesClassOverrides";
import { loadSelection, saveSelection } from "@/lib/state/storage";
import type { PreparedSeason } from "@/lib/types";

export function AppClient({
  season,
  authSlot,
  utilitySlot,
  initialFavoriteSeries,
  ownedTrackIds,
  isAuthenticated,
}: {
  season: PreparedSeason;
  authSlot?: ReactNode;
  utilitySlot?: ReactNode;
  initialFavoriteSeries: string[];
  ownedTrackIds: number[];
  isAuthenticated: boolean;
}) {
  const normalizedSeason = useMemo(() => normalizePreparedSeason(season), [season]);

  const classes = useMemo(
    () => [...new Set(normalizedSeason.series.map((series) => series.seriesClass))],
    [normalizedSeason],
  );
  const [selectedClass, setSelectedClass] = useState(classes[0] ?? "");
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
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
    const favoriteSeries = normalizedSeason.series.filter((series) =>
      initialFavoriteSeries.includes(series.seriesName),
    );

    if (favoriteSeries.length > 0) {
      const favoriteCountsByClass = favoriteSeries.reduce<Record<string, number>>(
        (accumulator, series) => {
          accumulator[series.seriesClass] =
            (accumulator[series.seriesClass] ?? 0) + 1;
          return accumulator;
        },
        {},
      );

      const nextClass =
        classes.find(
          (seriesClass) =>
            favoriteCountsByClass[seriesClass] ===
            Math.max(...Object.values(favoriteCountsByClass)),
        ) ?? fallbackClass;

      setSelectedClass(nextClass);
      setSelectedSeries(
        favoriteSeries
          .filter((series) => series.seriesClass === nextClass)
          .map((series) => series.seriesName),
      );
      return;
    }

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
  }, [classes, initialFavoriteSeries, normalizedSeason.series]);

  useEffect(() => {
    setResult(analyzeSchedule(normalizedSeason, selectedSeries));
    saveSelection({
      selectedClass,
      selectedSeries,
    });
  }, [normalizedSeason, selectedClass, selectedSeries]);

  return (
    <AppShell
      seasonName={season.seasonName}
      authSlot={authSlot}
      utilitySlot={utilitySlot}
      controls={
        <>
          <AnalysisFilters
            classes={classes}
            selectedClass={selectedClass}
            seriesNames={classSeries}
            selectedSeries={selectedSeries}
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
          />
          <ExportButton result={result} />
        </>
      }
      analysis={
        <AnalysisTable
          result={result}
          ownedTrackIds={ownedTrackIds}
          isAuthenticated={isAuthenticated}
        />
      }
    />
  );
}
