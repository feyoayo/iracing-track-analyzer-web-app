"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, Layers3, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnalysisResult } from "@/lib/analysis/analyzeSchedule";

export function AnalysisTable({
  result,
  ownedTrackIds,
  isAuthenticated,
  controls,
  preferenceBusy,
  preferenceError,
  onRetryPreference,
}: {
  result: AnalysisResult | null;
  ownedTrackIds: number[];
  isAuthenticated: boolean;
  controls: ReactNode;
  preferenceBusy: boolean;
  preferenceError: string | null;
  onRetryPreference: () => void;
}) {
  const { t } = useI18n();
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {t("Analysis")}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{t("Track overlap")}</h2>
        </div>
        <div className="grid justify-items-end gap-2">
          {result && result.seriesNames.length > 0 ? (
            <p className="text-right text-sm text-muted-foreground">
              {t("{tracks} tracks across {series} series", { tracks: result.tracks.length, series: result.seriesNames.length })}
            </p>
          ) : null}
          {preferenceError ? (
            <p role="status" className="max-w-xs text-right text-xs text-muted-foreground">
              {t(preferenceError)}{" "}
              <button type="button" disabled={preferenceBusy} onClick={onRetryPreference} className="underline underline-offset-2">
                {t("Retry")}
              </button>
            </p>
          ) : null}
        </div>
      </div>

      {controls}

      {!result || result.seriesNames.length === 0 ? (
        <div className="flex min-h-64 flex-col items-start justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-6">
          <h2 className="text-lg font-semibold">{t("Select at least one series")}</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t("The table updates from the selected class and series.")}
          </p>
        </div>
      ) : result.tracks.length === 0 ? (
        <div className="flex min-h-64 flex-col items-start justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-6">
          <h2 className="text-lg font-semibold">{t("No upcoming weeks")}</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t("The selected series have no remaining scheduled weeks. Enable Include past weeks to see their full schedule.")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <Route className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-[0.08em]">
                  {t("Tracks")}
                </span>
              </div>
              <strong className="text-2xl font-semibold">{result.tracks.length}</strong>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <Layers3 className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-[0.08em]">
                  {t("Series")}
                </span>
              </div>
              <strong className="text-2xl font-semibold">
                {result.seriesNames.length}
              </strong>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-[0.08em]">
                  {t("Top overlap")}
                </span>
              </div>
              <strong className="text-2xl font-semibold">
                {result.tracks[0]?.totalCount ?? 0}
              </strong>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>{t("Track")}</TableHead>
                  <TableHead>{t("Overlap")}</TableHead>
                  <TableHead>{t("Priority")}</TableHead>
                  {isAuthenticated ? <TableHead>{t("Status")}</TableHead> : null}
                  {result.seriesNames.map((seriesName) => (
                    <TableHead key={seriesName}>{seriesName}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.tracks.map((track) => (
                  <TableRow key={track.trackId}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/tracks/${track.trackId}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {track.trackName}
                      </Link>
                    </TableCell>
                    <TableCell>{track.totalCount}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="border-transparent"
                        style={{ backgroundColor: `#${track.priorityColor}` }}
                      >
                        {t(track.priority)}
                      </Badge>
                    </TableCell>
                    {isAuthenticated ? (
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            ownedTrackIds.includes(track.trackId)
                              ? "border-transparent bg-green-100 text-green-700"
                              : "border-transparent bg-red-100 text-red-700"
                          }
                        >
                          {t(ownedTrackIds.includes(track.trackId) ? "Owned" : "Not owned")}
                        </Badge>
                      </TableCell>
                    ) : null}
                    {result.seriesNames.map((seriesName) => (
                      <TableCell key={seriesName} className="text-center">
                        {track.seriesWeeks[seriesName] ? (
                          <Badge
                            variant="secondary"
                            className="min-w-11 justify-center bg-primary/10 text-primary"
                          >
                            {t("W{week}", { week: track.seriesWeeks[seriesName][0] })}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}
