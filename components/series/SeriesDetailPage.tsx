"use client";

import { formatRaceDate } from "@/lib/i18n/messages";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { PreparedSeason } from "@/lib/types";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Layers3 } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PreparedSeries } from "@/lib/types";

export function SeriesDetailPage({
  season,
  seasonName,
  series,
  authSlot,
  utilitySlot,
}: {
  season: PreparedSeason;
  seasonName: string;
  series: PreparedSeries;
  authSlot?: ReactNode;
  utilitySlot?: ReactNode;
}) {
  const { t, locale } = useI18n();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 pb-24 md:px-6">
      <SiteHeader
        currentTab="series"
        season={season}
        title={series.seriesName}
        description="Current-season schedule for the selected series."
        authSlot={authSlot}
        utilitySlot={utilitySlot}
      />

      <div>
        <Link
          href="/series"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Back to series")}
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="grid gap-4">
          <Card>
            <CardContent className="grid gap-4 p-5">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers3 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.12em]">
                    {t("Class")}
                  </span>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {t(series.seriesClass)}
                </Badge>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.12em]">
                    {t("Weeks")}
                  </span>
                </div>
                <strong className="text-3xl font-semibold">
                  {series.weeks.length}
                </strong>
                <p className="text-sm text-muted-foreground">
                  {t("Scheduled rounds in {season}", { season: seasonName })}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>

        <Card>
          <CardContent className="grid gap-4 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {t("Series schedule")}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{t("Current season plan")}</h2>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>{t("Week")}</TableHead>
                    <TableHead>{t("Date")}</TableHead>
                    <TableHead>{t("Track")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {series.weeks.map((week) => (
                    <TableRow key={`${week.trackId}-${week.weekNumber}`}>
                      <TableCell>{t("W{week}", { week: week.weekNumber })}</TableCell>
                      <TableCell>{formatRaceDate(week.raceDate, locale)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/tracks/${week.trackId}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {week.trackName}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
