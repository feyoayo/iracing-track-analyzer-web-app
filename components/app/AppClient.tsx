"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { AnalysisFilters } from "@/components/analysis/AnalysisFilters";
import { useAnalysisPreference } from "@/components/analysis/useAnalysisPreference";
import { useScheduleClock } from "@/lib/hooks/useScheduleClock";
import { AnalysisTable } from "@/components/analysis/AnalysisTable";
import { AppShell } from "@/components/layout/AppShell";
import { analyzeSchedule } from "@/lib/analysis/analyzeSchedule";
import { normalizePreparedSeason } from "@/lib/data/seriesClassOverrides";
import { loadSelection, saveSelection } from "@/lib/state/storage";
import { readClassesQuery, writeClassesQuery } from "@/lib/state/classQuery";
import type { PreparedSeason } from "@/lib/types";

export function AppClient({
  season,
  authSlot,
  utilitySlot,
  initialFavoriteSeries,
  ownedTrackIds,
  isAuthenticated,
  accountIncludePastWeeks = null,
}: {
  season: PreparedSeason;
  authSlot?: ReactNode;
  utilitySlot?: ReactNode;
  initialFavoriteSeries: string[];
  ownedTrackIds: number[];
  isAuthenticated: boolean;
  accountIncludePastWeeks?: boolean | null;
}) {
  const normalizedSeason = useMemo(() => normalizePreparedSeason(season), [season]);

  const classes = useMemo(
    () => [...new Set(normalizedSeason.series.map((series) => series.seriesClass))],
    [normalizedSeason],
  );
  const defaultClass = classes.includes("Sports Car") ? "Sports Car" : classes[0] ?? "";
  const [selectedClasses, setSelectedClasses] = useState<string[]>(defaultClass ? [defaultClass] : []);
  const [selectionReady, setSelectionReady] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const now = useScheduleClock();
  const preference = useAnalysisPreference(isAuthenticated, accountIncludePastWeeks);
  const result = useMemo(
    () => now ? analyzeSchedule(normalizedSeason, selectedSeries, preference.includePastWeeks ? undefined : now) : null,
    [normalizedSeason, selectedSeries, preference.includePastWeeks, now],
  );

  const classSeries = useMemo(
    () =>
      normalizedSeason.series
        .filter((series) => selectedClasses.includes(series.seriesClass))
        .map((series) => series.seriesName),
    [normalizedSeason, selectedClasses],
  );

  useEffect(() => {
    const fallbackClass = defaultClass;
    const saved = loadSelection();
    const favoriteSeries = normalizedSeason.series.filter((series) =>
      initialFavoriteSeries.includes(series.seriesName),
    );

    const urlClasses = readClassesQuery(window.location.search, classes);
    if (urlClasses !== null) {
      const allowedSeries = new Set(normalizedSeason.series
        .filter((series) => urlClasses.includes(series.seriesClass))
        .map((series) => series.seriesName));
      setSelectedClasses(urlClasses);
      setSelectedSeries((favoriteSeries.length
        ? favoriteSeries.map((series) => series.seriesName)
        : saved?.selectedSeries ?? []).filter((name) => allowedSeries.has(name)));
      setSelectionReady(true);
      return;
    }

    if (favoriteSeries.length > 0) {
      setSelectedClasses([...new Set(favoriteSeries.map((series) => series.seriesClass))]);
      setSelectedSeries(favoriteSeries.map((series) => series.seriesName));
      setSelectionReady(true);
      return;
    }

    const savedClasses = saved?.selectedClasses.filter((value) => classes.includes(value));
    const nextClasses = savedClasses && (savedClasses.length > 0 || saved?.selectedClasses.length === 0)
      ? savedClasses
      : fallbackClass ? [fallbackClass] : [];
    const nextClassSeries = normalizedSeason.series
      .filter((series) => nextClasses.includes(series.seriesClass))
      .map((series) => series.seriesName);

    setSelectedClasses(nextClasses);
    setSelectedSeries(
      saved
        ? saved.selectedSeries.filter((seriesName) =>
            nextClassSeries.includes(seriesName),
          )
        : [],
    );
    setSelectionReady(true);
  }, [classes, defaultClass, initialFavoriteSeries, normalizedSeason.series]);

  useEffect(() => {
    if (!selectionReady) return;
    saveSelection({
      selectedClasses,
      selectedSeries,
    });
    const nextUrl = writeClassesQuery(new URL(window.location.href), selectedClasses);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) window.history.replaceState(null, "", nextUrl);
  }, [normalizedSeason, selectedClasses, selectedSeries, selectionReady]);

  useEffect(() => {
    const restoreFromUrl = () => {
      const nextClasses = readClassesQuery(window.location.search, classes)
        ?? (defaultClass ? [defaultClass] : []);
      const allowedSeries = new Set(normalizedSeason.series
        .filter((series) => nextClasses.includes(series.seriesClass))
        .map((series) => series.seriesName));
      setSelectedClasses(nextClasses);
      setSelectedSeries((current) => current.filter((name) => allowedSeries.has(name)));
    };
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, [classes, defaultClass, normalizedSeason]);

  return (
    <AppShell
      season={season}
      authSlot={authSlot}
      utilitySlot={utilitySlot}
      controls={
        <>
          <AnalysisFilters
            classes={classes}
            selectedClasses={selectedClasses}
            seriesNames={classSeries}
            selectedSeries={selectedSeries}
            onClassToggle={(value) => {
              const nextClasses = selectedClasses.includes(value)
                ? selectedClasses.filter((item) => item !== value)
                : [...selectedClasses, value];
              setSelectedClasses(nextClasses);
              const allowedSeries = new Set(normalizedSeason.series
                .filter((series) => nextClasses.includes(series.seriesClass))
                .map((series) => series.seriesName));
              setSelectedSeries((current) => current.filter((name) => allowedSeries.has(name)));
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
        </>
      }
      analysis={
        <AnalysisTable
          result={result}
          includePastWeeks={preference.includePastWeeks}
          onIncludePastWeeksChange={preference.change}
          preferenceBusy={preference.busy}
          preferenceError={preference.error}
          onRetryPreference={preference.retry}
          ownedTrackIds={ownedTrackIds}
          isAuthenticated={isAuthenticated}
        />
      }
    />
  );
}
