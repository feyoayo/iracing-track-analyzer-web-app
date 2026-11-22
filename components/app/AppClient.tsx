"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { AnalysisFilterDialog } from "@/components/analysis/AnalysisFilterDialog";
import { useAnalysisPreference } from "@/components/analysis/useAnalysisPreference";
import { useScheduleClock } from "@/lib/hooks/useScheduleClock";
import { AnalysisTable } from "@/components/analysis/AnalysisTable";
import { ExportButton } from "@/components/analysis/ExportButton";
import { AppShell } from "@/components/layout/AppShell";
import { analyzeSchedule } from "@/lib/analysis/analyzeSchedule";
import { collapseFixedSeries } from "@/lib/analysis/seriesVariants";
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
  const { t } = useI18n();
  const { season: normalizedSeason, resolveSelection } = useMemo(
    () => collapseFixedSeries(normalizePreparedSeason(season)), [season],
  );

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
  const exportResult = useMemo(
    () => analyzeSchedule(normalizedSeason, selectedSeries),
    [normalizedSeason, selectedSeries],
  );
  const result = useMemo(
    () => now ? analyzeSchedule(normalizedSeason, selectedSeries, preference.includePastWeeks ? undefined : now) : null,
    [normalizedSeason, selectedSeries, preference.includePastWeeks, now],
  );

  useEffect(() => {
    const fallbackClass = defaultClass;
    const stored = loadSelection();
    const saved = stored ? { ...stored, selectedSeries: resolveSelection(stored.selectedSeries) } : null;
    const favoriteNames = resolveSelection(initialFavoriteSeries);
    const favoriteSeries = normalizedSeason.series.filter((series) =>
      favoriteNames.includes(series.seriesName),
    );

    const urlClasses = readClassesQuery(window.location.search, classes);
    if (urlClasses !== null) {
      const allowedSeries = new Set(normalizedSeason.series
        .filter((series) => urlClasses.includes(series.seriesClass))
        .map((series) => series.seriesName));
      setSelectedClasses(urlClasses);
      setSelectedSeries((favoriteSeries.length
        ? favoriteSeries.map((series) => series.seriesName)
        : saved?.selectedSeries ?? [...allowedSeries]).filter((name) => allowedSeries.has(name)));
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
        : nextClassSeries,
    );
    setSelectionReady(true);
  }, [classes, defaultClass, initialFavoriteSeries, normalizedSeason.series, resolveSelection]);

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
      analysis={
        <AnalysisTable
          result={result}
          controls={
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <AnalysisFilterDialog
                  classes={classes}
                  series={normalizedSeason.series}
                  selectedClasses={selectedClasses}
                  selectedSeries={selectedSeries}
                  includePastWeeks={preference.includePastWeeks}
                  preferenceBusy={preference.busy}
                  onApply={(selection, includePastWeeks) => {
                    setSelectedClasses(selection.selectedClasses);
                    setSelectedSeries(selection.selectedSeries);
                    if (includePastWeeks !== preference.includePastWeeks) void preference.change(includePastWeeks);
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  {selectedClasses.map(value => t(value)).join(", ") || t("No classes")} · {t("{count} series", { count: selectedSeries.length })}
                  <span className="block text-xs">{t(preference.includePastWeeks ? "Full season" : "Upcoming weeks")}</span>
                </p>
              </div>
              <div className="w-full sm:w-auto"><ExportButton result={exportResult} /></div>
            </div>
          }
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
